import datetime
import re
from bot.models import BotState
from scheduling.models import Appointment
from catalog.models import Service
from integrations.services import GoogleCalendarService

class BotStateMachine:
    def __init__(self, tenant, client):
        self.tenant = tenant
        self.client = client
        self.state_record, _ = BotState.objects.get_or_create(tenant=tenant, client=client)

    def process_message(self, message_text, is_contact_saved):
        """
        Processa a mensagem recebida. Retorna o texto de resposta.
        """
        state = self.state_record.current_state
        msg = message_text.strip().lower()

        # Filtro de Privacidade: Ignora contatos salvos (a não ser que digitem o gatilho)
        if is_contact_saved and state == 'IDLE' and '#agendar' not in msg:
            return None # Não responde, pois é uma conversa pessoal
        
        # Reset rápido
        if msg == 'cancelar' or msg == 'sair':
            self.update_state('IDLE')
            return "Agendamento cancelado. Se precisar de algo, é só mandar mensagem!"

        # FSM Routing
        if state == 'IDLE':
            return self.handle_idle()
        elif state == 'AWAITING_SERVICE':
            return self.handle_awaiting_service(msg)
        elif state == 'AWAITING_DATE':
            return self.handle_awaiting_date(msg)
        elif state == 'AWAITING_TIME':
            return self.handle_awaiting_time(msg)
            
        return "Desculpe, não entendi. Digite 'cancelar' para reiniciar."

    def update_state(self, new_state, context=None):
        self.state_record.current_state = new_state
        if context is not None:
            self.state_record.context_data = context
        self.state_record.save()

    def handle_idle(self):
        services = Service.objects.filter(tenant=self.tenant, is_active=True)
        if not services.exists():
            return "No momento não temos serviços disponíveis para agendamento online."
            
        text = "Olá! Seja bem-vindo(a) ao agendamento automático da Lypsyos.\n\n"
        text += "Responda com o *NÚMERO* do serviço desejado:\n"
        
        service_map = {}
        for idx, svc in enumerate(services, 1):
            text += f"{idx} - {svc.name} (R$ {svc.price})\n"
            service_map[str(idx)] = str(svc.id)
            
        self.update_state('AWAITING_SERVICE', {'service_map': service_map})
        return text

    def handle_awaiting_service(self, msg):
        service_map = self.state_record.context_data.get('service_map', {})
        if msg not in service_map:
            return "Opção inválida. Por favor, digite apenas o NÚMERO do serviço desejado."
            
        self.state_record.context_data['selected_service_id'] = service_map[msg]
        self.update_state('AWAITING_DATE', self.state_record.context_data)
        
        return "Ótima escolha! Para qual *data* você gostaria de agendar? (Ex: Hoje, Amanhã, 15/10)"

    def handle_awaiting_date(self, msg):
        # Lógica simplificada de conversão de data para MVP
        today = datetime.date.today()
        target_date = None
        
        if 'hoje' in msg:
            target_date = today
        elif 'amanh' in msg:
            target_date = today + datetime.timedelta(days=1)
        else:
            match = re.search(r'(\d{1,2})/(\d{1,2})', msg)
            if match:
                day, month = int(match.group(1)), int(match.group(2))
                try:
                    target_date = datetime.date(today.year, month, day)
                    if target_date < today: # Se for proximo ano
                        target_date = datetime.date(today.year + 1, month, day)
                except ValueError:
                    return "Data inválida. Tente no formato DD/MM (ex: 15/10)."
            else:
                return "Não consegui entender a data. Diga 'hoje', 'amanhã' ou 'DD/MM' (ex: 15/10)."

        date_str = target_date.strftime('%Y-%m-%d')
        
        # Consulta disponibilidade
        try:
            gcal_service = GoogleCalendarService(self.tenant)
            busy_slots = gcal_service.get_free_busy(date_str)
            # No MVP, simplesmente pede a hora. Em prod, subtrairia ocupados das horas comerciais.
        except Exception:
            pass # Ignora erro no Gcal por enquanto se não estiver configurado
            
        self.state_record.context_data['selected_date'] = date_str
        self.update_state('AWAITING_TIME', self.state_record.context_data)
        
        return f"Perfeito, data {target_date.strftime('%d/%m/%Y')} anotada! Qual *horário*? (Ex: 14:00, 14h)"

    def handle_awaiting_time(self, msg):
        match = re.search(r'(\d{1,2})[:h](\d{2})?', msg)
        if not match:
            return "Não entendi o horário. Use o formato HH:MM (ex: 14:30)."
            
        hour = int(match.group(1))
        minute = int(match.group(2)) if match.group(2) else 0
        
        date_str = self.state_record.context_data['selected_date']
        service_id = self.state_record.context_data['selected_service_id']
        
        from django.utils.timezone import make_aware
        service = Service.objects.get(id=service_id)
        start_time_naive = datetime.datetime.strptime(date_str, "%Y-%m-%d").replace(hour=hour, minute=minute)
        start_time = make_aware(start_time_naive)
        end_time = start_time + datetime.timedelta(minutes=service.duration_minutes)
        
        # Cria o agendamento
        appointment = Appointment.objects.create(
            tenant=self.tenant,
            client=self.client,
            service=service,
            start_time=start_time,
            end_time=end_time,
            status='CONFIRMED'
        )
        
        # A chamada de perform_create no view envia para o gcal, mas criamos direto no ORM aqui
        try:
            gcal_service = GoogleCalendarService(self.tenant)
            event_id = gcal_service.create_event(appointment)
            if event_id:
                appointment.google_event_id = event_id
                appointment.save()
        except:
            pass
            
        self.update_state('IDLE', {})
        return f"✅ Tudo certo! Seu horário para {service.name} está confirmado para {start_time.strftime('%d/%m/%Y às %H:%M')}."

