import os
import django
from django.utils.text import slugify

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Tenant, User
from catalog.models import Service

def setup_test_data():
    if Tenant.objects.filter(slug='lypsyos-demo').exists():
        print("Dados de teste já existem.")
        return

    tenant = Tenant.objects.create(name="Lypsyos Demo", slug="lypsyos-demo")
    print(f"Tenant criado: {tenant.name} ({tenant.id})")

    user = User.objects.create_superuser(
        username="admin", 
        email="admin@lypsyos.com", 
        password="admin",
        tenant=tenant
    )
    print("Superuser 'admin' criado (senha: admin).")

    Service.objects.create(tenant=tenant, name="Unha em Gel", duration_minutes=60, price=80.00)
    Service.objects.create(tenant=tenant, name="Manicure Simples", duration_minutes=30, price=30.00)
    Service.objects.create(tenant=tenant, name="Pedicure Completo", duration_minutes=45, price=45.00)
    print("Serviços de teste criados.")

    # Atualiza o .env do worker Node com este Tenant ID
    worker_env_path = os.path.join(os.path.dirname(__file__), '../whatsapp-worker/.env')
    with open(worker_env_path, 'w') as f:
        f.write(f"TENANT_ID={tenant.id}\n")
        f.write("DJANGO_WEBHOOK_URL=http://localhost:8000/api/v1/bot/webhook/incoming/\n")
    print("Worker .env configurado com o TENANT_ID local.")

if __name__ == '__main__':
    setup_test_data()

