import { useState, useEffect } from 'react';
import { 
  Eye, EyeOff, QrCode, CheckCircle2, Calendar, MessageCircle, 
  ExternalLink, ShieldCheck, Bell, Clock, Smartphone, Download, Sparkles, Check
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  requestPushPermission, 
  sendTestNotification, 
  getNotificationPermission, 
  isPushSupported 
} from '../lib/pushNotifications';

export default function Settings() {
  const { themeColor, responsibleName } = useAppStore();
  const [workerStatus, setWorkerStatus] = useState({ connected: false, qr: '' });
  const [showQR, setShowQR] = useState(false);

  // Estados de Notificações Push & PWA
  const [pushSettings, setPushSettings] = useState(getNotificationSettings());
  const [permissionStatus, setPermissionStatus] = useState(getNotificationPermission());
  const [testStatus, setTestStatus] = useState({ type: '', text: '' });
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  // Monitora evento de instalação PWA (beforeinstallprompt)
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

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

  // Alternar Notificações Push
  const handleTogglePush = async () => {
    const nextEnabled = !pushSettings.enabled;
    if (nextEnabled) {
      try {
        const perm = await requestPushPermission();
        setPermissionStatus(perm);
        if (perm === 'granted') {
          const updated = saveNotificationSettings({ enabled: true });
          setPushSettings(updated);
          setTestStatus({ type: 'success', text: 'Notificações push ativadas com sucesso neste aparelho!' });
        } else {
          setTestStatus({ type: 'error', text: 'Permissão para notificações não foi autorizada no aparelho.' });
        }
      } catch (err) {
        setTestStatus({ type: 'error', text: err.message || 'Falha ao solicitar permissões de notificação.' });
      }
    } else {
      const updated = saveNotificationSettings({ enabled: false });
      setPushSettings(updated);
      setTestStatus({ type: 'info', text: 'Alertas push diários desativados.' });
    }
    setTimeout(() => setTestStatus({ type: '', text: '' }), 4000);
  };

  // Alterar Horário Matinal
  const handleMorningTimeChange = (e) => {
    const newTime = e.target.value;
    const updated = saveNotificationSettings({ morningTime: newTime });
    setPushSettings(updated);
  };

  // Alternar Notificação de Novos Agendamentos
  const handleToggleNewAppointmentPush = () => {
    const updated = saveNotificationSettings({ notifyOnNewAppointment: !pushSettings.notifyOnNewAppointment });
    setPushSettings(updated);
  };

  // Alternar Resumo Diário
  const handleToggleDailySummary = () => {
    const updated = saveNotificationSettings({ dailySummary: !pushSettings.dailySummary });
    setPushSettings(updated);
  };

  // Alternar Google Calendar Sync
  const handleToggleGoogleCalendarSync = () => {
    const updated = saveNotificationSettings({ googleCalendarSync: !pushSettings.googleCalendarSync });
    setPushSettings(updated);
  };

  // Disparar Teste de Notificação
  const handleTestPush = async () => {
    setIsTestingPush(true);
    setTestStatus({ type: '', text: '' });
    try {
      await sendTestNotification(responsibleName || 'Profissional');
      setTestStatus({ type: 'success', text: '🔔 Notificação enviada! Verifique a barra de avisos do seu aparelho.' });
    } catch (err) {
      setTestStatus({ type: 'error', text: err.message || 'Erro ao disparar teste de notificação.' });
    } finally {
      setIsTestingPush(false);
      setTimeout(() => setTestStatus({ type: '', text: '' }), 5000);
    }
  };

  // Instalar PWA no Aparelho
  const handleInstallPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      setShowInstallHelp(!showInstallHelp);
    }
  };

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

        {/* ========================================================================= */}
        {/* NOVO: APLICATIVO MOBILE (PWA INSTALÁVEL NO CELULAR)                      */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
                style={{ 
                  backgroundColor: `${themeColor || '#2563eb'}15`,
                  borderColor: `${themeColor || '#2563eb'}30`,
                  color: themeColor || '#2563eb' 
                }}
              >
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Aplicativo Móvel Instalável (PWA)</h3>
                  {isInstalled ? (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-3 h-3" /> Instalado no Aparelho
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Pronto para Instalação
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Acesse o Lypsyos como um app nativo no celular: sem barra de navegador, tela cheia e ícone na tela inicial.
                </p>
              </div>
            </div>

            <button
              onClick={handleInstallPWA}
              style={{ backgroundColor: themeColor || '#2563eb' }}
              className="inline-flex items-center gap-2 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all self-start sm:self-auto cursor-pointer hover:opacity-90 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalled ? "Aplicativo Instalado" : "Instalar no Celular"}</span>
            </button>
          </div>

          {/* Guia de instalação manual para iOS e navegadores sem suporte direto */}
          {showInstallHelp && (
            <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs space-y-3 animate-in fade-in">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Como instalar no seu celular:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-white mb-1">📱 No iPhone (Safari):</p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px]">
                    <li>Toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima).</li>
                    <li>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</li>
                    <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
                  </ol>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-white mb-1">🤖 No Android (Chrome):</p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px]">
                    <li>Toque nos <strong>3 pontinhos</strong> no canto superior direito.</li>
                    <li>Selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
                    <li>Confirme a instalação.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* NOVO: NOTIFICAÇÕES PROATIVAS PUSH & RESUMO MATINAL                       */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Notificações Push Proativas</h3>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    pushSettings.enabled 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {pushSettings.enabled ? 'Ativo no Aparelho' : 'Desativado'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Receba avisos na tela de bloqueio com o resumo da agenda do dia e alertas de novos clientes no WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestPush}
                disabled={isTestingPush}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer disabled:opacity-50"
              >
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>{isTestingPush ? 'Enviando...' : 'Testar Notificação'}</span>
              </button>

              <button
                type="button"
                onClick={handleTogglePush}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  pushSettings.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    pushSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Feedback de Teste / Permissão */}
          {testStatus.text && (
            <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
              testStatus.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              <span>{testStatus.text}</span>
            </div>
          )}

          {/* Configuração de Horário Matinal & Preferências */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Horário do Resumo Matinal
                </label>
                <input
                  type="time"
                  value={pushSettings.morningTime || '08:00'}
                  onChange={handleMorningTimeChange}
                  className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Neste horário, o Lypsyos enviará um push com a quantidade de clientes e a lista de atendimentos do dia.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  Novos Agendamentos no WhatsApp
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Receba um push imediato sempre que o robô fechar um horário.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleNewAppointmentPush}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  pushSettings.notifyOnNewAppointment ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    pushSettings.notifyOnNewAppointment ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
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
                  Eventos marcados no seu celular disparam os lembretes nativos do Google Agenda (notificação com som 15 min antes).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleGoogleCalendarSync}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  pushSettings.googleCalendarSync ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    pushSettings.googleCalendarSync ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>

              <button 
                onClick={() => alert("Redirecionando para autenticação segura do Google OAuth 2.0...")}
                className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Conectar meu Google
              </button>
            </div>
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
