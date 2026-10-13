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
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        
        {/* TOPO: DESTAQUE TOTAL PARA A MARCA DO ESTABELECIMENTO DO USUÁRIO */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs transition-colors"
              style={{ backgroundColor: `${themeColor || '#2563eb'}18`, color: themeColor || '#2563eb' }}
            >
              {segmentObj?.icon || '🏪'}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate" title={businessName || 'Meu Estabelecimento'}>
                {businessName || 'Meu Estabelecimento'}
              </h2>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block truncate">
                {segmentObj?.title ? segmentObj.title.split('&')[0] : 'Geral'}
              </span>
            </div>
          </div>

          {/* Status do Robô no Estabelecimento & Alternador de Tema */}
          <div className="mt-3.5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Robô WhatsApp</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Ativo
              </span>
            </div>

            {/* Botão Rápido de Tema */}
            <button
              onClick={toggleQuickTheme}
              title={`Tema atual: ${themeMode === 'dark' ? 'Modo Escuro' : themeMode === 'custom' ? 'Modo Personalizado' : 'Modo Claro'}. Clique para alternar.`}
              className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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

          {/* Botão de Instalação PWA no Desktop */}
          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              className="mt-2.5 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all group cursor-pointer shadow-2xs"
              title="Instalar Lypsyos como Aplicativo"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px]"
                  style={{ backgroundColor: themeColor || '#2563eb' }}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="block leading-tight text-[11px] font-bold">Instalar App</span>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none">Acesso em 1 clique</span>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
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
                style={isActive ? { backgroundColor: themeColor || '#2563eb' } : {}}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'text-white font-semibold shadow-sm shadow-blue-500/25' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* CARD DE TRIAL / UPSELL NA SIDEBAR */}
        {isTrialOrFree && (
          <div className="p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-800 dark:to-slate-900 text-white p-3.5 rounded-2xl shadow-md border border-slate-800 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Teste Pro
                </span>
                <span className="text-[10px] font-bold bg-slate-800 dark:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                  {safeSubscription?.daysRemaining || 30} dias
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug mb-2.5">
                Acesso total liberado sem limites.
              </p>
              <Link 
                to="/pricing"
                style={{ backgroundColor: themeColor || '#2563eb' }}
                className="w-full flex items-center justify-center gap-1.5 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm hover:opacity-90"
              >
                <span>Garantir Pro</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* PERFIL DO USUÁRIO & BOTÃO SAIR */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <Link to="/profile" className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border shadow-2xs"
                style={{ 
                  backgroundColor: `${themeColor || '#2563eb'}20`, 
                  borderColor: `${themeColor || '#2563eb'}40`,
                  color: themeColor || '#2563eb'
                }}
              >
                {responsibleName ? responsibleName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{responsibleName || 'Minha Conta'}</p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">Editar Perfil</span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title="Sair da Conta (Logout)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* RODAPÉ MINIMALISTA: ASSINATURA DISCRETA "POWERED BY LYPSYOS" */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span className="text-[10px]">Tecnologia</span>
          <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400">
            <div 
              className="w-3.5 h-3.5 rounded-md flex items-center justify-center text-white text-[8px] font-black"
              style={{ backgroundColor: themeColor || '#2563eb' }}
            >
              L
            </div>
            <span className="text-[10px] tracking-tight">Powered by Lypsyos</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc] dark:bg-slate-950">
        {/* BANNER GLOBAL DE RETENÇÃO / UPSELL NO TOPO */}
        {isTrialOrFree && (
          <div 
            style={{ 
              background: `linear-gradient(90deg, ${themeColor || '#2563eb'} 0%, #4f46e5 100%)` 
            }}
            className="text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-sm z-20"
          >
            <div className="flex items-center gap-2 max-w-3xl truncate">
              <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0">
                ⭐ Teste Pro Ativo
              </span>
              <span className="truncate">
                Você tem <strong>{safeSubscription?.daysRemaining || 30} dias grátis</strong> restantes com agendamento ilimitado e sem marcas d'água.
              </span>
            </div>

            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 bg-white text-slate-900 hover:bg-slate-100 font-bold px-3 py-1 rounded-lg text-xs transition-colors shrink-0 shadow-2xs"
            >
              <span>Seja Pro</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Mobile Header com foco no estabelecimento */}
        <header className="md:hidden p-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="text-xl">{segmentObj?.icon || '🏪'}</span>
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">{businessName || 'Meu Estabelecimento'}</h1>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Powered by Lypsyos</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                style={{ backgroundColor: themeColor || '#2563eb' }}
                title="Instalar App no celular"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px]">Instalar</span>
              </button>
            )}
            <button
              onClick={toggleQuickTheme}
              title="Alternar Tema"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {themeMode === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
            <Link to="/profile" className="rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: `${themeColor || '#2563eb'}20`, color: themeColor || '#2563eb' }}
                >
                  {responsibleName ? responsibleName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* View com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto pb-16 md:pb-8">
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
        className="fixed bottom-20 md:bottom-6 right-6 w-13 h-13 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all z-40"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
      </a>

      {/* Banner Flutuante de Instalação Mobile (PWA 1-Toque) */}
      {!isStandalone && !dismissInstallBanner && (
        <aside 
          aria-label="Instalação do Aplicativo"
          className="fixed bottom-18 left-3 right-3 md:hidden z-35"
        >
          <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm font-black text-xs"
                style={{ backgroundColor: themeColor || '#2563eb' }}
              >
                L
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white leading-tight truncate">
                  Instalar App no Celular
                </p>
                <p className="text-[10px] text-slate-300 leading-tight truncate">
                  Acesso rápido direto da sua tela inicial
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                style={{ backgroundColor: themeColor || '#2563eb' }}
                className="px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>
              <button
                onClick={handleDismissBanner}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm"
                  style={{ backgroundColor: themeColor || '#2563eb' }}
                >
                  L
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Instalar no iPhone / iPad</h3>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">3 passos rápidos no Safari</span>
                </div>
              </div>
              <button
                onClick={() => setShowIosInstallModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                  Toque no botão <strong className="text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 mx-1"><Share className="w-3.5 h-3.5 inline" /> Compartilhar</strong> na barra inferior do Safari.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                  Role o menu e selecione <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1 mx-1"><PlusSquare className="w-3.5 h-3.5 inline" /> Adicionar à Tela de Início</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                  Toque em <strong className="text-blue-600 dark:text-blue-400">"Adicionar"</strong> no canto superior direito para finalizar.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosInstallModal(false)}
              style={{ backgroundColor: themeColor || '#2563eb' }}
              className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-90 transition-opacity cursor-pointer text-center"
            >
              Entendi, pronto!
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around p-2 z-30 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              style={isActive ? { color: themeColor || '#2563eb' } : {}}
              className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                isActive ? 'font-semibold' : 'text-slate-400 dark:text-slate-500'
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
