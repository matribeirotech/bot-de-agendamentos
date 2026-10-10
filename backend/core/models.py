import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    role = models.CharField(max_length=50, choices=[('ADMIN', 'Admin'), ('STAFF', 'Staff')], default='STAFF')

    def __str__(self):
        return f"{self.email} - {self.tenant.name if self.tenant else 'No Tenant'}"
