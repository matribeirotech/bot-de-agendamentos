import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  Bot,
  Megaphone,
  SlidersHorizontal,
  MessageCircle,
  Sparkles,
  Crown,
  ArrowRight,
  UserCheck,
  LogOut,
  Sun,
  Moon,
  Palette,
  Smartphone,
  Download,
  Share,
  PlusSquare,
  X,
  Menu,
  ChevronRight,
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
    businessName,
    responsibleName,
    segment,
    subscription,
    avatarUrl,
    logout,
    themeMode,
    themeColor,
    setThemeMode,
    loadUserProfile,
  } = useAppStore();

  const segmentObj = SEGMENTS.find((s) => s.id === segment) || SEGMENTS[0];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sincroniza o perfil completo do usuário ao carregar o Layout
  useEffect(() => {
    loadUserProfile();

    if (isSupabaseConfigured()) {
      const {
        data: { subscription: authSub },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user?.email) {
          await loadUserProfile(session.user.email, session.user.id);
        }
      });
      return () => authSub?.unsubscribe();
    }
  }, [loadUserProfile]);

  // Fecha a gaveta mobile automaticamente ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Controle de Instalação do Aplicativo (1 Toque)
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);

  useEffect(() => {
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
    setMobileMenuOpen(false);
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

  // Navegação completa Desktop
  const navItems = [
    { name: 'Agenda', path: '/', icon: LayoutDashboard },
    { name: 'Serviços', path: '/services', icon: CalendarClock },
    { name: 'Meu Robô', path: '/bot', icon: Bot },
    { name: 'Campanhas', path: '/marketing', icon: Megaphone },
    { name: 'Canais & Avisos', path: '/settings', icon: SlidersHorizontal },
    { name: 'Planos', path: '/pricing', icon: Crown },
    { name: 'Meu Perfil', path: '/profile', icon: UserCheck },
  ];

  // Navegação Mobile Otimizada (4 abas principais + Menu Mais = 5 alvos confortáveis de polegar)
  const mobilePrimaryTabs = [
    { name: 'Agenda', path: '/', icon: LayoutDashboard },
    { name: 'Serviços', path: '/services', icon: CalendarClock },
    { name: 'Robô', path: '/bot', icon: Bot },
    { name: 'Disparos', path: '/marketing', icon: Megaphone },
  ];

  const isSecondaryRouteActive = ['/settings', '/pricing', '/profile'].includes(location.pathname);

  const safeSubscription = subscription || {
    plan: 'PRO',
    status: 'TRIAL',
    daysRemaining: 30,
  };

  const isTrialOrFree =
    safeSubscription?.status === 'TRIAL' || safeSubscription?.plan === 'FREE';

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    if (!window.confirm('Deseja realmente sair da sua conta?')) return;
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Logout warning:', err);
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

  const renderThemeIcon = (sizeClass = 'w-4 h-4') => {
    if (themeMode === 'dark') return <Moon className={`${sizeClass} text-indigo-400`} />;
    if (themeMode === 'custom') return <Palette className={`${sizeClass} text-pink-500`} />;
    return <Sun className={`${sizeClass} text-amber-500`} />;
  };

  return (
    <div className="flex h-screen bg-canvas dark:bg-slate-950 text-ink dark:text-slate-100 font-sans transition-colors duration-200 overflow-x-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-surface dark:bg-slate-900 border-r border-line dark:border-slate-800 shadow-[1px_0_10px_rgba(36,87,245,0.03)]">
        {/* TOPO: DESTAQUE PARA O ESTABELECIMENTO DO USUÁRIO */}
        <div className="p-5 border-b border-line/70 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0 group">
            <SegmentIconBadge segmentId={segment} size="md" />
            <div className="min-w-0 overflow-hidden">
              <h2
                className="font-heading text-base font-extrabold text-ink dark:text-white tracking-tight leading-tight truncate"
                title={businessName || 'Meu Estabelecimento'}
              >
                {businessName || 'Meu Estabelecimento'}
              </h2>
              <span className="text-[11px] font-semibold text-ink-muted dark:text-slate-500 block truncate">
                {segmentObj?.title ? segmentObj.title.split('&')[0] : 'Meu Espaço'}
              </span>
            </div>
          </div>

          {/* Status do Robô & Alternador de Tema */}
          <div className="mt-3.5 flex items-center justify-between bg-canvas dark:bg-slate-800/60 border border-line/80 dark:border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-ink-soft dark:text-slate-400">Robô 24h</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-growth-text dark:text-emerald-400 bg-growth-soft dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-growth/25 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-growth animate-pulse"></span>
                Ativo
              </span>
            </div>

            <button
              onClick={toggleQuickTheme}
              title={`Tema atual: ${
                themeMode === 'dark' ? 'Escuro' : themeMode === 'custom' ? 'Sua Cor' : 'Claro'
              }`}
              className="p-1.5 rounded-lg text-ink-soft dark:text-slate-400 hover:text-ink dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {renderThemeIcon('w-3.5 h-3.5')}
            </button>
          </div>

          {/* Botão de Instalação no Desktop */}
          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              className="mt-2.5 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-canvas dark:bg-slate-800/60 border border-line/80 dark:border-slate-700/60 hover:border-brand/50 dark:hover:border-blue-500 hover:bg-brand-soft/50 dark:hover:bg-blue-950/20 text-ink dark:text-slate-200 text-xs font-semibold transition-all group cursor-pointer shadow-2xs"
              title="Instalar Zenda como Aplicativo"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <LypsyosIconBadge icon={Smartphone} tone="cyan" size="sm" />
                <div className="text-left min-w-0">
                  <span className="font-heading block leading-tight text-[11px] font-bold truncate">
                    Instalar App
                  </span>
                  <span className="block text-[9px] text-ink-muted dark:text-slate-500 font-medium leading-none truncate">
                    Acesso em 1 toque
                  </span>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand dark:group-hover:text-blue-400 transition-colors shrink-0" />
            </button>
          )}
        </div>

        {/* NAVEGAÇÃO PRINCIPAL */}
        <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
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
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-ink-muted dark:text-slate-500'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* CARD DE PLANO PRO NA SIDEBAR */}
        {isTrialOrFree && (
          <div className="p-4">
            <div className="bg-gradient-to-br from-night via-[#122b66] to-[#09173a] text-white p-4 rounded-2xl shadow-lg border border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-cyan-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Zenda Pro
                </span>
                <span className="text-[10px] font-bold bg-white/10 text-white/90 px-2 py-0.5 rounded-full">
                  {safeSubscription?.daysRemaining || 30} dias grátis
                </span>
              </div>
              <p className="text-[11px] text-white/75 leading-snug mb-3">
                Atendimento 24h sem limites e zero comissões.
              </p>
              <Link
                to="/pricing"
                style={{ backgroundColor: themeColor || '#2457f5' }}
                className="w-full flex items-center justify-center gap-1.5 text-white py-2 px-3 rounded-btn text-xs font-bold transition-all shadow-[0_8px_20px_rgb(36_87_245/0.3)] hover:opacity-95"
              >
                <span>Ver Planos</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* PERFIL DO USUÁRIO & BOTÃO SAIR */}
        <div className="px-4 py-3 border-t border-line/70 dark:border-slate-800 flex items-center justify-between bg-canvas/60 dark:bg-slate-900/50">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 min-w-0 overflow-hidden hover:opacity-80 transition-opacity"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Foto"
                className="w-8 h-8 rounded-full object-cover border border-line dark:border-slate-700 shadow-2xs shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border shadow-2xs shrink-0"
                style={{
                  backgroundColor: `${themeColor || '#2457f5'}20`,
                  borderColor: `${themeColor || '#2457f5'}40`,
                  color: themeColor || '#2457f5',
                }}
              >
                {responsibleName ? responsibleName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="min-w-0 overflow-hidden">
              <p className="text-xs font-bold text-ink dark:text-slate-200 truncate">
                {responsibleName || 'Minha Conta'}
              </p>
              <span className="text-[10px] text-ink-muted dark:text-slate-500 block truncate">
                Editar Perfil
              </span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title="Sair da Conta"
            className="p-2 rounded-lg text-ink-muted hover:text-danger dark:hover:text-rose-400 hover:bg-danger-soft/60 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* RODAPÉ MINIMALISTA */}
        <div className="px-4 py-2.5 border-t border-line/70 dark:border-slate-800 flex items-center justify-between text-xs text-ink-muted dark:text-slate-500">
          <div className="flex items-center gap-1.5 font-bold text-ink dark:text-slate-200">
            <div className="w-5 h-5 rounded-md bg-white border border-line/80 p-0.5 flex items-center justify-center shadow-2xs shrink-0">
              <img src="/logo-lypsyos-zenda-r1.svg" alt="Zenda" className="w-full h-full object-contain" />
            </div>
            <span className="text-[10px] tracking-tight font-heading">Zenda</span>
          </div>
          <span className="text-[10px] text-ink-muted dark:text-slate-500 font-medium">
            by Lypsyos
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-canvas dark:bg-slate-950">
        {/* FAIXA COMPACTA DE TESTE GRÁTIS */}
        {isTrialOrFree && (
          <div
            style={{
              background: `linear-gradient(90deg, ${themeColor || '#2457f5'} 0%, #0b1f4d 100%)`,
            }}
            className="text-white px-3 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium flex items-center justify-between gap-2 z-20"
          >
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span className="truncate">
                <strong>{safeSubscription?.daysRemaining || 30} dias grátis</strong> no Plano Pro
                <span className="hidden sm:inline"> • Agendamento automático 24h liberado</span>
              </span>
            </div>

            <Link
              to="/pricing"
              className="inline-flex items-center gap-1 bg-white/95 hover:bg-white text-brand font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors shrink-0 shadow-2xs"
            >
              <span>Planos</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* MOBILE HEADER LIMPO E COM ALVOS DE TOQUE CONFORTÁVEIS */}
        <header className="md:hidden px-3.5 py-2.5 bg-surface/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-line dark:border-slate-800 flex items-center justify-between gap-2 sticky top-0 z-20">
          <Link to="/" className="flex items-center gap-2.5 min-w-0 overflow-hidden">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-line dark:border-slate-700 p-1 shadow-2xs">
              <img src="/logo-lypsyos-zenda-r1.svg" alt="Zenda" className="size-full object-contain" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <h1 className="font-heading text-sm font-bold text-ink dark:text-white truncate leading-tight">
                {businessName || 'Meu Estabelecimento'}
              </h1>
              <span className="text-[10px] font-semibold text-growth-text dark:text-emerald-400 flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-growth animate-pulse shrink-0"></span>
                Atendimento 24h ativo
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1 px-2.5 min-h-9 rounded-xl text-[11px] font-bold text-white shadow-2xs transition-transform active:scale-95 cursor-pointer"
                style={{ backgroundColor: themeColor || '#2457f5' }}
                title="Instalar aplicativo no celular"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>
            )}
            <button
              onClick={toggleQuickTheme}
              title="Alternar tema claro/escuro"
              className="size-9 rounded-xl flex items-center justify-center text-ink-soft dark:text-slate-400 bg-canvas dark:bg-slate-800 border border-line/70 dark:border-slate-700 active:scale-95 transition-transform cursor-pointer"
            >
              {renderThemeIcon('w-4 h-4')}
            </button>
            <Link
              to="/profile"
              title="Meu Perfil"
              className="size-9 rounded-xl border border-line dark:border-slate-700 overflow-hidden shadow-2xs shrink-0 flex items-center justify-center active:scale-95 transition-transform"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: `${themeColor || '#2457f5'}20`,
                    color: themeColor || '#2457f5',
                  }}
                >
                  {responsibleName ? responsibleName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Área de Conteúdo Principal (Scroll Seguro + Respiro para a Barra Inferior Mobile) */}
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto min-w-0 pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-8">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Botão Flutuante de Suporte apenas no Desktop (no Mobile fica no Menu Mais para nunca cobrir botões!) */}
      <a
        href="https://wa.me/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com suporte no WhatsApp"
        title="Precisa de ajuda? Fale conosco no WhatsApp"
        className="hidden md:flex fixed bottom-6 right-6 w-12 h-12 bg-growth hover:bg-growth-text text-white rounded-full items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all z-40"
      >
        <MessageCircle className="w-5 h-5 fill-current" />
      </a>

      {/* GAVETA INFERIOR MOBILE ("MENU MAIS") — ERGONOMIA DE POLEGAR */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-night/60 backdrop-blur-xs z-50 flex items-end animate-in fade-in duration-150"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-surface dark:bg-slate-900 w-full rounded-t-3xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] border-t border-line dark:border-slate-800 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Alça visual de arraste */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-2" />

            {/* Cabeçalho do Estabelecimento */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-line dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <SegmentIconBadge segmentId={segment} size="sm" />
                <div className="min-w-0">
                  <p className="font-heading font-bold text-sm text-ink dark:text-white truncate">
                    {businessName || 'Meu Estabelecimento'}
                  </p>
                  <p className="text-xs text-ink-muted dark:text-slate-400 truncate">
                    {responsibleName || 'Acesso Rápido'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="size-9 rounded-full bg-canvas dark:bg-slate-800 text-ink-soft dark:text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lista de Opções com Alvos >= 48px */}
            <div className="space-y-2">
              <Link
                to="/settings"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-canvas dark:bg-slate-800/70 border border-line/80 dark:border-slate-800 text-ink dark:text-white font-semibold text-sm active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block leading-tight">Conectar WhatsApp & Avisos</span>
                    <span className="text-[11px] font-normal text-ink-muted dark:text-slate-400">
                      Leitura do QR Code, alertas e agenda
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted" />
              </Link>

              <Link
                to="/profile"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-canvas dark:bg-slate-800/70 border border-line/80 dark:border-slate-800 text-ink dark:text-white font-semibold text-sm active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-brand dark:text-blue-400 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block leading-tight">Meu Perfil & Cores</span>
                    <span className="text-[11px] font-normal text-ink-muted dark:text-slate-400">
                      Dados do negócio, chave PIX e aparência
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted" />
              </Link>

              <Link
                to="/pricing"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-canvas dark:bg-slate-800/70 border border-line/80 dark:border-slate-800 text-ink dark:text-white font-semibold text-sm active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block leading-tight">Planos & Assinatura</span>
                    <span className="text-[11px] font-normal text-ink-muted dark:text-slate-400">
                      {safeSubscription?.daysRemaining || 30} dias grátis ativos no Pro
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted" />
              </Link>

              {!isStandalone && (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-brand-soft/60 dark:bg-blue-950/40 border border-brand/25 dark:border-blue-800/60 text-brand dark:text-blue-300 font-semibold text-sm active:scale-[0.99] transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-brand text-white flex items-center justify-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block leading-tight">Instalar Zenda no Celular</span>
                      <span className="text-[11px] font-normal opacity-80">
                        Criar atalho direto na sua tela inicial
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Ações Rápidas Inferiores: Suporte e Sair */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 min-h-11 rounded-xl bg-[#25D366]/12 text-[#128C7E] dark:text-emerald-400 border border-[#25D366]/30 text-xs font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Suporte WhatsApp</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 min-h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/60 text-xs font-bold cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Guia de Instalação para iPhone / iPad */}
      {showIosInstallModal && (
        <div className="fixed inset-0 bg-night/70 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-line dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white border border-line p-1 shadow-sm">
                  <img src="/logo-lypsyos-zenda-r1.svg" alt="Zenda" className="size-full object-contain" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-ink dark:text-white text-sm">
                    Instalar no iPhone / iPad
                  </h3>
                  <span className="text-[11px] text-ink-muted dark:text-slate-500">
                    3 passos rápidos no Safari
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowIosInstallModal(false)}
                className="p-1.5 rounded-full text-ink-muted hover:text-ink dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                  Toque em{' '}
                  <strong className="text-brand dark:text-blue-400 inline-flex items-center gap-1 mx-1">
                    <Share className="w-3.5 h-3.5 inline" /> Compartilhar
                  </strong>{' '}
                  na barra do Safari.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-canvas dark:bg-slate-800/60 p-3 rounded-2xl border border-line dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-brand-soft dark:bg-blue-900/50 text-brand dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-ink-soft dark:text-slate-300 leading-snug">
                  Escolha{' '}
                  <strong className="text-ink dark:text-white inline-flex items-center gap-1 mx-1">
                    <PlusSquare className="w-3.5 h-3.5 inline" /> Adicionar à Tela de Início
                  </strong>
                  .
                </div>
              </div>

              <div className="flex items-start gap-3 bg-canvas dark:bg-slate-800/60 p-3 rounded-2xl border border-line dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-brand-soft dark:bg-blue-900/50 text-brand dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs text-ink-soft dark:text-slate-300 leading-snug">
                  Toque em <strong className="text-brand dark:text-blue-400">"Adicionar"</strong> no
                  canto superior direito.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosInstallModal(false)}
              style={{ backgroundColor: themeColor || '#2457f5' }}
              className="w-full min-h-11 rounded-btn text-white font-bold text-xs shadow-[0_8px_20px_rgb(36_87_245/0.25)] hover:opacity-90 transition-opacity cursor-pointer text-center"
            >
              Entendi!
            </button>
          </div>
        </div>
      )}

      {/* BARRA INFERIOR MOBILE — 5 ALVOS ERGONÔMICOS DE POLEGAR (ZERO APERTO) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-line dark:border-slate-800 grid grid-cols-5 px-1.5 pt-1 pb-[calc(0.35rem+env(safe-area-inset-bottom))] z-30 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]">
        {mobilePrimaryTabs.map((item) => {
          const isActive = location.pathname === item.path && !mobileMenuOpen;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              style={isActive ? { color: themeColor || '#2457f5' } : {}}
              className={`flex flex-col items-center justify-center min-h-[50px] rounded-xl transition-colors ${
                isActive
                  ? 'font-bold'
                  : 'text-ink-muted dark:text-slate-500 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] mt-0.5 leading-tight truncate max-w-full px-1">
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* 5º Item: Menu Mais (Abre Gaveta Inferior com Canais, Perfil, Planos, Instalar e Suporte) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          style={mobileMenuOpen || isSecondaryRouteActive ? { color: themeColor || '#2457f5' } : {}}
          className={`flex flex-col items-center justify-center min-h-[50px] rounded-xl transition-colors cursor-pointer ${
            mobileMenuOpen || isSecondaryRouteActive
              ? 'font-bold'
              : 'text-ink-muted dark:text-slate-500 font-medium'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[11px] mt-0.5 leading-tight">Menu</span>
        </button>
      </nav>
    </div>
  );
}
