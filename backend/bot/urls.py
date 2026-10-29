from django.urls import path
from .views import (
    WhatsAppWebhookView,
    BotConfigurationView,
    MarketingAudienceView,
    MarketingBroadcastView,
)

urlpatterns = [
    path('webhook/incoming/', WhatsAppWebhookView.as_view(), name='whatsapp_incoming'),
    path('config/', BotConfigurationView.as_view(), name='bot_config'),
    path('marketing/audience/', MarketingAudienceView.as_view(), name='marketing_audience'),
    path('marketing/broadcast/', MarketingBroadcastView.as_view(), name='marketing_broadcast'),
]


