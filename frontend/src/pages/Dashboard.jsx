import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar,
  Clock,
  MessageCircle,
  Edit2,
  XCircle,
  Phone,
  Plus,
  X,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Search,
  DollarSign,
  Share2,
  Copy,
  Check,
  LayoutGrid,
  List,
  CalendarDays,
  CheckCheck,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { scheduleMorningNotification } from '../lib/pushNotifications';
import { LypsyosIconBadge } from '../components/ui/LypsyosIconBadge';
import { Button } from '../components/ui/Button';
import { ServiceIconBadge } from '../components/ui/SegmentServiceIcon';

export default function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditApp, setCurrentEditApp] = useState(null);
  const [cancelConfirmApp, setCancelConfirmApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showMobileStats, setShowMobileStats] = useState(false);
  const [toast, setToast] = useState({ type: '', text: '' });

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('lypsyos_appointments_view_mode') || 'timeline';
  });

  const { businessName, responsibleName, whatsapp, themeColor, segment } = useAppStore();
  const safeSegment = segment || 'manicure';
  const [availableServices, setAvailableServices] = useState([]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 3500);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('lypsyos_appointments_view_mode', mode);
  };

  const fetchServices = () => {
    const token = btoa('admin:admin');
    axios
      .get('http://localhost:8000/api/v1/services/', {
        headers: { Authorization: `Basic ${token}` },
      })
      .then((res) => {
        setAvailableServices((res.data || []).filter((s) => s.is_active));
      })
      .catch(() => {});
  };

  const fetchAppointments = () => {
    const token = btoa('admin:admin');
    axios
      .get('http://localhost:8000/api/v1/appointments/', {
        headers: { Authorization: `Basic ${token}` },
      })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setAppointments(list);
        setLoading(false);

        try {
          const todayCount = list.filter((app) => {
            if (!app.start_time) return false;
            const d = new Date(app.start_time);
            const today = new Date();
            return d.toDateString() === today.toDateString();
          }).length;
          scheduleMorningNotification(
            todayCount,
            responsibleName || businessName || 'Profissional'
          );
        } catch {
          // Silencioso caso notificações não estejam ativas
        }
      })
      .catch(() => {
        setAppointments([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAppointments();
    fetchServices();
  }, []);

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Não informado';
    const cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('55')) {
      return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length >= 14) {
      return `Contato WhatsApp (${cleaned.slice(-4)})`;
    }
    return phone;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Confirmado
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60">
            <CheckCheck className="w-3 h-3 text-blue-500" />
            Concluído
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pendente
          </span>
        );
      case 'CANCELLED':
      case 'CANCELED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  const handleQuickStatusChange = async (appId, newStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    const token = btoa('admin:admin');
    try {
      await axios.patch(
        `http://localhost:8000/api/v1/appointments/${appId}/`,
        { status: newStatus },
        { headers: { Authorization: `Basic ${token}` } }
      );
      showToast(
        'success',
        newStatus === 'COMPLETED' ? 'Atendimento concluído!' : 'Horário confirmado!'
      );
    } catch {
      // Mantém atualização visual local
    }
  };

  const getAppointmentTiming = (startTimeStr) => {
    if (!startTimeStr) return { label: '', color: '' };
    const start = new Date(startTimeStr);
    const now = new Date();
    const diffMinutes = Math.round((start.getTime() - now.getTime()) / 60000);

    if (diffMinutes < -60) {
      return {
        label: 'Horário encerrado',
        color: 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60',
      };
    }
    if (diffMinutes < 0) {
      return {
        label: 'Em atendimento agora',
        color:
          'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 font-bold',
      };
    }
    if (diffMinutes <= 30) {
      return {
        label: `Começa em ${diffMinutes} min`,
        color:
          'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 font-bold',
      };
    }
    if (diffMinutes <= 120) {
      return {
        label: `Em ${Math.round(diffMinutes / 60)}h`,
        color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60',
      };
    }
    return { label: '', color: '' };
  };

  const getWhatsAppDirectLink = (app) => {
    const phoneDigits = (app.client?.phone_number || '').replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length > 13) return 'https://web.whatsapp.com';
    const cleanPhone = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`;
    const startDate = new Date(app.start_time);
    const timeFormatted = startDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateFormatted = startDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
    const clientFirstName = (app.client?.full_name || 'Cliente').split(' ')[0];
    const msg = `Olá, ${clientFirstName}! ✨ Passando para confirmar seu horário de *${
      app.service?.name || 'atendimento'
    }* no dia *${dateFormatted}* às *${timeFormatted}* em *${
      businessName || 'nosso espaço'
    }*. Tudo certo para você?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleCreateAppointment = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const date = formData.get('date');
    const time = formData.get('time');
    const start_time = `${date}T${time}:00`;

    const payload = {
      client_name: formData.get('client_name'),
      client_phone: formData.get('client_phone'),
      service_id: formData.get('service_id'),
      start_time,
    };

    const token = btoa('admin:admin');
    axios
      .post('http://localhost:8000/api/v1/appointments/create_manual/', payload, {
        headers: { Authorization: `Basic ${token}` },
      })
      .then((res) => {
        setAppointments((prev) => [res.data, ...prev]);
        setIsModalOpen(false);
        showToast('success', 'Agendamento salvo com sucesso!');
      })
      .catch(() => {
        showToast('error', 'Não foi possível criar o agendamento. Confira os dados e tente novamente.');
      });
  };

  const confirmCancelAppointment = async () => {
    if (!cancelConfirmApp) return;
    const appId = cancelConfirmApp.id;
    setCancelConfirmApp(null);

    setAppointments((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: 'CANCELLED' } : a))
    );

    const token = btoa('admin:admin');
    try {
      await axios.post(
        `http://localhost:8000/api/v1/appointments/${appId}/cancel/`,
        {},
        { headers: { Authorization: `Basic ${token}` } }
      );
      showToast('success', 'Agendamento cancelado.');
    } catch {
      try {
        await axios.patch(
          `http://localhost:8000/api/v1/appointments/${appId}/`,
          { status: 'CANCELLED' },
          { headers: { Authorization: `Basic ${token}` } }
        );
        showToast('success', 'Agendamento cancelado.');
      } catch {
        // Atualizado na tela
      }
    }
  };

  const handleEditAppointment = (app) => {
    setCurrentEditApp(app);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!currentEditApp) return;

    const token = btoa('admin:admin');
    axios
      .patch(
        `http://localhost:8000/api/v1/appointments/${currentEditApp.id}/`,
        { status: currentEditApp.status },
        { headers: { Authorization: `Basic ${token}` } }
      )
      .then((res) => {
        setAppointments((prev) =>
          prev.map((a) => (a.id === currentEditApp.id ? res.data : a))
        );
        setIsEditModalOpen(false);
        showToast('success', 'Status do agendamento atualizado!');
      })
      .catch(() => {
        setAppointments((prev) =>
          prev.map((a) => (a.id === currentEditApp.id ? currentEditApp : a))
        );
        setIsEditModalOpen(false);
        showToast('success', 'Status atualizado!');
      });
  };

  const handleCopyBotLink = () => {
    const cleanNumber = (whatsapp || '').replace(/\D/g, '');
    const fullNumber =
      cleanNumber && !cleanNumber.startsWith('55') && cleanNumber.length <= 11
        ? `55${cleanNumber}`
        : cleanNumber || '5511999999999';
    const botUrl = `https://wa.me/${fullNumber}?text=${encodeURIComponent(
      'Olá! Gostaria de agendar um horário.'
    )}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(botUrl).catch(() => {});
    }
    setCopiedLink(true);
    showToast('success', 'Link de agendamento copiado! Envie para suas clientes.');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // CÁLCULOS FINANCEIROS E OPERACIONAIS REAIS
  const todayStr = new Date().toISOString().split('T')[0];
  const isRealizedStatus = (st) => st === 'CONFIRMED' || st === 'COMPLETED';

  const todayAppointments = appointments.filter(
    (a) =>
      a.start_time?.startsWith(todayStr) &&
      a.status !== 'CANCELLED' &&
      a.status !== 'CANCELED'
  );
  const confirmedToday = todayAppointments.filter((a) => isRealizedStatus(a.status));
  const entradasHoje = confirmedToday.reduce(
    (acc, curr) => acc + (parseFloat(curr.service?.price) || 0),
    0
  );

  const pendingToday = todayAppointments.filter((a) => a.status === 'PENDING');
  const aReceberHoje = pendingToday.reduce(
    (acc, curr) => acc + (parseFloat(curr.service?.price) || 0),
    0
  );
  const previstoHoje = entradasHoje + aReceberHoje;

  const confirmedAll = appointments.filter((a) => isRealizedStatus(a.status));
  const totalFaturamento = confirmedAll.reduce(
    (acc, curr) => acc + (parseFloat(curr.service?.price) || 0),
    0
  );
  const ticketMedio =
    confirmedAll.length > 0 ? totalFaturamento / confirmedAll.length : 0;

  const metaDiariaHorarios = 8;
  const capacidadePorcentagem = Math.min(
    100,
    Math.round((todayAppointments.length / metaDiariaHorarios) * 100)
  );

  const datePills = (() => {
    const pills = [
      { id: 'ALL', label: 'Todos', sub: 'Geral', count: appointments.length },
    ];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const count = appointments.filter(
        (a) =>
          a.start_time?.startsWith(iso) &&
          a.status !== 'CANCELLED' &&
          a.status !== 'CANCELED'
      ).length;

      let label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      label = label.charAt(0).toUpperCase() + label.slice(1);
      if (i === 0) label = 'Hoje';
      if (i === 1) label = 'Amanhã';

      const sub = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      pills.push({ id: iso, label, sub, count, isToday: i === 0 });
    }
    return pills;
  })();

  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch =
      app.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.client?.phone_number?.includes(searchTerm);
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'CONFIRMED'
        ? isRealizedStatus(app.status)
        : statusFilter === 'CANCELLED'
        ? app.status === 'CANCELLED' || app.status === 'CANCELED'
        : app.status === statusFilter);
    const matchesDay =
      selectedDayFilter === 'ALL' || app.start_time?.startsWith(selectedDayFilter);
    return matchesSearch && matchesStatus && matchesDay;
  });

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0 pb-6">
      {/* Toast Mobile-Safe */}
      {toast.text && (
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:top-auto sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl text-white text-xs sm:text-sm font-semibold animate-in fade-in ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
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

      {/* CABEÇALHO DIRETO E LIMPO (Foco imediato na agenda no celular) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-line dark:border-slate-800 min-w-0">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink dark:text-white tracking-tight leading-tight truncate">
            Agenda •{' '}
            <span className="text-brand dark:text-blue-400">
              {businessName || 'Meu Espaço'}
            </span>
          </h1>
          <p className="text-ink-soft dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            {todayAppointments.length > 0
              ? `Você tem ${todayAppointments.length} ${
                  todayAppointments.length === 1
                    ? 'atendimento marcado'
                    : 'atendimentos marcados'
                } para hoje.`
              : 'Acompanhe seus horários e receba clientes pelo WhatsApp.'}
          </p>
        </div>

        {/* Ações Rápidas (50/50 no mobile para toque fácil com o polegar) */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            onClick={handleCopyBotLink}
            className="min-h-11 px-3.5 text-xs font-bold w-full sm:w-auto"
            title="Copiar link direto para enviar às clientes"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-growth shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-brand dark:text-blue-400 shrink-0" />
            )}
            <span className="truncate">{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            style={themeColor ? { backgroundColor: themeColor } : undefined}
            className="min-h-11 px-4 text-xs font-bold w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">Agendar</span>
          </Button>
        </div>
      </div>

      {/* RESUMO FINANCEIRO COMPACTO NO MOBILE (< md) + COMPLETO NO DESKTOP (>= md) */}
      {/* Versão Mobile: Barra executiva compacta + gaveta opcional para não empurrar a agenda */}
      <div className="md:hidden bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-4 shadow-soft space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-slate-400">
              Caixa de Hoje
            </span>
            <p className="font-heading text-2xl font-extrabold text-growth-text dark:text-emerald-400 leading-tight mt-0.5">
              R$ {previstoHoje.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div className="text-right text-xs space-y-0.5">
            <p className="font-semibold text-growth-text dark:text-emerald-400">
              Confirmado: R$ {entradasHoje.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-ink-soft dark:text-slate-400">
              Pendente: R$ {aReceberHoje.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowMobileStats((v) => !v)}
          className="w-full pt-2.5 border-t border-line/70 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-brand dark:text-blue-400 cursor-pointer"
        >
          <span>
            {showMobileStats
              ? 'Ocultar indicadores gerais'
              : `Ver receita geral (R$ ${totalFaturamento.toFixed(2).replace('.', ',')}) e indicadores`}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              showMobileStats ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showMobileStats && (
          <div className="grid grid-cols-3 gap-2 pt-1 animate-in fade-in text-xs">
            <div className="bg-canvas dark:bg-slate-800/60 p-2.5 rounded-xl">
              <p className="text-[10px] text-ink-muted dark:text-slate-400">Ticket médio</p>
              <p className="font-heading font-bold text-ink dark:text-white mt-0.5">
                R$ {ticketMedio.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="bg-canvas dark:bg-slate-800/60 p-2.5 rounded-xl">
              <p className="text-[10px] text-ink-muted dark:text-slate-400">Confirmados</p>
              <p className="font-heading font-bold text-ink dark:text-white mt-0.5">
                {confirmedAll.length}
              </p>
            </div>
            <div className="bg-canvas dark:bg-slate-800/60 p-2.5 rounded-xl">
              <p className="text-[10px] text-ink-muted dark:text-slate-400">Ocupação hoje</p>
              <p className="font-heading font-bold text-growth-text dark:text-emerald-400 mt-0.5">
                {capacidadePorcentagem}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Versão Desktop/Tablet: 2 Cards Executivos Limpos (Sem repetição de números) */}
      <div className="hidden md:grid md:grid-cols-2 gap-5">
        {/* Card 1: Caixa de Hoje */}
        <div className="min-w-0 bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <LypsyosIconBadge icon={DollarSign} tone="growth" size="md" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 block">
                  Caixa de Hoje
                </span>
                <span className="text-xs text-ink-muted dark:text-slate-500">
                  {todayAppointments.length > 0
                    ? `${todayAppointments.length} atendimento(s) programado(s) hoje`
                    : 'Nenhum atendimento marcado para hoje'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-ink-muted dark:text-slate-400 block">
                Total previsto hoje
              </span>
              <span className="font-heading text-2xl font-extrabold text-growth-text dark:text-emerald-400">
                R$ {previstoHoje.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-line/70 dark:border-slate-800 text-xs">
            <div className="bg-growth-soft/60 dark:bg-emerald-950/40 border border-growth/20 dark:border-emerald-800/60 px-3.5 py-2.5 rounded-xl flex items-center justify-between">
              <span className="font-medium text-growth-text dark:text-emerald-300">
                Confirmado
              </span>
              <span className="font-heading font-bold text-growth-text dark:text-emerald-400">
                R$ {entradasHoje.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="bg-brand-soft/60 dark:bg-blue-950/40 border border-brand/20 dark:border-blue-900/60 px-3.5 py-2.5 rounded-xl flex items-center justify-between">
              <span className="font-medium text-brand dark:text-blue-300">Pendente</span>
              <span className="font-heading font-bold text-brand dark:text-blue-400">
                R$ {aReceberHoje.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Receita Confirmada e Indicadores da Agenda */}
        <div className="min-w-0 bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <LypsyosIconBadge icon={TrendingUp} tone="brand" size="md" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 block">
                  Receita na Agenda
                </span>
                <span className="text-xs text-ink-muted dark:text-slate-500">
                  Soma de todos os agendamentos confirmados
                </span>
              </div>
            </div>
            <div className="font-heading text-2xl font-extrabold text-ink dark:text-white">
              R$ {totalFaturamento.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-line/70 dark:border-slate-800 text-xs">
            <div className="bg-canvas dark:bg-slate-800/60 p-2.5 rounded-xl">
              <p className="text-ink-muted dark:text-slate-400 text-[11px]">Ticket médio</p>
              <p className="font-heading font-bold text-ink dark:text-white mt-0.5">
                R$ {ticketMedio.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="bg-canvas dark:bg-slate-800/60 p-2.5 rounded-xl">
              <p className="text-ink-muted dark:text-slate-400 text-[11px]">Confirmados</p>
              <p className="font-heading font-bold text-ink dark:text-white mt-0.5">
                {confirmedAll.length}
              </p>
            </div>
            <div className="bg-canvas dark:bg-slate-800/60 p-2.5 rounded-xl">
              <p className="text-ink-muted dark:text-slate-400 text-[11px]">Ocupação hoje</p>
              <p className="font-heading font-bold text-growth-text dark:text-emerald-400 mt-0.5">
                {capacidadePorcentagem}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CARROSSEL DE DATAS (Toque Rápido com Polegar) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {datePills.map((pill) => {
          const isSelected = selectedDayFilter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setSelectedDayFilter(pill.id)}
              className={`min-h-12 flex flex-col items-start px-3.5 py-2 rounded-2xl border text-xs font-semibold shrink-0 transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-brand text-white border-brand shadow-md shadow-brand/20'
                  : 'bg-surface dark:bg-slate-900 text-ink dark:text-slate-300 border-line dark:border-slate-800 hover:border-brand/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm">{pill.label}</span>
                {pill.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-growth-soft text-growth-text dark:bg-emerald-950/60 dark:text-emerald-400'
                    }`}
                  >
                    {pill.count}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isSelected ? 'text-blue-100' : 'text-ink-muted dark:text-slate-500'
                }`}
              >
                {pill.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* BARRA DE BUSCA, FILTROS E VISUALIZAÇÃO */}
      <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-3.5 shadow-soft flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cliente ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-10 pl-10 pr-4 py-2 text-base sm:text-xs bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 text-ink dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          {/* Status */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'ALL', label: `Todos (${appointments.length})`, activeBg: 'bg-brand text-white' },
              {
                id: 'CONFIRMED',
                label: `Confirmados (${confirmedAll.length})`,
                activeBg: 'bg-growth text-white',
              },
              {
                id: 'PENDING',
                label: `Pendentes (${appointments.filter((a) => a.status === 'PENDING').length})`,
                activeBg: 'bg-amber-600 text-white',
              },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`min-h-9 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st.id
                    ? st.activeBg
                    : 'bg-canvas dark:bg-slate-800 text-ink-soft dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Modos de Exibição (Tabela disponível em telas maiores para evitar rolagem lateral no celular) */}
          <div className="flex items-center gap-1 bg-canvas dark:bg-slate-800 p-1 rounded-xl border border-line dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => handleViewModeChange('timeline')}
              title="Linha do Tempo"
              className={`min-h-8 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-surface dark:bg-slate-900 text-ink dark:text-white shadow-2xs'
                  : 'text-ink-soft dark:text-slate-400'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-brand dark:text-blue-400" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('cards')}
              title="Cartões"
              className={`min-h-8 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-surface dark:bg-slate-900 text-ink dark:text-white shadow-2xs'
                  : 'text-ink-soft dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-brand dark:text-blue-400" />
              <span className="hidden sm:inline">Cartões</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('table')}
              title="Tabela (Computador)"
              className={`hidden md:flex min-h-8 items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-surface dark:bg-slate-900 text-ink dark:text-white shadow-2xs'
                  : 'text-ink-soft dark:text-slate-400'
              }`}
            >
              <List className="w-3.5 h-3.5 text-brand dark:text-blue-400" />
              <span>Tabela</span>
            </button>
          </div>
        </div>
      </div>

      {/* LISTA DE AGENDAMENTOS */}
      {loading ? (
        <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-14 text-center flex flex-col items-center justify-center">
          <div className="w-9 h-9 border-4 border-brand/30 border-t-brand rounded-full animate-spin mb-3" />
          <p className="text-ink-soft dark:text-slate-400 font-medium text-sm">
            Carregando sua agenda...
          </p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-8 sm:p-14 text-center flex flex-col items-center justify-center shadow-soft">
          <div className="mb-4">
            <LypsyosIconBadge icon={Calendar} tone="brand" size="xl" />
          </div>
          <h3 className="font-heading text-lg sm:text-xl font-bold text-ink dark:text-white">
            Nenhum horário encontrado aqui
          </h3>
          <p className="text-ink-soft dark:text-slate-400 mt-1 max-w-md text-xs sm:text-sm leading-relaxed">
            Compartilhe seu link de agendamento no WhatsApp ou adicione um cliente manualmente.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Button
              onClick={handleCopyBotLink}
              variant="whatsapp"
              size="md"
              className="w-full sm:w-auto min-h-11"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link de Agendamento'}</span>
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="primary"
              size="md"
              style={themeColor ? { backgroundColor: themeColor } : undefined}
              className="w-full sm:w-auto min-h-11"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Novo Agendamento</span>
            </Button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* MODO CARTÕES (Com 1-toque Confirmar/Concluir igual à Agenda) */
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredAppointments.map((app) => {
            const startDate = new Date(app.start_time);
            const isCanceled = app.status === 'CANCELLED' || app.status === 'CANCELED';
            const isPending = app.status === 'PENDING';
            const isConfirmed = app.status === 'CONFIRMED';
            const waUrl = getWhatsAppDirectLink(app);

            return (
              <div
                key={app.id}
                className="bg-surface dark:bg-slate-900 rounded-3xl shadow-soft border border-line dark:border-slate-800 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4 sm:p-5 border-b border-line/70 dark:border-slate-800 flex justify-between items-start gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <ServiceIconBadge
                      serviceName={app.service?.name}
                      segmentId={safeSegment}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-ink dark:text-white truncate">
                        {app.service?.name || 'Procedimento'}
                      </h3>
                      <p className="text-growth-text dark:text-emerald-400 text-xs sm:text-sm font-extrabold">
                        R$ {parseFloat(app.service?.price || 0).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 bg-canvas dark:bg-slate-800/50 p-3 rounded-2xl border border-line/60 dark:border-slate-800">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-ink dark:text-white truncate">
                        {app.client?.full_name || 'Cliente'}
                      </p>
                      <p className="text-xs text-ink-soft dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {formatPhoneNumber(app.client?.phone_number || '')}
                        </span>
                      </p>
                    </div>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Chamar no WhatsApp"
                      className="size-10 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-white flex items-center justify-center shrink-0 shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 bg-canvas dark:bg-slate-800/50 p-2.5 rounded-xl border border-line/60 dark:border-slate-800">
                      <Calendar className="w-4 h-4 text-brand dark:text-blue-400 shrink-0" />
                      <span className="font-semibold text-ink dark:text-slate-200">
                        {startDate.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-canvas dark:bg-slate-800/50 p-2.5 rounded-xl border border-line/60 dark:border-slate-800">
                      <Clock className="w-4 h-4 text-growth shrink-0" />
                      <span className="font-semibold text-ink dark:text-slate-200">
                        {startDate.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-canvas/70 dark:bg-slate-800/30 border-t border-line/70 dark:border-slate-800 flex items-center gap-2">
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange(app.id, 'CONFIRMED')}
                      className="flex-1 min-h-10 inline-flex items-center justify-center gap-1.5 bg-growth hover:opacity-95 text-white font-bold text-xs py-2 px-3 rounded-xl cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Confirmar
                    </button>
                  )}
                  {isConfirmed && (
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange(app.id, 'COMPLETED')}
                      className="flex-1 min-h-10 inline-flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs py-2 px-3 rounded-xl cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Concluir
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleEditAppointment(app)}
                    className="min-h-10 px-3 py-2 rounded-xl border border-line dark:border-slate-700 bg-surface dark:bg-slate-800 text-xs font-semibold text-ink-soft dark:text-slate-300 hover:text-brand cursor-pointer"
                    title="Alterar status"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {!isCanceled && (
                    <button
                      type="button"
                      onClick={() => setCancelConfirmApp(app)}
                      className="min-h-10 px-3 py-2 rounded-xl border border-line dark:border-slate-700 bg-surface dark:bg-slate-800 text-xs font-semibold text-ink-soft dark:text-slate-300 hover:text-rose-600 cursor-pointer"
                      title="Cancelar horário"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODO AGENDA / LINHA DO TEMPO (Padrão principal no celular, e Tabela no Desktop quando escolhida) */
        <>
          {viewMode === 'table' && (
            <div className="hidden md:block bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-canvas dark:bg-slate-800/60 border-b border-line dark:border-slate-800 text-[11px] font-bold text-ink-muted dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Cliente</th>
                      <th className="py-3.5 px-4">Procedimento</th>
                      <th className="py-3.5 px-4">Data & Horário</th>
                      <th className="py-3.5 px-4">Valor</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60 dark:divide-slate-800 text-sm">
                    {filteredAppointments.map((app) => {
                      const startDate = new Date(app.start_time);
                      const isCanceled =
                        app.status === 'CANCELLED' || app.status === 'CANCELED';
                      const waUrl = getWhatsAppDirectLink(app);
                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-canvas/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-5">
                            <p className="font-semibold text-ink dark:text-white">
                              {app.client?.full_name}
                            </p>
                            <p className="text-xs text-ink-muted dark:text-slate-400">
                              {formatPhoneNumber(app.client?.phone_number || '')}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <ServiceIconBadge
                                serviceName={app.service?.name}
                                segmentId={safeSegment}
                                size="xs"
                              />
                              <div>
                                <p className="font-semibold text-ink dark:text-white">
                                  {app.service?.name || 'Procedimento'}
                                </p>
                                <p className="text-xs text-ink-muted dark:text-slate-400">
                                  {app.service?.duration_minutes || 30} min
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <p className="font-semibold text-ink dark:text-white">
                              {startDate.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                            <p className="text-ink-muted dark:text-slate-400">
                              {startDate.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-growth-text dark:text-emerald-400">
                            R${' '}
                            {parseFloat(app.service?.price || 0)
                              .toFixed(2)
                              .replace('.', ',')}
                          </td>
                          <td className="py-3.5 px-4">{getStatusBadge(app.status)}</td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Conversar no WhatsApp"
                                className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800"
                              >
                                <MessageCircle className="w-4 h-4 fill-emerald-600" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleEditAppointment(app)}
                                title="Editar Status"
                                className="p-2 text-ink-soft hover:text-brand rounded-xl border border-line dark:border-slate-700 cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {!isCanceled && (
                                <button
                                  type="button"
                                  onClick={() => setCancelConfirmApp(app)}
                                  title="Cancelar"
                                  className="p-2 text-ink-soft hover:text-rose-600 rounded-xl border border-line dark:border-slate-700 cursor-pointer"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Linha do Tempo (Visível sempre em 'timeline', e como fallback automático no celular caso 'table' estivesse salva) */}
          <div className={viewMode === 'table' ? 'md:hidden space-y-5' : 'space-y-5'}>
            {Object.entries(
              filteredAppointments.reduce((acc, app) => {
                const dateKey = new Date(app.start_time).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                });
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(app);
                return acc;
              }, {})
            ).map(([dateLabel, apps]) => {
              const sortedApps = [...apps].sort(
                (a, b) => new Date(a.start_time) - new Date(b.start_time)
              );
              const isToday = apps.some((a) => a.start_time?.startsWith(todayStr));
              const now = new Date();
              let liveIndicatorRendered = false;

              return (
                <div
                  key={dateLabel}
                  className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-4 sm:p-6 shadow-soft"
                >
                  <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-line/70 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LypsyosIconBadge icon={Calendar} tone="brand" size="sm" />
                      <div className="min-w-0">
                        <h4 className="font-heading font-extrabold text-ink dark:text-white capitalize text-sm sm:text-base truncate">
                          {dateLabel}
                        </h4>
                        {isToday && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-growth-text dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-growth animate-pulse" />
                            Hoje
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-canvas dark:bg-slate-800 text-ink-soft dark:text-slate-300 border border-line dark:border-slate-700 shrink-0">
                      {sortedApps.length} {sortedApps.length === 1 ? 'horário' : 'horários'}
                    </span>
                  </div>

                  <div className="relative pl-4 sm:pl-6 space-y-3.5 before:absolute before:left-1.5 sm:before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    {sortedApps.map((app) => {
                      const startDate = new Date(app.start_time);
                      const endDate = new Date(
                        startDate.getTime() +
                          (app.service?.duration_minutes || 30) * 60000
                      );
                      const isCanceled =
                        app.status === 'CANCELLED' || app.status === 'CANCELED';
                      const isConfirmed = app.status === 'CONFIRMED';
                      const isPending = app.status === 'PENDING';
                      const isCompleted = app.status === 'COMPLETED';
                      const timing = getAppointmentTiming(app.start_time);
                      const waUrl = getWhatsAppDirectLink(app);

                      const shouldRenderLiveNow =
                        isToday && !liveIndicatorRendered && startDate > now;
                      if (shouldRenderLiveNow) {
                        liveIndicatorRendered = true;
                      }

                      return (
                        <div key={app.id} className="space-y-3.5">
                          {shouldRenderLiveNow && (
                            <div className="relative flex items-center gap-2.5 py-1">
                              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                                <Zap className="w-3 h-3 fill-current" />
                                <span>
                                  Agora •{' '}
                                  {now.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <div className="flex-1 h-[1.5px] bg-gradient-to-r from-rose-500/70 to-transparent" />
                            </div>
                          )}

                          <div className="relative">
                            <span
                              className={`absolute -left-[15px] sm:-left-[21px] top-5 w-3 h-3 rounded-full border-2 bg-surface dark:bg-slate-900 ${
                                isCanceled
                                  ? 'border-rose-400'
                                  : isCompleted
                                  ? 'border-blue-500'
                                  : isConfirmed
                                  ? 'border-emerald-500'
                                  : 'border-amber-400'
                              }`}
                            />

                            <div
                              className={`bg-canvas/70 dark:bg-slate-800/40 border rounded-2xl p-3.5 sm:p-4 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 border-l-4 ${
                                isCanceled
                                  ? 'border-line dark:border-slate-800 border-l-rose-400 opacity-60'
                                  : isCompleted
                                  ? 'border-line dark:border-slate-700 border-l-blue-500'
                                  : isConfirmed
                                  ? 'border-line dark:border-slate-700 border-l-emerald-500'
                                  : 'border-line dark:border-slate-700 border-l-amber-500'
                              }`}
                            >
                              <div className="flex items-start sm:items-center gap-3 min-w-0">
                                <div className="bg-surface dark:bg-slate-900 border border-line dark:border-slate-800 px-2.5 py-2 rounded-xl text-center shrink-0 min-w-[66px]">
                                  <span className="text-sm sm:text-base font-black text-ink dark:text-white block leading-none">
                                    {startDate.toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  <span className="block text-[10px] font-medium text-ink-muted mt-1">
                                    até{' '}
                                    {endDate.toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>

                                <ServiceIconBadge
                                  serviceName={app.service?.name}
                                  segmentId={safeSegment}
                                  size="sm"
                                  className="hidden sm:inline-flex"
                                />

                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <h5 className="font-bold text-ink dark:text-white text-sm sm:text-base leading-tight">
                                      {app.service?.name || 'Procedimento'}
                                    </h5>
                                    <span className="text-growth-text dark:text-emerald-400 font-extrabold text-xs">
                                      R${' '}
                                      {parseFloat(app.service?.price || 0)
                                        .toFixed(2)
                                        .replace('.', ',')}
                                    </span>
                                    {getStatusBadge(app.status)}
                                    {timing.label && !isCanceled && !isCompleted && (
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${timing.color}`}
                                      >
                                        {timing.label}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft dark:text-slate-400">
                                    <span className="font-bold text-ink dark:text-slate-200">
                                      {app.client?.full_name || 'Cliente'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {formatPhoneNumber(app.client?.phone_number || '')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Botões de Ação Ergonômicos (min-h-10 no mobile) */}
                              <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-line/60 dark:border-slate-800 justify-end shrink-0 flex-wrap">
                                {isPending && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickStatusChange(app.id, 'CONFIRMED')
                                    }
                                    className="min-h-10 inline-flex items-center gap-1.5 bg-growth hover:opacity-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Confirmar</span>
                                  </button>
                                )}

                                {isConfirmed && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickStatusChange(app.id, 'COMPLETED')
                                    }
                                    className="min-h-10 inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                                  >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    <span>Concluir</span>
                                  </button>
                                )}

                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Chamar no WhatsApp"
                                  className="min-h-10 inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1fb855] text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                  <span>WhatsApp</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleEditAppointment(app)}
                                  className="size-10 inline-flex items-center justify-center text-ink-soft dark:text-slate-400 hover:text-brand rounded-xl border border-line dark:border-slate-700 bg-surface dark:bg-slate-800 cursor-pointer"
                                  title="Editar status"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {!isCanceled && (
                                  <button
                                    type="button"
                                    onClick={() => setCancelConfirmApp(app)}
                                    className="size-10 inline-flex items-center justify-center text-ink-soft dark:text-slate-400 hover:text-rose-600 rounded-xl border border-line dark:border-slate-700 bg-surface dark:bg-slate-800 cursor-pointer"
                                    title="Cancelar agendamento"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* MODAL NOVO AGENDAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-surface dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-200 border border-line dark:border-slate-800">
            <div className="flex justify-between items-center p-5 border-b border-line dark:border-slate-800">
              <div>
                <h3 className="font-heading font-bold text-lg text-ink dark:text-white">
                  Novo Agendamento
                </h3>
                <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                  Reserve um horário manualmente na sua agenda
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="size-9 inline-flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-canvas dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 mb-1.5">
                  Nome da Cliente
                </label>
                <input
                  type="text"
                  name="client_name"
                  required
                  placeholder="Ex: Maria Silva"
                  className="w-full min-h-11 px-3.5 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 text-ink dark:text-white rounded-xl focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 mb-1.5">
                  WhatsApp com DDD
                </label>
                <input
                  type="tel"
                  name="client_phone"
                  required
                  placeholder="(11) 99999-9999"
                  className="w-full min-h-11 px-3.5 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 text-ink dark:text-white rounded-xl focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 mb-1.5">
                  Procedimento
                </label>
                <select
                  name="service_id"
                  required
                  className="w-full min-h-11 px-3.5 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 text-ink dark:text-white rounded-xl focus:outline-none focus:border-brand"
                >
                  <option value="">Escolha o procedimento...</option>
                  {availableServices.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name} — R$ {parseFloat(svc.price).toFixed(2).replace('.', ',')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 mb-1.5">
                    Data
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={todayStr}
                    className="w-full min-h-11 px-3 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 text-ink dark:text-white rounded-xl focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 mb-1.5">
                    Horário
                  </label>
                  <input
                    type="time"
                    name="time"
                    required
                    defaultValue="14:00"
                    className="w-full min-h-11 px-3 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 text-ink dark:text-white rounded-xl focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 min-h-11 px-4 py-2.5 text-xs sm:text-sm font-semibold text-ink-soft dark:text-slate-400 bg-canvas dark:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: themeColor || '#2457f5' }}
                  className="flex-1 min-h-11 px-4 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md cursor-pointer hover:opacity-95"
                >
                  Salvar Horário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR STATUS (Agora inclui Concluído!) */}
      {isEditModalOpen && currentEditApp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-line dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-heading font-bold text-lg text-ink dark:text-white">
              Alterar Status
            </h3>
            <p className="text-xs text-ink-soft dark:text-slate-400">
              Cliente: <strong>{currentEditApp.client?.full_name}</strong>
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 mb-1.5">
                  Situação do Atendimento
                </label>
                <select
                  value={currentEditApp.status}
                  onChange={(e) =>
                    setCurrentEditApp({ ...currentEditApp, status: e.target.value })
                  }
                  className="w-full min-h-11 px-3.5 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 text-ink dark:text-white rounded-xl focus:outline-none focus:border-brand"
                >
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="COMPLETED">Concluído (Atendido)</option>
                  <option value="PENDING">Pendente</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="min-h-11 py-2.5 text-xs font-semibold text-ink-soft dark:text-slate-400 bg-canvas dark:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: themeColor || '#2457f5' }}
                  className="min-h-11 py-2.5 text-xs font-bold text-white rounded-xl cursor-pointer hover:opacity-95"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO (Protege contra toque acidental no celular) */}
      {cancelConfirmApp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 border border-line dark:border-slate-800 p-6 space-y-4">
            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-heading font-extrabold text-base text-ink dark:text-white">
                Cancelar este agendamento?
              </h3>
              <p className="text-xs text-ink-soft dark:text-slate-400 mt-1">
                O horário de <strong>{cancelConfirmApp.client?.full_name}</strong> (
                {cancelConfirmApp.service?.name}) ficará livre novamente na agenda.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCancelConfirmApp(null)}
                className="min-h-11 py-2.5 px-4 rounded-xl border border-line dark:border-slate-700 text-ink dark:text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Manter horário
              </button>
              <button
                type="button"
                onClick={confirmCancelAppointment}
                className="min-h-11 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
