from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from catalog.views import ServiceViewSet
from scheduling.views import ClientViewSet, AppointmentViewSet

# Configura o Router do DRF para gerenciar URLs de CRUD automaticamente
router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'appointments', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(router.urls)),
    path('api/v1/integrations/', include('integrations.urls')),
    path('api/v1/bot/', include('bot.urls')),
]
