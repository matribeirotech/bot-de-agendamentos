from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Service
from .serializers import ServiceSerializer
from core.mixins import TenantAwareViewSetMixin
from core.models import Tenant

SEGMENT_SERVICES = {
    'manicure': [
        {'name': 'Manicure Tradicional', 'price': 35.0, 'duration_minutes': 45},
        {'name': 'Pedicure Completa', 'price': 45.0, 'duration_minutes': 50},
        {'name': 'Alongamento em Gel / Fibra', 'price': 120.0, 'duration_minutes': 120},
        {'name': 'Spa dos Pés & Mãos', 'price': 85.0, 'duration_minutes': 75},
    ],
    'barbearia': [
        {'name': 'Corte Degradê / Social', 'price': 45.0, 'duration_minutes': 40},
        {'name': 'Barboterapia com Toalha Quente', 'price': 40.0, 'duration_minutes': 35},
        {'name': 'Combo Cabelo + Barba', 'price': 75.0, 'duration_minutes': 60},
        {'name': 'Pézinho & Acabamento', 'price': 20.0, 'duration_minutes': 20},
    ],
    'salao': [
        {'name': 'Escova Modelada + Lavagem', 'price': 60.0, 'duration_minutes': 45},
        {'name': 'Corte Feminino com Visagismo', 'price': 85.0, 'duration_minutes': 50},
        {'name': 'Hidratação Profunda / Nutrição', 'price': 110.0, 'duration_minutes': 60},
        {'name': 'Coloração & Mechas', 'price': 220.0, 'duration_minutes': 150},
    ],
    'estetica': [
        {'name': 'Design de Sobrancelhas com Henna', 'price': 45.0, 'duration_minutes': 35},
        {'name': 'Limpeza de Pele Profunda', 'price': 130.0, 'duration_minutes': 75},
        {'name': 'Drenagem Linfática Corporal', 'price': 95.0, 'duration_minutes': 60},
        {'name': 'Massagem Relaxante com Óleos', 'price': 100.0, 'duration_minutes': 60},
    ],
    'outro': [
        {'name': 'Consulta / Atendimento Inicial', 'price': 150.0, 'duration_minutes': 60},
        {'name': 'Sessão de Retorno / Acompanhamento', 'price': 100.0, 'duration_minutes': 45},
    ]
}

class ServiceViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_tenant(self):
        user = self.request.user
        if hasattr(user, 'tenant') and user.tenant:
            return user.tenant
        tenant = Tenant.objects.first()
        if not tenant:
            tenant = Tenant.objects.create(name='Principal', slug='principal')
        return tenant

    @action(detail=False, methods=['post'])
    def change_segment(self, request):
        segment = request.data.get('segment', 'manicure')
        tenant = self.get_tenant()

        services_data = SEGMENT_SERVICES.get(segment, SEGMENT_SERVICES['manicure'])

        # Se houver serviços antigos com agendamentos vinculados, desativa-os para não romper histórico
        # Se não houver agendamentos vinculados, remove para manter o catálogo limpo
        existing_services = Service.objects.filter(tenant=tenant)
        for svc in existing_services:
            if hasattr(svc, 'appointments') and svc.appointments.exists():
                svc.is_active = False
                svc.save()
            else:
                svc.delete()

        # Cria os novos serviços padrão do segmento selecionado
        created_services = []
        for item in services_data:
            new_svc = Service.objects.create(
                tenant=tenant,
                name=item['name'],
                price=item['price'],
                duration_minutes=item['duration_minutes'],
                is_active=True
            )
            created_services.append(new_svc)

        serializer = self.get_serializer(created_services, many=True)
        return Response({
            'message': f'Serviços atualizados para o segmento {segment}!',
            'services': serializer.data
        })
