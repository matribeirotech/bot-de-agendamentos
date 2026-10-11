import datetime
import re
from django.utils import timezone
from django.utils.timezone import localtime, make_aware
from bot.models import BotState, BotConfiguration
from scheduling.models import Appointment, BusinessHour
from catalog.models import Service
from integrations.services import GoogleCalendarService

class BotStateMachine:
    def __init__(self, tenant, client):
        self.tenant = tenant
        self.client = client
        self.state_record, _ = BotState.objects.get_or_create(tenant=tenant, client=client)
        self.config, _ = BotConfiguration.objects.get_or_create(tenant=tenant)

    def process_message(self, message_text, is_contact_saved):
        """
        Processa a mensagem recebida no fluxo de URA Numérica Inteligente.
        Auto-greeting no primeiro contato, listagem dinâmica por segmento e atalhos configuráveis.
        """
        if not self.config.bot_enabled:
            return None

        state = self.state_record.current_state
        msg = message_text.strip().lower()

        trigger_schedule = (self.config.trigger_schedule or '1').strip().lower()
        trigger_attendant = (self.config.trigger_attendant or '2').strip().lower()
        trigger_location = (self.config.trigger_location or '3').strip().lower()
        trigger_exit = (self.config.trigger_exit or '0').strip().lower()

        # Filtro de privacidade para contatos salvos da agenda pessoal
        if self.config.ignore_saved_contacts and is_contact_saved and state == 'IDLE':
            explicit_triggers = ['/agendar', '#agendar', 'agendar']
            if msg not in explicit_triggers:
                print(f"🤫 [Filtro Silêncio] Contato salvo {self.client.phone_number} enviou '{msg}'. Robô em silêncio (aguardando /agendar).")
                return None
            else:
                print(f"🚀 [Filtro Gatilho] Contato salvo {self.client.phone_number} digitou '{msg}'. Iniciando agendamento direto!")
                return self.handle_start_scheduling()

        # 0. Comando universal de Menu / Saudação inicial
        if msg in ['menu', 'início', 'inicio', 'voltar', 'reiniciar', 'começar', 'comecar', 'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hi'] and state != 'IDLE':
            self.update_state('IDLE', {})
            return self.handle_greeting_menu()

        # 1. Encerramento / Cancelamento
        if msg in [trigger_exit, '0', 'sair', 'cancelar', 'finalizar', 'encerrar']:
            self.update_state('IDLE', {})
            return "Atendimento finalizado. Se precisar de algo mais, estamos à disposição! Tenha um ótimo dia! 👋"

        # 2. Transferência para Atendente Humano
        if msg in [trigger_attendant, 'atendente', 'humano', 'falar com atendente']:
            self.update_state('IDLE', {})
            return "Transferindo seu contato para nossa equipe... Um atendente responderá aqui em instantes! 💬"

        # 3. Informações de Endereço / Localização
        if msg in [trigger_location, 'localizacao', 'localização', 'endereco', 'endereço', 'onde fica']:
            return (
                f"📍 *Localização & Atendimento:*\n"
                f"{self.tenant.name}\n"
                f"Atendimento presencial com hora marcada.\n\n"
                f"Digite *{trigger_schedule}* para iniciar seu agendamento ou *{trigger_exit}* para finalizar."
            )

        # 4. Roteamento por Estado
        if state == 'IDLE':
            # Se a mensagem for o gatilho de agendamento (ex: '1', 'agendar', '#agendar')
            if msg in [trigger_schedule, '#agendar', 'agendar', 'marcar', 'horario', 'horário']:
                return self.handle_start_scheduling()

            # Caso contrário: Auto-Greeting Automático no primeiro contato
            return self.handle_greeting_menu()

        elif state == 'AWAITING_SERVICE':
            return self.handle_awaiting_service(msg)
        elif state == 'AWAITING_DATE':
            return self.handle_awaiting_date(msg)
        elif state == 'AWAITING_TIME':
            return self.handle_awaiting_time(msg)
        elif state == 'AWAITING_PHONE':
            return self.handle_awaiting_phone(msg)

        return "Desculpe, não entendi. Digite *0* para reiniciar o atendimento."

    def update_state(self, new_state, context=None):
        self.state_record.current_state = new_state
        if context is not None:
            self.state_record.context_data = context
        self.state_record.save()

    def handle_greeting_menu(self):
        """Menu URA inicial automático exibido no primeiro contato"""
        trigger_schedule = self.config.trigger_schedule or '1'
        trigger_attendant = self.config.trigger_attendant or '2'
        trigger_location = self.config.trigger_location or '3'
        trigger_exit = self.config.trigger_exit or '0'
        tenant_name = self.tenant.name

        if self.config.greeting_message:
            custom_msg = self.config.greeting_message
            custom_msg = custom_msg.replace('{estabelecimento}', tenant_name)
            custom_msg = custom_msg.replace('{tenant_name}', tenant_name)
            custom_msg = custom_msg.replace('{opcao_agendar}', trigger_schedule)
            custom_msg = custom_msg.replace('{opcao_atendente}', trigger_attendant)
            custom_msg = custom_msg.replace('{opcao_localizacao}', trigger_location)
            custom_msg = custom_msg.replace('{opcao_sair}', trigger_exit)
            return custom_msg

        text = (
            f"Olá! 👋 Bem-vindo(a) ao atendimento de *{tenant_name}*.\n\n"
            f"Como podemos te ajudar hoje?\n\n"
            f"*{trigger_schedule}* - Iniciar agendamento\n"
            f"*{trigger_attendant}* - Falar com atendente\n"
            f"*{trigger_location}* - Endereço & Localização\n"
            f"*{trigger_exit}* - Finalizar atendimento\n\n"
            f"Digite o número da opção desejada:"
        )
        return text

    def handle_start_scheduling(self):
        """Lista os serviços dinâmicos do segmento cadastrado formatados por letras (A, B, C...)"""
        services = Service.objects.filter(tenant=self.tenant, is_active=True).order_by('name')
        if not services.exists():
            trigger_exit = self.config.trigger_exit or '0'
            return f"No momento não temos serviços disponíveis para agendamento online. Digite *{trigger_exit}* para encerrar."

        trigger_prefix = self.config.trigger_schedule or '1'
        trigger_exit = self.config.trigger_exit or '0'
        text = f"✨ *Procedimentos Disponíveis em {self.tenant.name}:*\n\n"

        service_map = {}
        for idx, svc in enumerate(services):
            # Formatação por letras intuitivas (A, B, C, D...)
            letter = chr(ord('A') + idx) if idx < 26 else f"A{idx - 25}"
            letter_upper = letter.upper()
            letter_lower = letter.lower()

            text += f"*{letter_upper}* - {svc.name} (R$ {float(svc.price):.2f}) • {svc.duration_minutes} min\n"

            # Mapeamento insensível a maiúsculas/minúsculas e variações naturais
            svc_id_str = str(svc.id)
            service_map[letter_lower] = svc_id_str
            service_map[letter_upper] = svc_id_str
            service_map[f"{letter_lower}."] = svc_id_str
            service_map[f"{letter_upper}."] = svc_id_str
            service_map[f"opcao {letter_lower}"] = svc_id_str
            service_map[f"opção {letter_lower}"] = svc_id_str
            service_map[f"opcao {letter_upper}"] = svc_id_str
            service_map[f"opção {letter_upper}"] = svc_id_str

            # Fallbacks numéricos para conveniência
            service_map[str(idx + 1)] = svc_id_str
            service_map[f"{trigger_prefix}.{idx + 1}"] = svc_id_str

        text += f"\nDigite a letra da opção (ex: *A*) ou *{trigger_exit}* para voltar:"
        self.update_state('AWAITING_SERVICE', {'service_map': service_map})
        return text

    def handle_awaiting_service(self, msg):
        service_map = self.state_record.context_data.get('service_map', {})
        
        # Normalização flexível (independente de maiúsculas, minúsculas, pontuação ou prefixos)
        clean_msg = msg.strip().lower()
        clean_normalized = clean_msg.replace('.', '').replace('-', '').replace(')', '').strip()
        clean_letter = clean_normalized.replace('opcao', '').replace('opção', '').replace('letra', '').strip()

        matched_service_id = None
        if clean_msg in service_map:
            matched_service_id = service_map[clean_msg]
        elif clean_normalized in service_map:
            matched_service_id = service_map[clean_normalized]
        elif clean_letter in service_map:
            matched_service_id = service_map[clean_letter]

        if not matched_service_id:
            trigger_exit = self.config.trigger_exit or '0'
            return f"Opção inválida. Por favor, digite a letra do procedimento desejado (ex: *A*) ou *{trigger_exit}* para voltar."

        self.state_record.context_data['selected_service_id'] = matched_service_id
        self.update_state('AWAITING_DATE', self.state_record.context_data)

        try:
            service = Service.objects.get(id=matched_service_id)
            svc_name = service.name
        except:
            svc_name = "seu procedimento"

        return f"Excelente escolha para *{svc_name}*! Para qual *data* você gostaria de agendar? (Ex: Hoje, Amanhã, 15/10)"

    def get_available_slots(self, target_date, service_duration_minutes=30):
        """
        Calcula os horários disponíveis para agendamento no dia escolhido,
        respeitando os horários de funcionamento e excluindo horários já ocupados.
        """
        weekday = target_date.weekday() # 0 = Segunda, 6 = Domingo
        
        # 1. Busca configuração de horário do tenant para o dia da semana
        bh = BusinessHour.objects.filter(tenant=self.tenant, day_of_week=weekday).first()
        if bh:
            if not bh.is_open:
                return []
            open_time = bh.open_time or datetime.time(8, 30)
            close_time = bh.close_time or datetime.time(19, 0)
            break_start = bh.break_start
            break_end = bh.break_end
        else:
            if weekday == 6: # Domingo fechado por padrão
                return []
            open_time = datetime.time(8, 30)
            close_time = datetime.time(19, 0)
            break_start = datetime.time(12, 0)
            break_end = datetime.time(13, 0)

        # 2. Busca agendamentos existentes no dia (exceto cancelados)
        existing_appts = Appointment.objects.filter(
            tenant=self.tenant,
            start_time__date=target_date
        ).exclude(status__in=['CANCELED', 'CANCELLED'])

        busy_windows = []
        for appt in existing_appts:
            appt_start = localtime(appt.start_time).time()
            appt_end = localtime(appt.end_time).time()
            busy_windows.append((appt_start, appt_end))

        # 3. Gera slots de 30 em 30 minutos
        available_slots = []
        curr_dt = datetime.datetime.combine(target_date, open_time)
        close_dt = datetime.datetime.combine(target_date, close_time)
        
        now_local = localtime(timezone.now())

        while curr_dt + datetime.timedelta(minutes=service_duration_minutes) <= close_dt:
            slot_start_time = curr_dt.time()
            slot_end_time = (curr_dt + datetime.timedelta(minutes=service_duration_minutes)).time()

            # Se for hoje, ignora horários passados (com margem de 15 min)
            if target_date == now_local.date():
                if curr_dt <= (now_local.replace(tzinfo=None) + datetime.timedelta(minutes=15)):
                    curr_dt += datetime.timedelta(minutes=30)
                    continue

            # Ignora intervalo de almoço
            if break_start and break_end:
                if (slot_start_time >= break_start and slot_start_time < break_end) or \
                   (slot_end_time > break_start and slot_end_time <= break_end):
                    curr_dt += datetime.timedelta(minutes=30)
                    continue

            # Verifica conflito com agendamentos existentes
            is_busy = False
            for b_start, b_end in busy_windows:
                # Há sobreposição se slot_start_time < b_end e slot_end_time > b_start
                if slot_start_time < b_end and slot_end_time > b_start:
                    is_busy = True
                    break

            if not is_busy:
                available_slots.append(slot_start_time.strftime('%H:%M'))

            curr_dt += datetime.timedelta(minutes=30)

        return available_slots

    def format_slots_summary(self, available_slots):
        morning_slots = [s for s in available_slots if int(s.split(':')[0]) < 12]
        afternoon_slots = [s for s in available_slots if int(s.split(':')[0]) >= 12]

        lines = []
        if morning_slots:
            lines.append("☀️ *Manhã:* " + ", ".join(morning_slots))
        if afternoon_slots:
            lines.append("⛅ *Tarde:* " + ", ".join(afternoon_slots))
        return "\n".join(lines)

    def is_real_phone(self, phone):
        if not phone:
            return False
        cleaned = re.sub(r'\D', '', str(phone))
        # Telefone brasileiro real: 10 ou 11 dígitos com DDD, ou 12/13 com código do país 55.
        # LIDs do WhatsApp possuem 14-15+ dígitos
        if len(cleaned) in [10, 11]:
            return True
        if len(cleaned) in [12, 13] and cleaned.startswith('55'):
            return True
        return False

    def create_confirmed_appointment(self, service, start_time):
        end_time = start_time + datetime.timedelta(minutes=service.duration_minutes)

        appointment = Appointment.objects.create(
            tenant=self.tenant,
            client=self.client,
            service=service,
            start_time=start_time,
            end_time=end_time,
            status='CONFIRMED'
        )

        try:
            gcal_service = GoogleCalendarService(self.tenant)
            event_id = gcal_service.create_event(appointment)
            if event_id:
                appointment.google_event_id = event_id
                appointment.save()
        except:
            pass

        self.update_state('IDLE', {})

        phone_display = self.client.phone_number
        digits = re.sub(r'\D', '', str(phone_display))
        if len(digits) == 13 and digits.startswith('55'):
            phone_display = f"({digits[2:4]}) {digits[4:9]}-{digits[9:]}"
        elif len(digits) == 11:
            phone_display = f"({digits[0:2]}) {digits[2:7]}-{digits[7:]}"

        return (
            f"🎉 *Agendamento Confirmado!*\n\n"
            f"👤 *Cliente:* {self.client.full_name}\n"
            f"📱 *WhatsApp:* {phone_display}\n"
            f"💇 *Serviço:* {service.name}\n"
            f"📅 *Data:* {start_time.strftime('%d/%m/%Y às %H:%M')}\n"
            f"💰 *Valor:* R$ {float(service.price):.2f}\n\n"
            f"Agradecemos a preferência em *{self.tenant.name}*! Te esperamos lá. 📍"
        )

    def handle_awaiting_date(self, msg):
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
                    if target_date < today:
                        target_date = datetime.date(today.year + 1, month, day)
                except ValueError:
                    return "Data inválida. Tente no formato DD/MM (ex: 15/10)."
            else:
                return "Não consegui entender a data. Diga *hoje*, *amanhã* ou *DD/MM* (ex: 15/10)."

        date_str = target_date.strftime('%Y-%m-%d')
        service_id = self.state_record.context_data.get('selected_service_id')

        try:
            service = Service.objects.get(id=service_id)
            duration = service.duration_minutes
        except:
            duration = 30

        try:
            gcal_service = GoogleCalendarService(self.tenant)
            gcal_service.get_free_busy(date_str)
        except Exception:
            pass

        available_slots = self.get_available_slots(target_date, duration)
        if not available_slots:
            return (
                f"Puxa! Não há horários disponíveis para *{target_date.strftime('%d/%m/%Y')}* "
                f"(agenda cheia ou dia fechado). 🗓️\n\n"
                f"Por favor, escolha outra data (ex: Amanhã ou DD/MM):"
            )

        slots_summary = self.format_slots_summary(available_slots)

        self.state_record.context_data['selected_date'] = date_str
        self.state_record.context_data['available_slots'] = available_slots
        self.update_state('AWAITING_TIME', self.state_record.context_data)

        first_slot = available_slots[0] if available_slots else "14:00"
        return (
            f"Perfeito, data *{target_date.strftime('%d/%m/%Y')}* anotada! 🗓️\n\n"
            f"⏰ *Horários disponíveis para este dia:*\n"
            f"{slots_summary}\n\n"
            f"Qual *horário* você prefere? (Ex: {first_slot})"
        )

    def handle_awaiting_time(self, msg):
        match = re.search(r'(\d{1,2})[:h](\d{2})?', msg)
        if not match:
            return "Não entendi o horário. Use o formato HH:MM (ex: 14:00 ou 15:30)."

        hour = int(match.group(1))
        minute = int(match.group(2)) if match.group(2) else 0
        requested_slot = f"{hour:02d}:{minute:02d}"

        date_str = self.state_record.context_data.get('selected_date')
        service_id = self.state_record.context_data.get('selected_service_id')

        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            self.update_state('IDLE', {})
            return "Serviço não encontrado. Digite *1* para reiniciar o agendamento."

        target_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        available_slots = self.get_available_slots(target_date, service.duration_minutes)

        if requested_slot not in available_slots:
            slots_summary = self.format_slots_summary(available_slots)
            if not slots_summary:
                return (
                    f"⚠️ O horário *{requested_slot}* não está disponível e todos os horários para "
                    f"*{target_date.strftime('%d/%m/%Y')}* já foram preenchidos.\n\n"
                    f"Digite *voltar* para escolher outra data ou *0* para sair."
                )
            return (
                f"⚠️ O horário *{requested_slot}* não está disponível ou já está ocupado para este dia!\n\n"
                f"⏰ *Horários ainda disponíveis para {target_date.strftime('%d/%m/%Y')}:*\n"
                f"{slots_summary}\n\n"
                f"Por favor, escolha um dos horários disponíveis acima ou digite *0* para cancelar:"
            )

        start_time_naive = datetime.datetime.strptime(date_str, "%Y-%m-%d").replace(hour=hour, minute=minute)
        start_time = make_aware(start_time_naive)

        # Se o cliente não possui um telefone real (ex: apenas identificador LID do WhatsApp)
        if not self.is_real_phone(self.client.phone_number):
            self.state_record.context_data['confirmed_start_time'] = start_time.isoformat()
            self.update_state('AWAITING_PHONE', self.state_record.context_data)
            return (
                f"Horário *{requested_slot}* pré-reservado com sucesso! ⏳\n\n"
                f"📲 Para finalizarmos e enviarmos os lembretes do agendamento, por favor informe seu *número de WhatsApp com DDD* (Ex: 11 99999-9999):"
            )

        return self.create_confirmed_appointment(service, start_time)

    def handle_awaiting_phone(self, msg):
        digits = re.sub(r'\D', '', msg)
        if len(digits) in [10, 11]:
            digits = '55' + digits

        if not (len(digits) in [12, 13] and digits.startswith('55')):
            return "Por favor, informe um número de WhatsApp válido com DDD (Ex: 11 99999-9999 ou 17996261525):"

        self.client.phone_number = digits
        self.client.save()

        service_id = self.state_record.context_data.get('selected_service_id')
        confirmed_start_str = self.state_record.context_data.get('confirmed_start_time')

        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            self.update_state('IDLE', {})
            return "Serviço não encontrado. Digite *1* para reiniciar o agendamento."

        if confirmed_start_str:
            from django.utils.dateparse import parse_datetime
            start_time = parse_datetime(confirmed_start_str)
        else:
            self.update_state('IDLE', {})
            return "Houve um problema ao recuperar o horário. Digite *1* para reiniciar."

        return self.create_confirmed_appointment(service, start_time)
