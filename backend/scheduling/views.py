from rest_framework import viewsets, status
from .models import Client, Appointment
from .serializers import ClientSerializer, AppointmentSerializer, AppointmentReadSerializer
from core.mixins import TenantAwareViewSetMixin
from catalog.models import Service
from rest_framework.decorators import action
from rest_framework.response import Response
from integrations.services import GoogleCalendarService
import datetime

class ClientViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

class AppointmentViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    
    def get_serializer_class(self):
        if self.request.method in ['GET']:
            return AppointmentReadSerializer
        return AppointmentSerializer

    def perform_create(self, serializer):
        appointment = serializer.save(tenant=self.request.user.tenant)
        try:
            gcal_service = GoogleCalendarService(self.request.user.tenant)
            event_id = gcal_service.create_event(appointment)
            if event_id:
                appointment.google_event_id = event_id
                appointment.save()
        except Exception as e:
            print(f"Erro ao criar evento no Google Calendar: {e}")

    @action(detail=False, methods=['post'])
    def create_manual(self, request):
        """ Endpoint customizado para o Frontend criar o cliente e o agendamento juntos """
        data = request.data
        tenant = request.user.tenant

        # 1. Pega ou cria o cliente
        client, _ = Client.objects.get_or_create(
            tenant=tenant,
            phone_number=data.get('client_phone'),
            defaults={'full_name': data.get('client_name')}
        )

        # 2. Busca o serviço
        try:
            service = Service.objects.get(id=data.get('service_id'), tenant=tenant)
        except Service.DoesNotExist:
            return Response({"error": "Serviço não encontrado."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Calcula o end_time
        try:
            # Garante que seja um datetime ciente de fuso horário (UTC, ou fuso do servidor)
            from django.utils import timezone
            start_time = timezone.make_aware(datetime.datetime.fromisoformat(data.get('start_time')))
        except Exception as e:
            # Caso fromisoformat já tenha fuso
            start_time = datetime.datetime.fromisoformat(data.get('start_time'))

        end_time = start_time + datetime.timedelta(minutes=service.duration_minutes)

        # 4. Cria o agendamento
        appointment = Appointment.objects.create(
            tenant=tenant,
            client=client,
            service=service,
            start_time=start_time,
            end_time=end_time,
            status='CONFIRMED'
        )

        # Integração com GCal
        try:
            gcal_service = GoogleCalendarService(tenant)
            event_id = gcal_service.create_event(appointment)
            if event_id:
                appointment.google_event_id = event_id
                appointment.save()
        except Exception as e:
            print(f"GCal erro: {e}")

        serializer = AppointmentReadSerializer(appointment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def availability(self, request):
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
