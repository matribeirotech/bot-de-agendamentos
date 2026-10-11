from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.response import Response
from core.models import Tenant
from scheduling.models import Client
from .models import BotConfiguration, CustomBotResponse
from .serializers import BotConfigurationSerializer, CustomBotResponseSerializer
from .state_machine import BotStateMachine

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

