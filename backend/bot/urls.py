from django.urls import path
from .views import WhatsAppWebhookView, BotConfigurationView

urlpatterns = [
    path('webhook/incoming/', WhatsAppWebhookView.as_view(), name='whatsapp_incoming'),
    path('config/', BotConfigurationView.as_view(), name='bot_config'),
]


