import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Settings, Briefcase, Bot, Megaphone } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Serviços', path: '/services', icon: Briefcase },
    { name: 'Meu Robô', path: '/bot', icon: Bot },
    { name: 'Marketing', path: '/marketing', icon: Megaphone },
    { name: 'Integrações', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">Lypsyos</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-xl font-medium transition-colors ${
                location.pathname === item.path 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <header className="md:hidden p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-indigo-600">Lypsyos</h1>
        </header>
        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-2 z-10 pb-safe">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center p-2 rounded-lg ${
              location.pathname === item.path ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

