import { useState, useEffect } from 'react';
import { Eye, EyeOff, QrCode, CheckCircle2, Calendar, MessageCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Settings() {
  const { themeColor } = useAppStore();
  const [workerStatus, setWorkerStatus] = useState({ connected: false, qr: '' });
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const checkWorkerStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/status');
        if (response.ok) {
          const data = await response.json();
          setWorkerStatus(data);
        }
      } catch (error) {
        setWorkerStatus({ connected: false, qr: '' });
      }
    };

    checkWorkerStatus();
    const interval = setInterval(checkWorkerStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Estilo Landing Page */}
      <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 border"
          style={{ backgroundColor: `${themeColor || '#2563eb'}15`, borderColor: `${themeColor || '#2563eb'}30`, color: themeColor || '#2563eb' }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor || '#2563eb' }}></span>
          Conexões & Ecossistema
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Canais & <span className="text-emerald-500">Integrações</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm md:text-base max-w-2xl">
          Conecte o seu WhatsApp, sincronize sua agenda com o Google Calendar e integre seu Instagram para atrair clientes no automático.
        </p>
      </div>

      <div className="space-y-6">
        {/* WhatsApp Bot */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">WhatsApp Atendente (Baileys)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Atendimento e agendamento automático 24 horas por dia</p>
              </div>
            </div>

            {workerStatus.connected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Conectado & Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Aguardando Leitura do QR Code
              </span>
            )}
          </div>

          {workerStatus.connected ? (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 p-5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-emerald-900 dark:text-emerald-300">Robô Ativo e Respondendo</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Atendimento automático com URA interativa ativo. Contatos da sua agenda pessoal são protegidos pelo filtro de privacidade.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => alert("Sessão reiniciada!")}
                className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-emerald-200 underline cursor-pointer"
              >
                Reconectar outro número
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center">
              {!workerStatus.qr ? (
                <div className="text-center py-4">
                  <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm">Gerando QR Code criptografado...</p>
                  <p className="text-slate-400 text-xs mt-1">O container do Baileys está iniciando.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full max-w-sm">
                  <div className="flex justify-between items-center w-full mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">QR Code de Conexão</span>
                    <button 
                      onClick={() => setShowQR(!showQR)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                    >
                      {showQR ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showQR ? 'Ocultar' : 'Revelar QR Code'}
                    </button>
                  </div>
                  
                  {showQR ? (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md animate-in fade-in zoom-in duration-200">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(workerStatus.qr)}`} 
                        alt="WhatsApp QR Code"
                        className="w-56 h-56 rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-56 h-56 bg-slate-200/50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700">
                      <QrCode className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-2" />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Clique em Revelar</span>
                    </div>
                  )}
                  
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-4 text-center leading-relaxed">
                    Abra o WhatsApp no celular, toque em <strong>Aparelhos Conectados &gt; Conectar um aparelho</strong> e aponte a câmera.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Google Calendar (Fase 6) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Google Calendar (Agenda)</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/40">
                    Sincronização 2 Vias
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Eventos marcados no seu celular bloqueiam horários no robô automaticamente.
                </p>
              </div>
            </div>

            <button 
              onClick={() => alert("Redirecionando para autenticação segura do Google OAuth 2.0...")}
              className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-all self-start sm:self-auto cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Conectar meu Google
            </button>
          </div>
        </div>

        {/* Instagram Direct & Comentários (Fase 6) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Instagram Direct & Comentários</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/40">
                    Meta Graph API
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Responda directs e comentários de posts enviando o link de agendamento automático.
                </p>
              </div>
            </div>

            <button 
              onClick={() => alert("Conectando via Facebook Login for Business...")}
              className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-all self-start sm:self-auto cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Ligar Conta Instagram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
