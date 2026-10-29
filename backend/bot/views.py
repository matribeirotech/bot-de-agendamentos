import json
import os
import re
import urllib.request
import urllib.error
import urllib.parse
from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.response import Response
from core.models import Tenant
from scheduling.models import Client, Appointment
from .models import BotConfiguration, CustomBotResponse
from .serializers import BotConfigurationSerializer, CustomBotResponseSerializer
from .state_machine import BotStateMachine


def _resolve_active_tenant(request):
    tenant_id = request.query_params.get('tenant_id') or request.data.get('tenant_id')
    if tenant_id:
        try:
            return Tenant.objects.get(id=tenant_id)
        except (Tenant.DoesNotExist, ValueError):
            pass
    if getattr(request, 'user', None) and getattr(request.user, 'is_authenticated', False):
        user_tenant = getattr(request.user, 'tenant', None)
        if user_tenant:
            return user_tenant
    tenant = Tenant.objects.first()
    if not tenant:
        tenant = Tenant.objects.create(name='Principal', slug='principal')
    return tenant


def _normalize_phone_digits(raw_phone):
    if not raw_phone:
        return ''
    digits = re.sub(r'\D', '', str(raw_phone))
    if len(digits) in (10, 11):
        return f"55{digits}"
    return digits


def _get_greeting_ptbr():
    now_local = timezone.localtime(timezone.now())
    hour = now_local.hour
    if 5 <= hour < 12:
        return 'Bom dia'
    if 12 <= hour < 18:
        return 'Boa tarde'
    return 'Boa noite'


def _interpolate_campaign_message(template, full_name, business_name):
    clean_full = (full_name or 'Cliente').strip()
    first_name = clean_full.split()[0] if clean_full else 'Cliente'
    greeting = _get_greeting_ptbr()
    estab = (business_name or 'nosso espaço').strip()

    msg = str(template or '')
    msg = msg.replace('{nome_cliente}', first_name)
    msg = msg.replace('{primeiro_nome}', first_name)
    msg = msg.replace('{nome_completo}', clean_full)
    msg = msg.replace('{estabelecimento}', estab)
    msg = msg.replace('{saudacao}', greeting)
    return msg.strip()


