import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarClock, Bot, Megaphone, SlidersHorizontal, MessageCircle, Sparkles, Crown } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Serviços', path: '/services', icon: CalendarClock },
    { name: 'Meu Robô', path: '/bot', icon: Bot },
    { name: 'Marketing', path: '/marketing', icon: Megaphone },
    { name: 'Integrações', path: '/settings', icon: SlidersHorizontal },
    { name: 'Planos & Pro', path: '/pricing', icon: Crown },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            {/* Logo Icon com nós/conexões em gradiente igual a Landing Page */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="2.5"/>
                <circle cx="6" cy="12" r="2.5"/>
                <circle cx="18" cy="19" r="2.5"/>
                <line x1="8.2" y1="13.2" x2="15.8" y2="17.8"/>
                <line x1="8.2" y1="10.8" x2="15.8" y2="6.2"/>
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">Lypsyos</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Salão & Manicure</span>
            </div>
          </Link>
        </div>

        {/* Tenant Status Pill */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between bg-blue-50/70 border border-blue-100/80 rounded-xl px-3 py-2 text-xs">
            <span className="font-semibold text-blue-900 truncate">Lypsyos Demo</span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-3 space-y-1.5">
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

        {/* Footer Support Card */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-3.5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-100">Dica Lypsyos</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Mantenha os horários atualizados para o robô nunca marcar em horários indisponíveis.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden p-4 bg-white border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/>
                <line x1="8.2" y1="13.2" x2="15.8" y2="17.8"/><line x1="8.2" y1="10.8" x2="15.8" y2="6.2"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-900">Lypsyos</h1>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full">
            ● Bot Ativo
          </span>
        </header>

        {/* Scrollable View */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto pb-16 md:pb-8">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Floating WhatsApp Action (Exactly like in the Landing Page) */}
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

