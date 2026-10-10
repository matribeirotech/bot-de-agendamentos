from rest_framework import viewsets
from .models import Service
from .serializers import ServiceSerializer
from core.mixins import TenantAwareViewSetMixin

class ServiceViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
