import uuid
from django.db import models
from core.models import Tenant

class Service(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=255)
    duration_minutes = models.IntegerField(help_text="Duração do serviço em minutos")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.tenant.name})"