def _query_worker(path, method='GET', payload=None, timeout=15):
    candidate_bases = []
    env_url = os.environ.get('WHATSAPP_WORKER_URL')
    if env_url:
        candidate_bases.append(env_url.rstrip('/'))
    candidate_bases.extend(['http://whatsapp-worker:3001', 'http://localhost:3001'])

    seen = set()
    for base in candidate_bases:
        if base in seen:
            continue
        seen.add(base)
        url = f"{base}{path}"
        try:
            body_bytes = None
            headers = {'Accept': 'application/json'}
            if payload is not None:
                body_bytes = json.dumps(payload).encode('utf-8')
                headers['Content-Type'] = 'application/json'
            req = urllib.request.Request(url, data=body_bytes, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read().decode('utf-8')
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as http_err:
            try:
                err_body = http_err.read().decode('utf-8')
                return json.loads(err_body)
            except Exception:
                continue
        except Exception:
            continue
    return None


def _build_segmented_clients(tenant):
    now = timezone.now()
    cutoff_30d = now - timedelta(days=30)

    clients_qs = Client.objects.filter(tenant=tenant).prefetch_related('appointments__service').order_by('-last_interaction')
    seen_phones = set()
    segmented = []

    for c in clients_qs:
        digits = _normalize_phone_digits(c.phone_number)
        # Ignora registros vazios ou IDs internos longos sem número telefônico válido
        if len(digits) < 10 or len(digits) > 14:
            continue
        if digits in seen_phones:
            continue
        seen_phones.add(digits)

        valid_apps = [
            a for a in c.appointments.all()
            if a.status not in ('CANCELLED', 'CANCELED')
        ]
        valid_apps.sort(key=lambda a: a.start_time, reverse=True)
        latest_app = valid_apps[0] if valid_apps else None

        reference_dt = latest_app.start_time if latest_app else c.last_interaction
        if reference_dt:
            days_since = max(0, (now - reference_dt).days)
            is_active = reference_dt >= cutoff_30d
        else:
            days_since = None
            is_active = False

        audience_type = 'active' if is_active else 'inactive'
        clean_name = (c.full_name or 'Cliente').strip()
        first_name = clean_name.split()[0] if clean_name else 'Cliente'

        segmented.append({
            'id': str(c.id),
            'full_name': clean_name,
            'first_name': first_name,
            'phone_number': digits,
            'audience_type': audience_type,
            'last_service': latest_app.service.name if (latest_app and latest_app.service_id) else None,
            'last_visit_date': latest_app.start_time.isoformat() if latest_app else (c.last_interaction.isoformat() if c.last_interaction else None),
            'days_since_last': days_since,
            'total_appointments': len(valid_apps),
        })

    return segmented

# Importante: Como o Node.js Worker enviará requisições internas, 
# a autenticação pode ser via API Key (Headers) nos sistemas reais.
class WhatsAppWebhookView(APIView):
    authentication_classes = [] # Desligado para o webhook interno MVP
    permission_classes = []

    def post(self, request):
        """
        Recebe payload do Node.js Worker:
        {
            "tenant_id": "uuid",
            "phone_number": "5511999999999",
            "full_name": "Maria",
            "message": "Olá",
            "is_contact_saved": false
        }
        """
        data = request.data
        tenant_id = data.get('tenant_id')
        phone_number = data.get('phone_number')
        full_name = data.get('full_name', 'Cliente')
        message = data.get('message', '').strip()
        is_contact_saved = data.get('is_contact_saved', False)

        tenant = None
        if tenant_id:
            try:
                tenant = Tenant.objects.get(id=tenant_id)
            except (Tenant.DoesNotExist, ValueError):
                pass
        if not tenant:
            tenant = Tenant.objects.first()
        if not tenant:
            tenant = Tenant.objects.create(name='Principal', slug='principal')

        # Registra ou recupera o cliente
        client, _ = Client.objects.get_or_create(
            tenant=tenant, 
            phone_number=phone_number,
            defaults={'full_name': full_name}
        )

        print(f"📥 [Webhook Django] Mensagem de {phone_number} ({full_name}): '{message}' | Tenant: {tenant.name}")

        fsm = BotStateMachine(tenant=tenant, client=client)
        response_text = fsm.process_message(message, is_contact_saved)

        print(f"📤 [Webhook Django] Resposta para {phone_number}: '{response_text[:40] if response_text else 'Silêncio (Filtro/Desativado)'}'")

        # Retorna o texto que o Worker deve enviar de volta ao usuário do WhatsApp
        return Response({"reply": response_text})


class BotConfigurationView(APIView):
    authentication_classes = []
    permission_classes = []

    def get_tenant(self, request):
        tenant_id = request.query_params.get('tenant_id')
        if tenant_id:
            try:
                return Tenant.objects.get(id=tenant_id)
            except Tenant.DoesNotExist:
                pass
        tenant = Tenant.objects.first()
        if not tenant:
            tenant = Tenant.objects.create(name='Principal', slug='principal')
        return tenant

    def get(self, request):
        tenant = self.get_tenant(request)
        config, _ = BotConfiguration.objects.get_or_create(tenant=tenant)
        serializer = BotConfigurationSerializer(config)
        data = dict(serializer.data)
        data['business_name'] = tenant.name
        return Response(data)

    def post(self, request):
        tenant = self.get_tenant(request)
        business_name = request.data.get('business_name')
        if business_name and isinstance(business_name, str) and business_name.strip():
            tenant.name = business_name.strip()
            tenant.save()

        config, _ = BotConfiguration.objects.get_or_create(tenant=tenant)
        serializer = BotConfigurationSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            data = dict(serializer.data)
            data['business_name'] = tenant.name
            return Response(data)
        return Response(serializer.errors, status=400)


class MarketingAudienceView(APIView):
    """
    Retorna a base de clientes segmentada em Todos, Ativos (<30d) e Ausentes (+30d)
    e o status em tempo real da conexão do WhatsApp.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        tenant = _resolve_active_tenant(request)
        segmented = _build_segmented_clients(tenant)
        active_list = [c for c in segmented if c['audience_type'] == 'active']
        inactive_list = [c for c in segmented if c['audience_type'] == 'inactive']

        worker_status = _query_worker('/status', method='GET', timeout=3) or {}
        worker_connected = bool(worker_status.get('connected', False))

        return Response({
            'business_name': tenant.name,
            'worker_connected': worker_connected,
            'counts': {
                'all': len(segmented),
                'active': len(active_list),
                'inactive': len(inactive_list),
            },
            'clients': segmented,
        })


class MarketingBroadcastView(APIView):
    """
    Executa ou prepara o disparo personalizado de campanhas via WhatsApp.
    - Se o WhatsApp estiver conectado no servidor, dispara automaticamente com intervalo seguro.
    - Retorna também a fila personalizada com links diretos wa.me para disparo 1-toque pelo celular.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        tenant = _resolve_active_tenant(request)
        data = request.data or {}

        audience = data.get('audience', 'all')
        message_template = (data.get('message_template') or data.get('message') or '').strip()
        business_name = (data.get('business_name') or tenant.name or 'Meu Estabelecimento').strip()
        dispatch_mode = data.get('dispatch_mode', 'auto')  # 'auto' | 'manual_only'
        custom_recipients = data.get('recipients')

        if not message_template:
            return Response({'error': 'Digite uma mensagem antes de iniciar o envio.'}, status=400)

        target_clients = []
        if isinstance(custom_recipients, list) and len(custom_recipients) > 0:
            seen = set()
            for r in custom_recipients:
                digits = _normalize_phone_digits(r.get('phone_number') or r.get('phone'))
                if len(digits) < 10:
                    continue
                if digits in seen:
                    continue
                seen.add(digits)
                name = (r.get('full_name') or r.get('name') or 'Cliente').strip()
                target_clients.append({
                    'full_name': name,
                    'first_name': name.split()[0] if name else 'Cliente',
                    'phone_number': digits,
                })
        else:
            all_segmented = _build_segmented_clients(tenant)
            if audience == 'active':
                target_clients = [c for c in all_segmented if c['audience_type'] == 'active']
            elif audience == 'inactive':
                target_clients = [c for c in all_segmented if c['audience_type'] == 'inactive']
            else:
                target_clients = all_segmented

        if not target_clients:
            return Response({
                'success': False,
                'total': 0,
                'error': 'Nenhum contato encontrado neste público. Adicione um número rápido ou cadastre um agendamento.'
            }, status=400)

        prepared_queue = []
        worker_payload_items = []
        for client in target_clients:
            personalized_text = _interpolate_campaign_message(
                message_template,
                client.get('full_name'),
                business_name
            )
            digits = client['phone_number']
            wa_link = f"https://wa.me/{digits}?text={urllib.parse.quote(personalized_text)}"
            prepared_queue.append({
                'name': client.get('full_name', 'Cliente'),
                'first_name': client.get('first_name', 'Cliente'),
                'phone': digits,
                'message': personalized_text,
                'wa_link': wa_link,
                'status': 'pending',
            })
            worker_payload_items.append({
                'name': client.get('full_name', 'Cliente'),
                'phone': digits,
                'message': personalized_text,
            })

        # Se o usuário pediu fila manual 1-toque no celular, retorna imediatamente a fila pronta
        if dispatch_mode == 'manual_only':
            return Response({
                'success': True,
                'mode': 'manual_queue',
                'worker_connected': False,
                'total': len(prepared_queue),
                'sent_count': 0,
                'failed_count': 0,
                'queue': prepared_queue,
            })

        # Verifica conexão ativa do WhatsApp Worker para disparo 100% automático
        worker_status = _query_worker('/status', method='GET', timeout=3) or {}
        if worker_status.get('connected'):
            estimated_timeout = max(20, len(worker_payload_items) * 3)
            broadcast_res = _query_worker(
                '/broadcast',
                method='POST',
                payload={'recipients': worker_payload_items, 'delayMs': 1100},
                timeout=estimated_timeout
            )
            if broadcast_res and broadcast_res.get('success'):
                results_by_phone = {
                    _normalize_phone_digits(r.get('phone')): r
                    for r in (broadcast_res.get('results') or [])
                }
                for item in prepared_queue:
                    match = results_by_phone.get(item['phone'])
                    if match:
                        item['status'] = match.get('status', 'sent')
                        if match.get('error'):
                            item['error'] = match['error']

                return Response({
                    'success': True,
                    'mode': 'automated',
                    'worker_connected': True,
                    'total': len(prepared_queue),
                    'sent_count': broadcast_res.get('sentCount', 0),
                    'failed_count': broadcast_res.get('failedCount', 0),
                    'queue': prepared_queue,
                })

        # Fallback inteligente: entrega a fila 1-toque pronta para disparo imediato pelo WhatsApp do celular
        return Response({
            'success': True,
            'mode': 'manual_queue',
            'worker_connected': False,
            'total': len(prepared_queue),
            'sent_count': 0,
            'failed_count': 0,
            'queue': prepared_queue,
        })


