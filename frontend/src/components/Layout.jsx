import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, CalendarClock, Bot, Megaphone, SlidersHorizontal, 
  MessageCircle, Sparkles, Crown, ArrowRight, UserCheck, LogOut,
  Sun, Moon, Palette, Smartphone, Download, Share, PlusSquare, X
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SEGMENTS } from '../lib/segmentSeeds';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LypsyosIconBadge } from './ui/LypsyosIconBadge';
import { SegmentIconBadge } from './ui/SegmentServiceIcon';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    businessName, responsibleName, segment, subscription, 
    avatarUrl, logout, themeMode, themeColor, 
    setThemeMode, loadUserProfile 
  } = useAppStore();

  const segmentObj = SEGMENTS.find(s => s.id === segment) || SEGMENTS[0];

  // Sincroniza o perfil completo do usuário ao carregar o Layout
  useEffect(() => {
    loadUserProfile();

    if (isSupabaseConfigured()) {
      const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user?.email) {
          await loadUserProfile(session.user.email, session.user.id);
        }
      });
      return () => authSub?.unsubscribe();
    }
  }, [loadUserProfile]);

  // Controle de PWA e Instalação em 1 Toque
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);
  const [dismissInstallBanner, setDismissInstallBanner] = useState(() => {
    try {
      return sessionStorage.getItem('lypsyos_dismiss_pwa_banner') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Detecta se já está rodando em modo standalone (PWA instalado)
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;
    setIsStandalone(isStandaloneMode);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIosInstallModal(true);
    } else {
      navigate('/settings');
    }
  };

  const handleDismissBanner = () => {
    setDismissInstallBanner(true);
    try {
      sessionStorage.setItem('lypsyos_dismiss_pwa_banner', 'true');
    } catch {}
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Serviços', path: '/services', icon: CalendarClock },
    { name: 'Meu Robô', path: '/bot', icon: Bot },
    { name: 'Marketing', path: '/marketing', icon: Megaphone },
    { name: 'Integrações', path: '/settings', icon: SlidersHorizontal },
    { name: 'Planos & Pro', path: '/pricing', icon: Crown },
    { name: 'Meu Perfil', path: '/profile', icon: UserCheck },
  ];

  const safeSubscription = subscription || {
    plan: 'PRO',
    status: 'TRIAL',
    daysRemaining: 30,
  };

  const isTrialOrFree = safeSubscription?.status === 'TRIAL' || safeSubscription?.plan === 'FREE';

  const handleLogout = async () => {
    if (!window.confirm("Deseja realmente sair da sua conta?")) return;
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      logout();
      navigate('/login');
    }
  };

  // Alternador Rápido de Tema (Claro -> Escuro -> Personalizado -> Claro)
  const toggleQuickTheme = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('custom');
    } else {
      setThemeMode('light');
    }
  };

  return (
    <div className="flex h-screen bg-canvas dark:bg-slate-950 text-ink dark:text-slate-100 font-sans transition-colors duration-200 overflow-x-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-surface dark:bg-slate-900 border-r border-line dark:border-slate-800 shadow-[1px_0_10px_rgba(36,87,245,0.03)]">
        
        {/* TOPO: DESTAQUE TOTAL PARA A MARCA DO ESTABELECIMENTO DO USUÁRIO */}
        <div className="p-5 border-b border-line/70 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0 group">
            <SegmentIconBadge segmentId={segment} size="md" />
            <div className="min-w-0 overflow-hidden">
              <h2 className="font-heading text-base font-extrabold text-ink dark:text-white tracking-tight leading-tight truncate" title={businessName || 'Meu Estabelecimento'}>
                {businessName || 'Meu Estabelecimento'}
              </h2>
              <span className="text-[11px] font-semibold text-ink-muted dark:text-slate-500 block truncate">
                {segmentObj?.title ? segmentObj.title.split('&')[0] : 'Zenda Platform'}
              </span>
            </div>
          </div>

          {/* Status do Robô no Estabelecimento & Alternador de Tema */}
          <div className="mt-3.5 flex items-center justify-between bg-canvas dark:bg-slate-800/60 border border-line/80 dark:border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-ink-soft dark:text-slate-400">Robô 24/7</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-growth-text dark:text-emerald-400 bg-growth-soft dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-growth/25 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-growth animate-pulse"></span>
                Ativo
              </span>
            </div>

            {/* Botão Rápido de Tema */}
            <button
              onClick={toggleQuickTheme}
              title={`Tema atual: ${themeMode === 'dark' ? 'Modo Escuro' : themeMode === 'custom' ? 'Modo Personalizado' : 'Modo Claro'}. Clique para alternar.`}
              className="p-1 rounded-lg text-ink-soft dark:text-slate-400 hover:text-ink dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {themeMode === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              ) : themeMode === 'custom' ? (
                <Palette className="w-3.5 h-3.5 text-pink-500" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              )}
            </button>
          </div>

          {/* Botão de Instalação PWA no Desktop com LypsyosIconBadge */}
          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              className="mt-2.5 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-canvas dark:bg-slate-800/60 border border-line/80 dark:border-slate-700/60 hover:border-brand/50 dark:hover:border-blue-500 hover:bg-brand-soft/50 dark:hover:bg-blue-950/20 text-ink dark:text-slate-200 text-xs font-semibold transition-all group cursor-pointer shadow-2xs"
              title="Instalar Zenda como Aplicativo"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <LypsyosIconBadge icon={Smartphone} tone="cyan" size="sm" />
                <div className="text-left min-w-0">
                  <span className="font-heading block leading-tight text-[11px] font-bold truncate">Instalar App</span>
                  <span className="block text-[9px] text-ink-muted dark:text-slate-500 font-medium leading-none truncate">Acesso em 1 clique</span>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand dark:group-hover:text-blue-400 transition-colors shrink-0" />
            </button>
          )}
        </div>

        {/* NAVEGAÇÃO PRINCIPAL */}
        <nav className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                style={isActive ? { backgroundColor: themeColor || '#2457f5' } : {}}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'text-white font-semibold shadow-[0_8px_20px_rgb(36_87_245/0.25)]' 
                    : 'text-ink-soft dark:text-slate-400 hover:bg-brand-soft/60 dark:hover:bg-slate-800/60 hover:text-brand dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-ink-muted dark:text-slate-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* CARD DE TRIAL / UPSELL NA SIDEBAR (Azul Noturno Corporativo #0B1F4D) */}
        {isTrialOrFree && (
          <div className="p-4">
            <div className="bg-gradient-to-br from-night via-[#122b66] to-[#09173a] text-white p-4 rounded-2xl shadow-lg border border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-cyan-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Zenda Pro
                </span>
                <span className="text-[10px] font-bold bg-white/10 text-white/90 px-2 py-0.5 rounded-full">
                  {safeSubscription?.daysRemaining || 30} dias
                </span>
              </div>
              <p className="text-[11px] text-white/75 leading-snug mb-3">
                Agendamento 24/7 sem limites e zero comissões.
              </p>
              <Link 
                to="/pricing"
                style={{ backgroundColor: themeColor || '#2457f5' }}
                className="w-full flex items-center justify-center gap-1.5 text-white py-2 px-3 rounded-btn text-xs font-bold transition-all shadow-[0_8px_20px_rgb(36_87_245/0.3)] hover:opacity-95"
              >
                <span>Garantir Plano Pro</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* PERFIL DO USUÁRIO & BOTÃO SAIR */}
        <div className="px-4 py-3 border-t border-line/70 dark:border-slate-800 flex items-center justify-between bg-canvas/60 dark:bg-slate-900/50">
          <Link to="/profile" className="flex items-center gap-2.5 min-w-0 overflow-hidden hover:opacity-80 transition-opacity">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full object-cover border border-line dark:border-slate-700 shadow-2xs shrink-0"
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border shadow-2xs shrink-0"
                style={{ 
                  backgroundColor: `${themeColor || '#2457f5'}20`, 
                  borderColor: `${themeColor || '#2457f5'}40`,
                  color: themeColor || '#2457f5'
                }}
              >
                {responsibleName ? responsibleName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="min-w-0 overflow-hidden">
              <p className="text-xs font-bold text-ink dark:text-slate-200 truncate">{responsibleName || 'Minha Conta'}</p>
              <span className="text-[10px] text-ink-muted dark:text-slate-500 block truncate">Editar Perfil</span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title="Sair da Conta (Logout)"
            className="p-1.5 rounded-lg text-ink-muted hover:text-danger dark:hover:text-rose-400 hover:bg-danger-soft/60 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* RODAPÉ MINIMALISTA COM ÍCONE ZENDA & LOGO LYPSYOS */}
        <div className="p-3 border-t border-line/70 dark:border-slate-800 flex items-center justify-between text-xs text-ink-muted dark:text-slate-500">
          <div className="flex items-center gap-1.5 font-bold text-ink dark:text-slate-200">
            <div className="w-5 h-5 rounded-md bg-white border border-line/80 p-0.5 flex items-center justify-center shadow-2xs shrink-0">
              <img src="/logo-lypsyos-zenda-r1.svg" alt="Zenda" className="w-full h-full object-contain" />
            </div>
            <span className="text-[10px] tracking-tight font-heading">Zenda CRM</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-ink-soft dark:text-slate-400">
            <div className="w-4 h-4 rounded-md bg-white border border-line/80 p-0.5 flex items-center justify-center shadow-2xs shrink-0">
              <img src="/logo-oficial.png" alt="Lypsyos" className="w-full h-full object-contain" />
            </div>
            <span className="text-[10px] tracking-tight font-heading">Powered by Lypsyos</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-canvas dark:bg-slate-950">
        {/* BANNER GLOBAL DE RETENÇÃO / UPSELL NO TOPO */}
        {isTrialOrFree && (
          <div 
            style={{ 
              background: `linear-gradient(90deg, ${themeColor || '#2457f5'} 0%, #0b1f4d 100%)` 
            }}
            className="text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between gap-2 shadow-sm z-20"
          >
            <div className="flex items-center gap-2 min-w-0 max-w-3xl truncate">
              <span className="bg-growth-soft text-growth-text text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shrink-0">
                ⭐ Zenda Pro Ativo
              </span>
              <span className="truncate">
                Você tem <strong>{safeSubscription?.daysRemaining || 30} dias grátis</strong> restantes com agendamento ilimitado 24/7.
              </span>
            </div>

            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 bg-white text-brand hover:bg-brand-soft font-bold px-3 py-1 rounded-lg text-xs transition-colors shrink-0 shadow-2xs"
            >
              <span>Seja Pro</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Mobile Header com foco no estabelecimento e Ícone Oficial Zenda */}
        <header className="md:hidden p-4 bg-surface dark:bg-slate-900 border-b border-line dark:border-slate-800 flex items-center justify-between gap-2 sticky top-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-line dark:border-slate-700 p-1 shadow-xs">
              <img src="/logo-lypsyos-zenda-r1.svg" alt="Zenda" className="size-full object-contain" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <h1 className="font-heading text-sm font-bold text-ink dark:text-white truncate">{businessName || 'Meu Estabelecimento'}</h1>
              <span className="text-[10px] text-ink-muted dark:text-slate-500 block truncate">Zenda • Powered by Lypsyos</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                style={{ backgroundColor: themeColor || '#2457f5' }}
                title="Instalar App no celular"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px]">Instalar</span>
              </button>
            )}
            <button
              onClick={toggleQuickTheme}
              title="Alternar Tema"
              className="p-1.5 rounded-lg text-ink-soft dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {themeMode === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
            <Link to="/profile" className="rounded-full border border-line dark:border-slate-700 overflow-hidden shadow-2xs shrink-0">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: `${themeColor || '#2457f5'}20`, color: themeColor || '#2457f5' }}
                >
                  {responsibleName ? responsibleName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-ink-muted hover:text-danger dark:hover:text-rose-400"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* View com Scroll Seguro (Sem Overflow Horizontal) */}
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="max-w-7xl mx-auto min-w-0 pb-20 md:pb-8">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Botão Flutuante de Suporte via WhatsApp */}
      <a
        href="https://wa.me/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Atendimento via WhatsApp"
        className="fixed bottom-20 md:bottom-6 right-5 w-13 h-13 bg-growth hover:bg-growth-text text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all z-40"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
      </a>

      {/* Banner Flutuante de Instalação Mobile (PWA 1-Toque com Azul Noturno #0B1F4D e Ícone Zenda) */}
      {!isStandalone && !dismissInstallBanner && (
        <aside 
          aria-label="Instalação do Aplicativo"
          className="fixed bottom-18 left-3 right-3 md:hidden z-35"
        >
          <div className="bg-night/95 text-white p-3 rounded-2xl shadow-2xl backdrop-blur-md border border-white/15 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md">
                <img src="/logo-lypsyos-zenda-r1.svg" alt="Zenda" className="size-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-xs font-extrabold text-white leading-tight truncate">
                  Instalar Zenda no Celular
                </p>
                <p className="text-[10px] text-white/70 leading-tight truncate">
                  Acesso rápido direto da sua tela inicial
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                style={{ backgroundColor: themeColor || '#2457f5' }}
                className="px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>
              <button
                onClick={handleDismissBanner}
                className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Fechar aviso de instalação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Modal Guia de Instalação para iOS Safari */}
      {showIosInstallModal && (
        <div className="fixed inset-0 bg-night/70 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-line dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white border border-line p-1 shadow-sm">
                  <img src="/logo-lypsyos-zenda-r1.svg" alt="Zenda" className="size-full object-contain" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-ink dark:text-white text-sm">Instalar no iPhone / iPad</h3>
                  <span className="text-[11px] text-ink-muted dark:text-slate-500">3 passos rápidos no Safari</span>
                </div>
              </div>
              <button
                onClick={() => setShowIosInstallModal(false)}
                className="p-1 rounded-full text-ink-muted hover:text-ink dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div className="flex items-start gap-3 bg-canvas dark:bg-slate-800/60 p-3 rounded-2xl border border-line dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-brand-soft dark:bg-blue-900/50 text-brand dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-ink-soft dark:text-slate-300 leading-snug">
                  Toque no botão <strong className="text-brand dark:text-blue-400 inline-flex items-center gap-1 mx-1"><Share className="w-3.5 h-3.5 inline" /> Compartilhar</strong> na barra inferior do Safari.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-canvas dark:bg-slate-800/60 p-3 rounded-2xl border border-line dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-brand-soft dark:bg-blue-900/50 text-brand dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-ink-soft dark:text-slate-300 leading-snug">
                  Role o menu e selecione <strong className="text-ink dark:text-white inline-flex items-center gap-1 mx-1"><PlusSquare className="w-3.5 h-3.5 inline" /> Adicionar à Tela de Início</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-canvas dark:bg-slate-800/60 p-3 rounded-2xl border border-line dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-brand-soft dark:bg-blue-900/50 text-brand dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs text-ink-soft dark:text-slate-300 leading-snug">
                  Toque em <strong className="text-brand dark:text-blue-400">"Adicionar"</strong> no canto superior direito para finalizar.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosInstallModal(false)}
              style={{ backgroundColor: themeColor || '#2457f5' }}
              className="w-full py-2.5 rounded-btn text-white font-bold text-xs shadow-[0_8px_20px_rgb(36_87_245/0.25)] hover:opacity-90 transition-opacity cursor-pointer text-center"
            >
              Entendi, pronto!
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-surface/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-line dark:border-slate-800 flex justify-around p-2 z-30 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              style={isActive ? { color: themeColor || '#2457f5' } : {}}
              className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                isActive ? 'font-semibold' : 'text-ink-muted dark:text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
