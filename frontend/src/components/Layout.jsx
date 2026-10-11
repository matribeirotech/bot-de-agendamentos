import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, CalendarClock, Bot, Megaphone, SlidersHorizontal, 
  MessageCircle, Sparkles, Crown, Store, ArrowRight, Zap, CheckCircle2,
  UserCheck, LogOut 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SEGMENTS } from '../lib/segmentSeeds';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { businessName, responsibleName, segment, subscription, avatarUrl, logout } = useAppStore();

  const segmentObj = SEGMENTS.find(s => s.id === segment) || SEGMENTS[0];

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

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        
        {/* TOPO: DESTAQUE TOTAL PARA A MARCA DO ESTABELECIMENTO DO USUÁRIO */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl shrink-0 shadow-xs">
              {segmentObj?.icon || '🏪'}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight truncate" title={businessName || 'Meu Estabelecimento'}>
                {businessName || 'Meu Estabelecimento'}
              </h2>
              <span className="text-[11px] font-semibold text-slate-400 block truncate">
                {segmentObj?.title ? segmentObj.title.split('&')[0] : 'Geral'}
              </span>
            </div>
          </div>

          {/* Status do Robô no Estabelecimento */}
          <div className="mt-3.5 flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-600">Robô WhatsApp</span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Ativo 24h
            </span>
          </div>
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/25' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* CARD DE TRIAL / UPSELL NA SIDEBAR */}
        {isTrialOrFree && (
          <div className="p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-3.5 rounded-2xl shadow-md border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Teste Pro
                </span>
                <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  {safeSubscription?.daysRemaining || 30} dias
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug mb-2.5">
                Acesso total liberado sem limites.
              </p>
              <Link 
                to="/pricing"
                className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                <span>Garantir Pro</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* PERFIL DO USUÁRIO & BOTÃO SAIR */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <Link to="/profile" className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200/80 shadow-2xs">
                {responsibleName ? responsibleName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate">{responsibleName || 'Minha Conta'}</p>
              <span className="text-[10px] text-slate-400 block truncate">Editar Perfil</span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title="Sair da Conta (Logout)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* RODAPÉ MINIMALISTA: ASSINATURA DISCRETA "POWERED BY LYPSYOS" */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[10px]">Tecnologia</span>
          <div className="flex items-center gap-1.5 font-bold text-slate-600">
            {/* Ícone Minimalista */}
            <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-[8px] font-black">
              L
            </div>
            <span className="text-[10px] tracking-tight">Powered by Lypsyos</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* BANNER GLOBAL DE RETENÇÃO / UPSELL NO TOPO */}
        {isTrialOrFree && (
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-sm z-20">
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
              className="inline-flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 font-bold px-3 py-1 rounded-lg text-xs transition-colors shrink-0 shadow-2xs"
            >
              <span>Seja Pro</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Mobile Header com foco no estabelecimento */}
        <header className="md:hidden p-4 bg-white border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="text-xl">{segmentObj?.icon || '🏪'}</span>
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-slate-900 truncate">{businessName || 'Meu Estabelecimento'}</h1>
              <span className="text-[10px] text-slate-400 block">Powered by Lypsyos</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/profile" className="rounded-full border border-slate-200 overflow-hidden shadow-2xs">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {responsibleName ? responsibleName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
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

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around p-2 z-30 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-400'
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
