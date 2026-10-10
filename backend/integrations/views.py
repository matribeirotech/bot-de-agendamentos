import os
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from .models import Integration
from google_auth_oauthlib.flow import Flow

SCOPES = ['https://www.googleapis.com/auth/calendar']

class GoogleAuthURLView(APIView):
    def get(self, request):
        # Permite uso de HTTP para testes locais (NÃO USAR EM PROD)
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

        try:
            flow = Flow.from_client_secrets_file(
                os.path.join(settings.BASE_DIR, 'client_secret.json'),
                scopes=SCOPES,
                redirect_uri='http://localhost:8000/api/v1/integrations/google/callback/'
            )
            auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
            return Response({'auth_url': auth_url})
        except FileNotFoundError:
            return Response(
                {"error": "Arquivo client_secret.json não encontrado. Configure no Google Cloud Console."}, 
                status=500
            )

class GoogleAuthCallbackView(APIView):
    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({'error': 'Código de autorização não fornecido (code).'}, status=400)
            
        try:
            flow = Flow.from_client_secrets_file(
                os.path.join(settings.BASE_DIR, 'client_secret.json'),
                scopes=SCOPES,
                redirect_uri='http://localhost:8000/api/v1/integrations/google/callback/'
            )
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            creds_data = {
                'token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'token_uri': credentials.token_uri,
                'client_id': credentials.client_id,
                'client_secret': credentials.client_secret,
                'scopes': credentials.scopes
            }
            
            integration, created = Integration.objects.get_or_create(
                tenant=request.user.tenant,
                provider='GOOGLE_CALENDAR',
                defaults={'credentials': creds_data, 'is_active': True}
            )
            if not created:
                integration.credentials = creds_data
                integration.is_active = True
                integration.save()
                
            return Response({'message': 'Integração com Google Calendar configurada com sucesso!'})
        except Exception as e:
            return Response({"error": str(e)}, status=400)
