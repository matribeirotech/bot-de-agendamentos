import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultSubscription = {
  plan: 'PRO', // 'PRO' | 'FREE'
  status: 'TRIAL', // 'TRIAL' | 'ACTIVE' | 'EXPIRED'
  daysRemaining: 29,
  trialEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
};

const initialState = {
  // Dados do Estabelecimento & Perfil
  businessName: 'Studio Bella Unhas',
  responsibleName: 'Amanda Silva',
  email: 'amanda@bellasalao.com.br',
  whatsapp: '5511999999999',
  segment: 'manicure', // 'manicure' | 'barbearia' | 'salao' | 'estetica' | 'outro'
  avatarUrl: '',
  pixKey: '11999999999',
  pixType: 'TELEFONE', // 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA'
  themeColor: '#2563eb', // Azul elétrico padrão Lypsyos
  bio: 'Especialista em atendimento e serviços com hora marcada.',

  // Controle de Assinatura & Trial
  subscription: defaultSubscription,

  // Onboarding State
  onboardingStep: 1,
  isOnboarded: true,
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      setBusinessData: (data) => set((state) => ({ ...state, ...data })),
      updateProfile: (data) => set((state) => ({ ...state, ...data })),
      setSegment: (segment) => set({ segment }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      completeOnboarding: (businessData) => 
        set((state) => ({
          ...state,
          ...businessData,
          isOnboarded: true,
          onboardingStep: 3,
          subscription: state.subscription || defaultSubscription,
        })),

      // Upgrade to Pro
      upgradeToPro: () =>
        set((state) => ({
          subscription: {
            ...(state.subscription || defaultSubscription),
            plan: 'PRO',
            status: 'ACTIVE',
            daysRemaining: 365,
          },
        })),

      // Logout / Reset
      logout: () => {
        set({
          ...initialState,
          isOnboarded: false,
          businessName: 'Meu Estabelecimento',
          responsibleName: '',
          email: '',
          whatsapp: '',
          subscription: defaultSubscription,
        });
      }
    }),
    {
      name: 'lypsyos-store', // Persistido no LocalStorage do navegador
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
        // Garante que subscription nunca seja undefined mesmo em caches antigos
        subscription: {
          ...defaultSubscription,
          ...(persistedState?.subscription || {}),
        },
        segment: persistedState?.segment || 'manicure',
        businessName: persistedState?.businessName || 'Meu Estabelecimento',
      }),
    }
  )
);
