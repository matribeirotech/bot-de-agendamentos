import uuid
from django.db import models
from core.models import Tenant

class Integration(models.Model):
    PROVIDER_CHOICES = [
        ('GOOGLE_CALENDAR', 'Google Calendar'),
        ('WHATSAPP', 'WhatsApp'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='integrations')
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES)
    credentials = models.JSONField(help_text="Tokens OAuth ou estado de sessão do WhatsApp", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.provider} - {self.tenant.name}"
