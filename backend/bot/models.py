import uuid
from django.db import models
from core.models import Tenant
from scheduling.models import Client

class BotState(models.Model):
    STATE_CHOICES = [
        ('IDLE', 'Ocioso'),
        ('AWAITING_SERVICE', 'Aguardando Seleção de Serviço'),
        ('AWAITING_DATE', 'Aguardando Data'),
        ('AWAITING_TIME', 'Aguardando Horário'),
        ('AWAITING_PHONE', 'Aguardando Telefone do Cliente'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    current_state = models.CharField(max_length=50, choices=STATE_CHOICES, default='IDLE')
    context_data = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.client.phone_number} - {self.current_state}"

class BotConfiguration(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='bot_configuration')
    
    # Toggles de Funcionalidades
    bot_enabled = models.BooleanField(default=True, help_text="Ativa/Desativa o robô completamente para este tenant")
    auto_reply_enabled = models.BooleanField(default=True, help_text="Ativa o fluxo automático de agendamento")
    out_of_office_enabled = models.BooleanField(default=False, help_text="Ativa resposta automática de ausência")
    
    # Gatilhos e Atalhos Numéricos do Menu URA
    trigger_schedule = models.CharField(max_length=20, default='1', help_text="Atalho para iniciar agendamento")
    trigger_attendant = models.CharField(max_length=20, default='2', help_text="Atalho para falar com atendente")
    trigger_location = models.CharField(max_length=20, default='3', help_text="Atalho para endereço/localização")
    trigger_exit = models.CharField(max_length=20, default='0', help_text="Atalho para finalizar atendimento")
    auto_greeting = models.BooleanField(default=True, help_text="Dispara saudação automática a qualquer mensagem")
    ignore_saved_contacts = models.BooleanField(default=False, help_text="Ignora contatos salvos da agenda pessoal")
    
    # Mensagens Padrão (com suporte a variáveis como {tenant_name}, {client_name}, {date}, {time})
    greeting_message = models.TextField(
        default="Olá! 👋 Bem-vindo(a) à {tenant_name}.\n\nComo posso ajudar você hoje?\n\n*1* - Iniciar agendamento\n*2* - Falar com atendente\n*3* - Endereço & Localização\n*0* - Finalizar atendimento\n\nDigite o número da opção desejada:"
    )
    absence_message = models.TextField(
        default="No momento estamos fora do nosso horário de atendimento. 🌙 Deixe sua mensagem ou digite *1* para agendar um horário para o próximo dia útil!"
    )
    confirmation_message = models.TextField(
        default="✅ Tudo certo, {client_name}! Seu agendamento para {service_name} foi confirmado para {date} às {time}."
    )
    reminder_message = models.TextField(
        default="🔔 Lembrete: Olá {client_name}, você tem um horário agendado conosco amanhã às {time} para {service_name}."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Configurações do Robô - {self.tenant.name}"

class CustomBotResponse(models.Model):
    MATCH_CHOICES = [
        ('EXACT', 'Texto Exato'),
        ('CONTAINS', 'Contém a palavra/frase'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='custom_bot_responses')
    trigger_keyword = models.CharField(max_length=100, help_text="Palavra ou frase que dispara a resposta")
    response_text = models.TextField(help_text="Mensagem que o robô irá enviar como resposta")
    match_type = models.CharField(max_length=20, choices=MATCH_CHOICES, default='CONTAINS')
    is_active = models.BooleanField(default=True, help_text="Liga/desliga esta resposta customizada")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.tenant.name}] Gatilho: {self.trigger_keyword}"
