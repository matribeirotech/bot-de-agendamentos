import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function applyTheme(mode, color) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  if (color) {
    root.style.setProperty('--theme-primary', color);
  }
}

const defaultSubscription = {
  plan: 'PRO', // 'PRO' | 'FREE'
  status: 'TRIAL', // 'TRIAL' | 'ACTIVE' | 'EXPIRED'
  daysRemaining: 29,
  trialEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
};

const initialState = {
  // Dados do Estabelecimento & Perfil
  businessName: 'Meu Estabelecimento',
  responsibleName: '',
  email: '',
  whatsapp: '',
  segment: 'manicure', // 'manicure' | 'barbearia' | 'salao' | 'estetica' | 'outro'
  avatarUrl: '',
  pixKey: '',
  pixType: 'TELEFONE', // 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA'
  themeColor: '#2563eb', // Azul padrão Lypsyos
  themeMode: 'light', // 'light' | 'dark' | 'custom'
  bio: '',

  // Controle de Assinatura & Trial
  subscription: defaultSubscription,

  // Onboarding & Auth State
  onboardingStep: 1,
  isOnboarded: true,
  isAuthenticated: true,
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Gerenciamento de Tema (Dark, Light, Custom)
      setThemeMode: (mode) => {
        set({ themeMode: mode });
        const color = get().themeColor || '#2563eb';
        applyTheme(mode, color);
      },

      setThemeColor: (color) => {
        set({ themeColor: color });
        const mode = get().themeMode || 'light';
        applyTheme(mode, color);
      },

      // Ações básicas do Store
      setBusinessData: (data) => set((state) => ({ ...state, ...data })),
      updateProfile: (data) => set((state) => ({ ...state, ...data })),
      setSegment: (segment) => set({ segment }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),

      completeOnboarding: (businessData) =>
        set((state) => {
          const next = {
            ...state,
            ...businessData,
            isOnboarded: true,
            isAuthenticated: true,
            onboardingStep: 3,
            subscription: state.subscription || defaultSubscription,
          };
          if (next.email) {
            try {
              localStorage.setItem(`lypsyos_profile_${next.email.toLowerCase().trim()}`, JSON.stringify(next));
            } catch (e) {}
          }
          return next;
        }),

      upgradeToPro: () =>
        set((state) => ({
          subscription: {
            ...(state.subscription || defaultSubscription),
            plan: 'PRO',
            status: 'ACTIVE',
            daysRemaining: 365,
          },
        })),

      // Carregar Perfil Completo (Multi-Layer: LocalStorage por E-mail -> Supabase Auth -> Supabase DB -> Backend Django)
      loadUserProfile: async (emailHint) => {
        const state = get();
        let targetEmail = (emailHint || state.email || '').toLowerCase().trim();
        let loaded = {};

        // 1. Camada 1: Cache Persistente por E-mail no LocalStorage
        if (targetEmail) {
          try {
            const rawCache = localStorage.getItem(`lypsyos_profile_${targetEmail}`);
            if (rawCache) {
              const parsed = JSON.parse(rawCache);
              if (parsed && typeof parsed === 'object') {
                loaded = { ...parsed };
              }
            }
          } catch (e) {
            console.warn('Erro ao ler cache do usuário:', e);
          }
        }

        // 2. Camada 2: Supabase Auth & Banco de Dados 'usuarios'
        if (isSupabaseConfigured()) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              targetEmail = (user.email || targetEmail).toLowerCase().trim();
              const meta = user.user_metadata || {};

              if (meta.nome_salao) loaded.businessName = meta.nome_salao;
              if (meta.nome_completo) loaded.responsibleName = meta.nome_completo;
              if (meta.whatsapp) loaded.whatsapp = meta.whatsapp;
              if (meta.avatar_url) loaded.avatarUrl = meta.avatar_url;
              if (meta.chave_pix) loaded.pixKey = meta.chave_pix;
              if (meta.tipo_chave_pix) loaded.pixType = meta.tipo_chave_pix;
              if (meta.cor_primaria) loaded.themeColor = meta.cor_primaria;
              if (meta.theme_mode) loaded.themeMode = meta.theme_mode;
              if (meta.bio) loaded.bio = meta.bio;
              if (meta.segmento) loaded.segment = meta.segmento;
              loaded.email = user.email;

              // Consulta na tabela pública 'usuarios'
              const { data: dbUser } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

              if (dbUser) {
                if (dbUser.nome_salao) loaded.businessName = dbUser.nome_salao;
                if (dbUser.nome_completo) loaded.responsibleName = dbUser.nome_completo;
                if (dbUser.whatsapp) loaded.whatsapp = dbUser.whatsapp;
                if (dbUser.avatar_url) loaded.avatarUrl = dbUser.avatar_url;
                if (dbUser.chave_pix) loaded.pixKey = dbUser.chave_pix;
                if (dbUser.tipo_chave_pix) loaded.pixType = dbUser.tipo_chave_pix;
                if (dbUser.cor_primaria) loaded.themeColor = dbUser.cor_primaria;
                if (dbUser.bio) loaded.bio = dbUser.bio;
                if (dbUser.segmento) loaded.segment = dbUser.segmento;
              }
            }
          } catch (supaErr) {
            console.warn('Supabase profile load warning:', supaErr);
          }
        }

        // 3. Camada 3: Backend Django (Nome do Estabelecimento do Tenant / Bot)
        try {
          const res = await axios.get('http://localhost:8000/api/v1/bot/config/');
          if (res.data?.business_name && (!loaded.businessName || loaded.businessName === 'Meu Estabelecimento')) {
            loaded.businessName = res.data.business_name;
          }
        } catch (e) {}

        if (Object.keys(loaded).length > 0) {
          set((prev) => ({
            ...prev,
            ...loaded,
            isOnboarded: true,
            isAuthenticated: true,
          }));

          // Salva no cache do e-mail
          if (targetEmail) {
            try {
              localStorage.setItem(`lypsyos_profile_${targetEmail}`, JSON.stringify(loaded));
            } catch (e) {}
          }

          // Aplica o tema
          applyTheme(loaded.themeMode || state.themeMode || 'light', loaded.themeColor || state.themeColor || '#2563eb');
        }

        return loaded;
      },

      // Salvar Perfil Completo (Persistência em Todas as Camadas)
      saveUserProfile: async (formData) => {
        const state = get();
        const merged = { ...state, ...formData };
        set(merged);

        const email = (merged.email || '').toLowerCase().trim();

        // 1. Salva no cache isolado por e-mail no LocalStorage
        if (email) {
          try {
            localStorage.setItem(`lypsyos_profile_${email}`, JSON.stringify(formData));
          } catch (e) {}
        }

        // 2. Salva no Supabase (Auth metadata e public.usuarios)
        if (isSupabaseConfigured()) {
          try {
            await supabase.auth.updateUser({
              data: {
                nome_completo: formData.responsibleName,
                nome_salao: formData.businessName,
                whatsapp: formData.whatsapp,
                avatar_url: formData.avatarUrl,
                chave_pix: formData.pixKey,
                tipo_chave_pix: formData.pixType,
                cor_primaria: formData.themeColor,
                theme_mode: formData.themeMode,
                bio: formData.bio,
                segmento: formData.segment
              }
            });

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('usuarios').upsert({
                id: user.id,
                nome_completo: formData.responsibleName || 'Responsável',
                nome_salao: formData.businessName || 'Meu Estabelecimento',
                whatsapp: formData.whatsapp || '',
                avatar_url: formData.avatarUrl || '',
                chave_pix: formData.pixKey || '',
                tipo_chave_pix: formData.pixType || 'TELEFONE',
                cor_primaria: formData.themeColor || '#2563eb',
                bio: formData.bio || '',
                segmento: formData.segment || 'manicure',
                atualizado_em: new Date().toISOString()
              });
            }
          } catch (err) {
            console.warn('Erro ao salvar no Supabase:', err);
          }
        }

        // 3. Atualiza o nome do estabelecimento no backend Django (Tenant / Bot)
        if (formData.businessName) {
          try {
            await axios.post('http://localhost:8000/api/v1/bot/config/', {
              business_name: formData.businessName
            });
          } catch (err) {
            console.warn('Erro ao atualizar nome no Django:', err);
          }
        }

        // 4. Aplica tema ativo
        applyTheme(formData.themeMode || state.themeMode || 'light', formData.themeColor || state.themeColor || '#2563eb');
      },

      // Logout Seguro (Preserva o cache do usuário e limpa sessão ativa)
      logout: () => {
        const state = get();
        const currentEmail = (state.email || '').toLowerCase().trim();

        // Salva os dados do usuário atual antes de sair da sessão
        if (currentEmail) {
          try {
            const profileToCache = {
              businessName: state.businessName,
              responsibleName: state.responsibleName,
              email: state.email,
              whatsapp: state.whatsapp,
              segment: state.segment,
              avatarUrl: state.avatarUrl,
              pixKey: state.pixKey,
              pixType: state.pixType,
              themeColor: state.themeColor,
              themeMode: state.themeMode,
              bio: state.bio,
            };
            localStorage.setItem(`lypsyos_profile_${currentEmail}`, JSON.stringify(profileToCache));
          } catch (e) {}
        }

        set({
          ...initialState,
          isOnboarded: false,
          isAuthenticated: false,
          businessName: 'Meu Estabelecimento',
          responsibleName: '',
          email: '',
          whatsapp: '',
          subscription: defaultSubscription,
        });
      }
    }),
    {
      name: 'lypsyos-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.themeMode || 'light', state.themeColor || '#2563eb');
        }
      },
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
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
