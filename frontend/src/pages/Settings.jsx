import { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  QrCode,
  CheckCircle2,
  Calendar,
  MessageCircle,
  ExternalLink,
  Bell,
  Clock,
  Smartphone,
  Download,
  Sparkles,
  Check,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestPushPermission,
  sendTestNotification,
} from '../lib/pushNotifications';
import { LypsyosIconBadge } from '../components/ui/LypsyosIconBadge';

export default function Settings() {
  const { themeColor, responsibleName, businessName } = useAppStore();
  const [workerStatus, setWorkerStatus] = useState({ connected: false, qr: '' });
  const [showQR, setShowQR] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Avisos e instalação no celular
  const [pushSettings, setPushSettings] = useState(getNotificationSettings());
  const [toast, setToast] = useState({ type: '', text: '' });
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  const showFeedback = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4500);
  };

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
      } catch {
        setWorkerStatus({ connected: false, qr: '' });
      }
    };

    checkWorkerStatus();
    const interval = setInterval(checkWorkerStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleReconnectWhatsApp = async () => {
    setIsReconnecting(true);
    try {
      const res = await fetch('http://localhost:3001/reconnect', { method: 'POST' });
      if (res.ok) {
        setWorkerStatus({ connected: false, qr: '' });
        setShowQR(true);
        showFeedback('success', 'Gerando um novo QR Code para conectar outro WhatsApp...');
      } else {
        showFeedback('error', 'Não foi possível desconectar no momento. Tente novamente.');
      }
    } catch {
      showFeedback('error', 'Serviço do WhatsApp indisponível no momento.');
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleToggleNotifications = async () => {
    const nextEnabled = !pushSettings.enabled;
    if (nextEnabled) {
      try {
        const perm = await requestPushPermission();
        if (perm === 'granted') {
          const updated = saveNotificationSettings({ enabled: true });
          setPushSettings(updated);
          showFeedback('success', 'Avisos ativados com sucesso neste aparelho!');
        } else {
          showFeedback('error', 'Autorize os avisos nas configurações do seu navegador.');
        }
      } catch (err) {
        showFeedback('error', err.message || 'Não foi possível ativar os avisos neste aparelho.');
      }
    } else {
      const updated = saveNotificationSettings({ enabled: false });
      setPushSettings(updated);
      showFeedback('info', 'Avisos diários desativados.');
    }
  };

  const handleMorningTimeChange = (e) => {
    const updated = saveNotificationSettings({ morningTime: e.target.value });
    setPushSettings(updated);
  };

  const handleToggleNewAppointmentAlert = () => {
    const updated = saveNotificationSettings({
      notifyOnNewAppointment: !pushSettings.notifyOnNewAppointment,
    });
    setPushSettings(updated);
  };

  const handleToggleGoogleCalendarSync = () => {
    const nextVal = !pushSettings.googleCalendarSync;
    const updated = saveNotificationSettings({ googleCalendarSync: nextVal });
    setPushSettings(updated);
    showFeedback(
      'success',
      nextVal
        ? 'Lembretes com a Agenda Google ativados!'
        : 'Sincronização com a Agenda Google pausada.'
    );
  };

  const handleTestNotification = async () => {
    setIsTestingPush(true);
    try {
      await sendTestNotification(responsibleName || 'Profissional');
      showFeedback('success', 'Aviso enviado! Confira o topo da tela do seu aparelho.');
    } catch (err) {
      showFeedback('error', err.message || 'Ative os avisos primeiro para receber o teste.');
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      setShowInstallHelp((v) => !v);
    }
  };

  const activeColor = themeColor || '#2457f5';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8 min-w-0">
      {/* Toast Mobile-Safe */}
      {toast.text && (
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:top-auto sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl text-white text-xs sm:text-sm font-semibold animate-in fade-in ${
            toast.type === 'error'
              ? 'bg-rose-600'
              : toast.type === 'info'
              ? 'bg-brand'
              : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          )}
          <span className="flex-1">{toast.text}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="pb-3 border-b border-line dark:border-slate-800">
        <div className="flex items-center gap-3">
          <LypsyosIconBadge icon={MessageCircle} tone="growth" size="md" />
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink dark:text-white tracking-tight">
              WhatsApp & <span className="text-growth">Avisos</span>
            </h1>
            <p className="text-ink-soft dark:text-slate-400 text-xs sm:text-sm mt-0.5">
              Conecte o WhatsApp do seu espaço e configure lembretes no celular.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* 1. CONEXÃO DO WHATSAPP */}
        <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 sm:p-6 shadow-soft space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="size-11 rounded-2xl bg-growth-soft dark:bg-emerald-950/50 text-growth-text dark:text-emerald-400 border border-growth/25 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-base sm:text-lg text-ink dark:text-white">
                  Conexão do WhatsApp
                </h3>
                <p className="text-xs text-ink-soft dark:text-slate-400">
                  Atendimento automático para suas clientes 24 horas
                </p>
              </div>
            </div>

            {workerStatus.connected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-growth-soft dark:bg-emerald-950/50 text-growth-text dark:text-emerald-300 border border-growth/30">
                <span className="w-2 h-2 rounded-full bg-growth animate-pulse" />
                Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Aguardando leitura do QR Code
              </span>
            )}
          </div>

          {workerStatus.connected ? (
            <div className="bg-growth-soft/60 dark:bg-emerald-950/25 border border-growth/25 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="size-10 bg-growth text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                    WhatsApp conectado e respondendo clientes!
                  </p>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-0.5 leading-relaxed">
                    Seu robô já está atendendo novos contatos e anotando horários automaticamente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReconnectWhatsApp}
                disabled={isReconnecting}
                className="min-h-10 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 transition-colors shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
                <span>{isReconnecting ? 'Trocando...' : 'Trocar número'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-canvas dark:bg-slate-800/50 p-5 sm:p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center">
              {!workerStatus.qr ? (
                <div className="text-center py-4 space-y-2">
                  <div className="w-9 h-9 border-4 border-brand/30 border-t-brand rounded-full animate-spin mx-auto" />
                  <p className="text-ink dark:text-slate-200 font-bold text-sm">
                    Preparando o seu QR Code...
                  </p>
                  <p className="text-ink-muted dark:text-slate-400 text-xs max-w-xs mx-auto">
                    Aguarde alguns segundos para apontar a câmera do seu WhatsApp.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full max-w-sm">
                  <div className="flex justify-between items-center w-full mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300">
                      Leia com o seu WhatsApp
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowQR(!showQR)}
                      className="min-h-9 inline-flex items-center gap-1.5 text-xs font-bold text-brand dark:text-blue-400 bg-brand-soft dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-brand/20 cursor-pointer"
                    >
                      {showQR ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showQR ? 'Ocultar' : 'Mostrar QR'}</span>
                    </button>
                  </div>

                  {showQR ? (
                    <div className="bg-white p-3.5 rounded-2xl border border-line shadow-md">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                          workerStatus.qr
                        )}`}
                        alt="QR Code do WhatsApp"
                        className="w-52 h-52 sm:w-56 sm:h-56 rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-52 h-52 bg-slate-200/50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center border border-line dark:border-slate-700">
                      <QrCode className="w-10 h-10 text-slate-400 mb-2" />
                      <span className="text-xs text-ink-soft dark:text-slate-400 font-semibold">
                        Toque em Mostrar QR
                      </span>
                    </div>
                  )}

                  <p className="text-ink-soft dark:text-slate-400 text-xs mt-4 text-center leading-relaxed">
                    No seu celular, abra o <strong>WhatsApp</strong>, toque em{' '}
                    <strong>Aparelhos conectados &gt; Conectar aparelho</strong> e aponte para a imagem acima.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. INSTALAR NA TELA INICIAL DO CELULAR */}
        <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 sm:p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className="size-11 rounded-2xl flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${activeColor}15`,
                  borderColor: `${activeColor}30`,
                  color: activeColor,
                }}
              >
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-heading font-bold text-base text-ink dark:text-white">
                    Atalho na Tela Inicial do Celular
                  </h3>
                  {isInstalled && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-growth-soft text-growth-text border border-growth/25">
                      <Check className="w-3 h-3" /> Instalado
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5 leading-relaxed">
                  Abra o Zenda em tela cheia direto do ícone no seu celular, sem precisar abrir o navegador.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleInstallApp}
              style={{ backgroundColor: activeColor }}
              className="w-full sm:w-auto min-h-11 inline-flex items-center justify-center gap-2 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer hover:opacity-95 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalled ? 'Já Instalado' : 'Instalar no Celular'}</span>
            </button>
          </div>

          {showInstallHelp && (
            <div className="mt-4 p-4 rounded-2xl bg-canvas dark:bg-slate-800/60 border border-line dark:border-slate-700 text-xs space-y-3 animate-in fade-in">
              <h4 className="font-bold text-ink dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Passo a passo rápido:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-ink-soft dark:text-slate-300">
                <div className="p-3 bg-surface dark:bg-slate-800 rounded-xl border border-line dark:border-slate-700">
                  <p className="font-bold text-ink dark:text-white mb-1">📱 No iPhone (Safari):</p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px]">
                    <li>Toque em <strong>Compartilhar</strong> na barra inferior.</li>
                    <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
                    <li>Confirme em <strong>Adicionar</strong>.</li>
                  </ol>
                </div>
                <div className="p-3 bg-surface dark:bg-slate-800 rounded-xl border border-line dark:border-slate-700">
                  <p className="font-bold text-ink dark:text-white mb-1">🤖 No Android (Chrome):</p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px]">
                    <li>Toque nos <strong>3 pontinhos</strong> no canto superior.</li>
                    <li>Toque em <strong>Instalar aplicativo</strong>.</li>
                    <li>Confirme para criar o atalho.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. AVISOS NO CELULAR E RESUMO DA MANHÃ */}
        <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 sm:p-6 shadow-soft space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line/70 dark:border-slate-800">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="size-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-heading font-bold text-base text-ink dark:text-white">
                    Avisos de Agenda no Aparelho
                  </h3>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      pushSettings.enabled
                        ? 'bg-growth-soft text-growth-text border-growth/25'
                        : 'bg-canvas dark:bg-slate-800 text-ink-muted border-line dark:border-slate-700'
                    }`}
                  >
                    {pushSettings.enabled ? 'Ativado' : 'Desativado'}
                  </span>
                </div>
                <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                  Receba o resumo dos seus horários pela manhã e avisos de novos agendamentos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={handleTestNotification}
                disabled={isTestingPush}
                className="min-h-10 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-line dark:border-slate-700 hover:bg-canvas dark:hover:bg-slate-800 text-ink dark:text-slate-200 cursor-pointer disabled:opacity-50"
              >
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>{isTestingPush ? 'Enviando...' : 'Testar aviso'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleNotifications}
                aria-label="Ativar avisos no celular"
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  pushSettings.enabled ? 'bg-growth' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                    pushSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-line/70 dark:border-slate-800 bg-canvas/60 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-ink dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand dark:text-blue-400" />
                  Resumo da manhã
                </label>
                <input
                  type="time"
                  value={pushSettings.morningTime || '08:00'}
                  onChange={handleMorningTimeChange}
                  className="min-h-9 px-2.5 py-1 text-sm font-bold bg-surface dark:bg-slate-900 border border-line dark:border-slate-700 rounded-xl text-ink dark:text-white"
                />
              </div>
              <p className="text-[11px] text-ink-soft dark:text-slate-400 leading-relaxed">
                Horário em que mostramos quantos clientes você vai atender no dia.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-line/70 dark:border-slate-800 bg-canvas/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-ink dark:text-white">
                  Novos clientes pelo WhatsApp
                </p>
                <p className="text-[11px] text-ink-soft dark:text-slate-400 mt-0.5">
                  Avisar sempre que o robô marcar um novo horário.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleNewAppointmentAlert}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  pushSettings.notifyOnNewAppointment
                    ? 'bg-brand'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                    pushSettings.notifyOnNewAppointment ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 4. GOOGLE AGENDA & INSTAGRAM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 shadow-soft flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-2xl bg-brand-soft dark:bg-blue-950/50 text-brand dark:text-blue-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-ink dark:text-white">
                  Google Agenda
                </h3>
                <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5 leading-relaxed">
                  Receba lembretes da agenda do seu celular 15 minutos antes de cada cliente.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-line/60 dark:border-slate-800">
              <button
                type="button"
                onClick={handleToggleGoogleCalendarSync}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  pushSettings.googleCalendarSync
                    ? 'bg-brand'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                    pushSettings.googleCalendarSync ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  showFeedback(
                    'info',
                    'Vincule sua conta Google nas permissões de calendário para sincronizar seus horários.'
                  )
                }
                className="min-h-10 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line dark:border-slate-700 text-xs font-bold text-ink dark:text-slate-200 hover:bg-canvas dark:hover:bg-slate-800 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-brand" />
                <span>Vincular Google</span>
              </button>
            </div>
          </div>

          <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 shadow-soft flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="size-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-ink dark:text-white">
                  Link na Bio do Instagram
                </h3>
                <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5 leading-relaxed">
                  Direcione seguidores do Instagram direto para agendar no seu WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-line/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() =>
                  showFeedback(
                    'success',
                    'Dica: Copie seu Link de Agendamento na aba Agenda e cole na Bio do seu Instagram!'
                  )
                }
                className="min-h-10 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line dark:border-slate-700 text-xs font-bold text-ink dark:text-slate-200 hover:bg-canvas dark:hover:bg-slate-800 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                <span>Como colocar na Bio</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. SUPORTE DIRETO PELO WHATSAPP */}
        <div className="bg-canvas dark:bg-slate-900/60 rounded-3xl border border-line dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-surface dark:bg-slate-800 border border-line dark:border-slate-700 flex items-center justify-center text-brand shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-ink dark:text-white">
                Precisa de ajuda para conectar?
              </h4>
              <p className="text-xs text-ink-soft dark:text-slate-400">
                Nossa equipe te auxilia passo a passo pelo WhatsApp.
              </p>
            </div>
          </div>

          <a
            href={`https://wa.me/5511999999999?text=${encodeURIComponent(
              `Olá! Preciso de ajuda para configurar o Zenda no meu espaço (${
                businessName || 'Meu Estabelecimento'
              }).`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-white text-xs font-bold shadow-xs shrink-0"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Falar com Suporte</span>
          </a>
        </div>
      </div>
    </div>
  );
}
