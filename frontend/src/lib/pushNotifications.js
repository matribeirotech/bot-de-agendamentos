// ==============================================================================
// LYPSYOS SAAS - SERVIÇO DE NOTIFICAÇÕES PUSH & LEMBRETES PROATIVOS
// ==============================================================================

const SETTINGS_KEY = 'lypsyos_push_settings';

export const defaultNotificationSettings = {
  enabled: false,
  morningTime: '08:00',
  notifyOnNewAppointment: true,
  dailySummary: true,
  googleCalendarSync: true,
};

// 1. Verifica se o navegador suporta Service Workers e Notificações Push
export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
}

// 2. Obtém permissão atual do navegador ('default', 'granted', 'denied')
export function getNotificationPermission() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

// 3. Solicita permissão ao usuário
export async function requestPushPermission() {
  if (!isPushSupported()) {
    throw new Error('Notificações não são suportadas neste navegador/dispositivo.');
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    await registerServiceWorker();
  }
  return permission;
}

// 4. Registra o Service Worker
export async function registerServiceWorker() {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('Falha ao registrar Service Worker:', error);
    return null;
  }
}

// 5. Salva e recupera as configurações de notificação
export function getNotificationSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultNotificationSettings, ...JSON.parse(stored) };
    }
  } catch (e) {}
  return defaultNotificationSettings;
}

export function saveNotificationSettings(settings) {
  try {
    const current = getNotificationSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Erro ao salvar preferências de push:', e);
    return defaultNotificationSettings;
  }
}

// 6. Dispara notificação de teste imediata
export async function sendTestNotification(userName = 'Profissional') {
  if (!isPushSupported()) {
    throw new Error('Notificações não são suportadas no seu navegador.');
  }

  if (Notification.permission !== 'granted') {
    const perm = await requestPushPermission();
    if (perm !== 'granted') {
      throw new Error('Permissão para notificações não foi autorizada no aparelho.');
    }
  }

  const registration = await registerServiceWorker();
  const title = `☀️ Bom dia, ${userName}!`;
  const body = 'Seu robô está ativo e você tem novos agendamentos programados para hoje. Toque para ver!';

  if (registration && registration.showNotification) {
    await registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: '/' },
      vibrate: [200, 100, 200],
    });
  } else {
    new Notification(title, { body, icon: '/favicon.svg' });
  }

  return true;
}

// 7. Agenda o Lembrete Matinal Proativo baseado no horário configurado
export function scheduleMorningNotification(appointmentsCount = 0, userName = 'Profissional') {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.dailySummary) return;

  const [hours, minutes] = (settings.morningTime || '08:00').split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  // Se o horário de hoje já passou, agenda para amanhã
  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const delayMs = scheduledTime.getTime() - now.getTime();

  // Agenda via setTimeout para a sessão ativa
  setTimeout(async () => {
    try {
      const reg = await registerServiceWorker();
      const msg = appointmentsCount > 0
        ? `Você tem ${appointmentsCount} cliente(s) agendada(s) para hoje! Confira os horários.`
        : 'Sua agenda está livre hoje. Que tal enviar uma mensagem de retorno para suas clientes?';

      if (reg && reg.showNotification) {
        reg.showNotification(`☀️ Bom dia, ${userName}!`, {
          body: msg,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          data: { url: '/' },
          vibrate: [200, 100, 200],
        });
      }
    } catch (e) {
      console.warn('Erro ao disparar resumo diário agendado:', e);
    }
  }, delayMs);
}

