from rest_framework import serializers
from .models import Client, Appointment
from catalog.serializers import ServiceSerializer

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'phone_number', 'full_name', 'last_interaction']
        read_only_fields = ['id', 'last_interaction']

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'client', 'service', 'start_time', 'end_time', 'status', 'google_event_id', 'created_at']
        read_only_fields = ['id', 'google_event_id', 'created_at']
        extra_kwargs = {
            'client': {'required': False},
            'service': {'required': False},
            'start_time': {'required': False},
            'end_time': {'required': False},
        }

class AppointmentReadSerializer(AppointmentSerializer):
    client = ClientSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)

