import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  Sparkles,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { BotDefense } from '../lib/security';

function translateAuthError(rawMessage = '') {
  const msg = String(rawMessage || '').toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos. Confira seus dados e tente novamente.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Confirme o link enviado para o seu e-mail antes de entrar.';
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.';
  }
  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return 'Sem conexão no momento. Verifique sua internet e tente novamente.';
  }
  return 'Não foi possível entrar na sua conta. Confira seu e-mail e senha.';
}

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (BotDefense.isHoneypotTriggered(honeypot)) {
      setErrorMsg('Não foi possível concluir o acesso agora. Tente novamente.');
      setLoading(false);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured()) {
      if (import.meta.env.DEV) {
        console.warn('[Zenda Dev] Supabase não configurado no .env; autenticando em modo local.');
      }
      await useAppStore.getState().loadUserProfile(cleanEmail);
      useAppStore.getState().setBusinessData({
        email: cleanEmail,
        isAuthenticated: true,
        isOnboarded: true,
      });
      setLoading(false);
      navigate('/');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      const loggedEmail = data?.user?.email || cleanEmail;
      await useAppStore.getState().loadUserProfile(loggedEmail, data?.user?.id);
      useAppStore.getState().setBusinessData({
        email: loggedEmail,
        isAuthenticated: true,
        isOnboarded: true,
      });

      navigate('/');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      setErrorMsg(translateAuthError(error?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');

    if (!isSupabaseConfigured()) {
      setErrorMsg('Use seu e-mail e senha abaixo para entrar na sua conta.');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      setErrorMsg('Não foi possível entrar com o Google agora. Tente com seu e-mail.');
    }
  };

  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Cabeçalho Compacto Mobile-First */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3 group mb-4">
          <img
            src="/logo-lypsyos-zenda-r1.svg"
            alt="Zenda"
            className="w-12 h-12 rounded-2xl object-contain bg-surface dark:bg-slate-900 p-1 shadow-sm border border-line dark:border-slate-800 group-hover:scale-105 transition-transform"
          />
          <div className="text-left">
            <span className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-ink dark:text-white block leading-none">
              Zenda
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand dark:text-blue-400 mt-1 flex items-center gap-1">
              <img src="/logo-oficial.png" alt="Lypsyos" className="w-3.5 h-3.5 object-contain inline" />
              by Lypsyos
            </span>
          </div>
        </Link>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-growth-soft dark:bg-emerald-950/50 text-growth-text dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <Sparkles className="w-3.5 h-3.5 text-growth" />
            30 dias grátis no Plano Profissional
          </span>
        </div>

        <h1 className="mt-3.5 font-heading text-2xl font-bold tracking-tight text-ink dark:text-white">
          Entre no seu painel
        </h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">
          Acompanhe sua agenda e seus clientes pelo celular
        </p>
      </div>

      {/* Card Principal */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface dark:bg-slate-900 py-6 px-5 sm:py-8 sm:px-8 shadow-soft rounded-3xl border border-line dark:border-slate-800">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login com Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full min-h-11 flex items-center justify-center gap-3 py-2.5 px-4 border border-line dark:border-slate-700 rounded-xl text-sm font-semibold text-ink dark:text-slate-200 bg-surface dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            Entrar com o Google
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
              <span className="bg-surface dark:bg-slate-900 px-3 text-ink-muted dark:text-slate-500">
                ou com seu e-mail
              </span>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink dark:text-slate-200 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-11 pl-10 pr-4 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-950 text-ink dark:text-white border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
            </div>

            <input
              type="text"
              name="website_url_confirm"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              style={{ display: 'none' }}
            />

            <div>
              <label className="block text-xs font-bold text-ink dark:text-slate-200 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-11 pl-10 pr-11 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-950 text-ink dark:text-white border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-12 flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-semibold text-sm py-3.5 rounded-xl shadow-md shadow-brand/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Criar Conta */}
          <div className="mt-5 pt-4 border-t border-line dark:border-slate-800 text-center">
            <p className="text-xs text-ink-soft dark:text-slate-400 mb-2.5">
              Ainda não tem uma conta no Zenda?
            </p>
            <Link
              to="/onboarding"
              className="w-full min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-brand/25 bg-brand-soft/60 dark:bg-blue-950/40 text-xs font-bold text-brand dark:text-blue-300 hover:bg-brand-soft transition-colors"
            >
              Criar minha conta • 30 dias grátis
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Garantias */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-ink-muted dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-growth" />
            Sem cartão de crédito
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-brand" />
            Cancele quando quiser
          </span>
        </div>
      </div>
    </div>
  );
}
