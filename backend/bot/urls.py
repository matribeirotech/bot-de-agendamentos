from django.urls import path
from .views import WhatsAppWebhookView

urlpatterns = [
    path('webhook/incoming/', WhatsAppWebhookView.as_view(), name='whatsapp_incoming'),
]

