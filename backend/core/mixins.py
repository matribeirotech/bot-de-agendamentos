class TenantAwareViewSetMixin:
    """
    Mixin para ViewSets do DRF.
    Garante que o usuário só pode listar e ver objetos do seu próprio Tenant,
    e injeta automaticamente o Tenant correto ao criar novos registros.
    """
    
    def get_queryset(self):
        """Filtra o queryset base pelo tenant do usuário autenticado."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Se for um superuser do Django, pode ver tudo (opcional para admin global)
        if user.is_superuser:
            return queryset
            
        if user.is_authenticated and user.tenant:
            return queryset.filter(tenant=user.tenant)
            
        # Retorna vazio se não tiver tenant
        return queryset.none()

    def perform_create(self, serializer):
        """Ao criar um registro, vincula obrigatoriamente ao tenant do usuário."""
        serializer.save(tenant=self.request.user.tenant)

