import datetime
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from .models import Integration

class GoogleCalendarService:
    def __init__(self, tenant):
        self.tenant = tenant
        self.integration = Integration.objects.filter(
            tenant=self.tenant, 
            provider='GOOGLE_CALENDAR', 
            is_active=True
        ).first()

    def get_credentials(self):
        if not self.integration or not self.integration.credentials:
            return None
            
        creds_data = self.integration.credentials
        creds = Credentials(
            token=creds_data.get('token'),
            refresh_token=creds_data.get('refresh_token'),
            token_uri=creds_data.get('token_uri'),
            client_id=creds_data.get('client_id'),
            client_secret=creds_data.get('client_secret'),
            scopes=creds_data.get('scopes')
        )
        
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            # Salvar novo token se foi renovado
            self.integration.credentials['token'] = creds.token
            self.integration.save()
            
        return creds

    def get_free_busy(self, date_str):
        """
        Busca os horários ocupados no dia (formato YYYY-MM-DD).
        Retorna uma lista de intervalos ocupados (start, end).
        """
        creds = self.get_credentials()
        if not creds:
            raise Exception("Google Calendar não integrado para este Tenant.")
            
        service = build('calendar', 'v3', credentials=creds)
        
        start_of_day = datetime.datetime.strptime(date_str, "%Y-%m-%d").astimezone().replace(hour=0, minute=0, second=0)
        end_of_day = start_of_day.replace(hour=23, minute=59, second=59)

        body = {
            "timeMin": start_of_day.isoformat(),
            "timeMax": end_of_day.isoformat(),
            "timeZone": "America/Sao_Paulo",
            "items": [{"id": "primary"}]
        }

        eventsResult = service.freebusy().query(body=body).execute()
        busy_slots = eventsResult['calendars']['primary']['busy']
        
        return busy_slots

    def create_event(self, appointment):
        """
        Cria um evento de agendamento na agenda e retorna o ID do evento.
        """
        creds = self.get_credentials()
        if not creds:
            return None
            
        service = build('calendar', 'v3', credentials=creds)
        
        event = {
            'summary': f"{appointment.service.name} - {appointment.client.full_name}",
            'description': f"Agendamento Lypsyos para {appointment.client.phone_number}",
            'start': {
                'dateTime': appointment.start_time.isoformat(),
                'timeZone': 'America/Sao_Paulo',
            },
            'end': {
                'dateTime': appointment.end_time.isoformat(),
                'timeZone': 'America/Sao_Paulo',
            },
        }

        event_result = service.events().insert(calendarId='primary', body=event).execute()
        return event_result.get('id')

