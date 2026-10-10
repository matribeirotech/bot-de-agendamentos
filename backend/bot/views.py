from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import Tenant
from scheduling.models import Client
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
        message = data.get('message', '')
        is_contact_saved = data.get('is_contact_saved', False)

        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return Response({"error": "Tenant não encontrado"}, status=404)

        # Registra ou recupera o cliente
        client, _ = Client.objects.get_or_create(
            tenant=tenant, 
            phone_number=phone_number,
            defaults={'full_name': full_name}
        )

        fsm = BotStateMachine(tenant=tenant, client=client)
        response_text = fsm.process_message(message, is_contact_saved)

        # Retorna o texto que o Worker deve enviar de volta ao usuário do WhatsApp
        return Response({"reply": response_text})
