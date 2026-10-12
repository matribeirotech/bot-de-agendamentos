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

const GLOBAL_PROFILE_KEY = 'lypsyos_active_profile';

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
          try {
            localStorage.setItem(GLOBAL_PROFILE_KEY, JSON.stringify(next));
            if (next.email) {
              localStorage.setItem(`lypsyos_profile_${next.email.toLowerCase().trim()}`, JSON.stringify(next));
            }
          } catch (e) {}
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

      // Carregar Perfil Completo (Multi-Layer com Fallback Infalível)
      loadUserProfile: async (emailHint) => {
        const state = get();
        let targetEmail = (emailHint || state.email || '').toLowerCase().trim();
        let loaded = {};

        // 1. Camada 1: Supabase Auth Session & Metadata
        if (isSupabaseConfigured()) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (user) {
              targetEmail = (user.email || targetEmail).toLowerCase().trim();
              loaded.email = user.email;

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
                if (dbUser.theme_mode) loaded.themeMode = dbUser.theme_mode;
                if (dbUser.bio) loaded.bio = dbUser.bio;
                if (dbUser.segmento) loaded.segment = dbUser.segmento;
              }
            }
          } catch (supaErr) {
            console.warn('Supabase profile load warning:', supaErr);
          }
        }

        // 2. Camada 2: Cache LocalStorage Específico por E-mail
        if (targetEmail) {
          try {
            const rawCache = localStorage.getItem(`lypsyos_profile_${targetEmail}`);
            if (rawCache) {
              const parsed = JSON.parse(rawCache);
              if (parsed && typeof parsed === 'object') {
                for (const key of Object.keys(parsed)) {
                  if (parsed[key] && !loaded[key]) {
                    loaded[key] = parsed[key];
                  }
                }
              }
            }
          } catch (e) {
            console.warn('Erro ao ler cache do usuário:', e);
          }
        }

        // 3. Camada 3: Cache LocalStorage Global Ativo (Fallback)
        try {
          const rawGlobal = localStorage.getItem(GLOBAL_PROFILE_KEY);
          if (rawGlobal) {
            const parsedGlobal = JSON.parse(rawGlobal);
            if (parsedGlobal && typeof parsedGlobal === 'object') {
              for (const key of Object.keys(parsedGlobal)) {
                if (parsedGlobal[key] && !loaded[key]) {
                  loaded[key] = parsedGlobal[key];
                }
              }
            }
          }
        } catch (e) {}

        // 4. Camada 4: Backend Django (Nome do Estabelecimento do Bot / Tenant)
        try {
          const res = await axios.get('http://localhost:8000/api/v1/bot/config/');
          if (res.data?.business_name && (!loaded.businessName || loaded.businessName === 'Meu Estabelecimento')) {
            loaded.businessName = res.data.business_name;
          }
        } catch (e) {}

        // Consolida estado e aplica tema
        if (Object.keys(loaded).length > 0) {
          const merged = {
            ...state,
            ...loaded,
            email: targetEmail || loaded.email || state.email,
            isOnboarded: true,
            isAuthenticated: true,
          };
          set(merged);

          // Mantém ambos os caches salvos e consistentes
          try {
            localStorage.setItem(GLOBAL_PROFILE_KEY, JSON.stringify(merged));
            if (targetEmail) {
              localStorage.setItem(`lypsyos_profile_${targetEmail}`, JSON.stringify(merged));
            }
          } catch (e) {}

          applyTheme(merged.themeMode || 'light', merged.themeColor || '#2563eb');
        }

        return loaded;
      },

      // Salvar Perfil Completo (Multi-Layer com Sincronização Garantida)
      saveUserProfile: async (formData) => {
        const state = get();
        const merged = { ...state, ...formData };
        set(merged);

        let email = (merged.email || '').toLowerCase().trim();

        // Se o e-mail não foi informado no formulário, tenta obter do Supabase
        if (!email && isSupabaseConfigured()) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
              email = session.user.email.toLowerCase().trim();
              merged.email = email;
              set({ email });
            }
          } catch (e) {}
        }

        // 1. Salva nos caches locais imediatamente
        try {
          localStorage.setItem(GLOBAL_PROFILE_KEY, JSON.stringify(merged));
          if (email) {
            localStorage.setItem(`lypsyos_profile_${email}`, JSON.stringify(merged));
          }
        } catch (e) {
          console.warn('Erro ao salvar cache local:', e);
        }

        // 2. Salva no Supabase (Auth metadata e public.usuarios)
        if (isSupabaseConfigured()) {
          try {
            const respName = (formData.responsibleName ?? merged.responsibleName ?? '').trim();
            const phone = (formData.whatsapp ?? merged.whatsapp ?? '').trim();
            const salon = (formData.businessName ?? merged.businessName ?? '').trim();
            const currentMode = formData.themeMode || merged.themeMode || 'light';
            const currentColor = formData.themeColor || merged.themeColor || '#2563eb';

            // Metadados do Supabase Auth (pequenos e seguros para evitar limite de tamanho)
            const safeAvatarForMeta = (formData.avatarUrl && !formData.avatarUrl.startsWith('data:'))
              ? formData.avatarUrl
              : '';

            await supabase.auth.updateUser({
              data: {
                nome_completo: respName,
                nome_salao: salon,
                whatsapp: phone,
                avatar_url: safeAvatarForMeta,
                chave_pix: formData.pixKey ?? merged.pixKey ?? '',
                tipo_chave_pix: formData.pixType ?? merged.pixType ?? 'TELEFONE',
                cor_primaria: currentColor,
                theme_mode: currentMode,
                bio: formData.bio ?? merged.bio ?? '',
                segmento: formData.segment ?? merged.segment ?? 'manicure'
              }
            });

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // Tabela public.usuarios (estritamente as colunas existentes no schema)
              const usuarioRow = {
                id: user.id,
                nome_completo: respName || 'Responsável',
                nome_salao: salon || 'Meu Estabelecimento',
                whatsapp: phone,
                avatar_url: formData.avatarUrl ?? merged.avatarUrl ?? '',
                chave_pix: (formData.pixKey ?? merged.pixKey ?? '').trim(),
                tipo_chave_pix: formData.pixType ?? merged.pixType ?? 'TELEFONE',
                cor_primaria: currentColor,
                bio: (formData.bio ?? merged.bio ?? '').trim(),
                segmento: formData.segment ?? merged.segment ?? 'manicure',
                atualizado_em: new Date().toISOString()
              };

              // Tenta UPDATE primeiro
              const { error: updateErr, data: updatedData } = await supabase
                .from('usuarios')
                .update(usuarioRow)
                .eq('id', user.id)
                .select();

              // Se não encontrou registro para atualizar ou ocorreu erro, faz UPSERT
              if (updateErr || !updatedData || updatedData.length === 0) {
                const { error: upsertErr } = await supabase
                  .from('usuarios')
                  .upsert(usuarioRow, { onConflict: 'id' });
                if (upsertErr) {
                  console.warn('Aviso ao sincronizar usuarios no Supabase:', upsertErr);
                }
              }
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
          } catch (err) {}
        }

        // 4. Aplica tema ativo
        applyTheme(formData.themeMode || state.themeMode || 'light', formData.themeColor || state.themeColor || '#2563eb');
      },

      // Logout Seguro (Preserva as configurações do perfil no navegador e apenas encerra a sessão ativa)
      logout: () => {
        const state = get();
        const currentEmail = (state.email || '').toLowerCase().trim();

        // 1. Salva snapshot do perfil atual no cache antes de deslogar
        const profileSnapshot = {
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

        try {
          localStorage.setItem(GLOBAL_PROFILE_KEY, JSON.stringify(profileSnapshot));
          if (currentEmail) {
            localStorage.setItem(`lypsyos_profile_${currentEmail}`, JSON.stringify(profileSnapshot));
          }
        } catch (e) {}

        // 2. Encerra a autenticação sem apagar as configurações visuais e dados cadastrados
        set({
          isOnboarded: false,
          isAuthenticated: false,
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
