from rest_framework import viewsets
from .models import Client, Appointment
from .serializers import ClientSerializer, AppointmentSerializer, AppointmentReadSerializer
from core.mixins import TenantAwareViewSetMixin

class ClientViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

from rest_framework.decorators import action
from rest_framework.response import Response
from integrations.services import GoogleCalendarService

class AppointmentViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    
    def get_serializer_class(self):
        # Use a nested serializer for reading to get full client and service details
        if self.request.method in ['GET']:
            return AppointmentReadSerializer
        return AppointmentSerializer

    def perform_create(self, serializer):
        """Salva o agendamento localmente e tenta replicar para o Google Calendar."""
        appointment = serializer.save(tenant=self.request.user.tenant)
        
        try:
            gcal_service = GoogleCalendarService(self.request.user.tenant)
            event_id = gcal_service.create_event(appointment)
            if event_id:
                appointment.google_event_id = event_id
                appointment.save()
        except Exception as e:
            print(f"Erro ao criar evento no Google Calendar: {e}")
            # Idealmente, envie para uma fila de retentativas.

    @action(detail=False, methods=['get'])
    def availability(self, request):
        """
        Retorna os horários ocupados no Google Calendar para uma data específica.
        Ex: /api/v1/appointments/availability/?date=2024-10-15
        """
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({"error": "Parâmetro 'date' é obrigatório (YYYY-MM-DD)"}, status=400)
            
        try:
            gcal_service = GoogleCalendarService(request.user.tenant)
            busy_slots = gcal_service.get_free_busy(date_str)
            return Response({
                "date": date_str,
                "busy_slots": busy_slots
            })
        except Exception as e:
            return Response({"error": str(e)}, status=400)

