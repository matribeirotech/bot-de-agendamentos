import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, Clock, User, MessageCircle, Edit2, XCircle, Phone, Plus, X, 
  TrendingUp, CheckCircle2, AlertCircle, Sparkles, Search, DollarSign, 
  Users, ArrowUpRight, Share2, Copy, Check, LayoutGrid, List, CalendarDays,
  CheckCheck, Zap
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');
  const [copiedLink, setCopiedLink] = useState(false);

  // Modo de visualização com persistência em cache (localStorage)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('lypsyos_appointments_view_mode') || 'timeline';
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('lypsyos_appointments_view_mode', mode);
  };

  const { businessName, responsibleName, whatsapp, themeColor, segment } = useAppStore();
  const [availableServices, setAvailableServices] = useState([]);

  const fetchServices = () => {
    const token = btoa('admin:admin');
    axios.get('http://localhost:8000/api/v1/services/', {
      headers: { 'Authorization': `Basic ${token}` }
    })
    .then(res => {
      setAvailableServices(res.data.filter(s => s.is_active));
    })
    .catch(err => console.warn("Erro ao buscar serviços:", err));
  };

  const fetchAppointments = () => {
    const token = btoa('admin:admin'); 
    axios.get('http://localhost:8000/api/v1/appointments/', {
      headers: { 'Authorization': `Basic ${token}` }
    })
    .then(res => {
      setAppointments(res.data);
      setLoading(false);

      // Agenda notificação matinal proativa caso configurado
      try {
        const todayCount = (res.data || []).filter(app => {
          if (!app.start_time) return false;
          const d = new Date(app.start_time);
          const today = new Date();
          return d.toDateString() === today.toDateString();
        }).length;
        scheduleMorningNotification(todayCount, responsibleName || businessName || 'Profissional');
      } catch (e) {
        console.warn('Erro ao agendar notificação:', e);
      }
    })
    .catch(err => {
      console.error("Erro ao buscar agendamentos:", err);
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
    const cleaned = ('' + phone).replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('55')) {
      return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length >= 14) {
      return `WhatsApp ID (...${cleaned.slice(-4)})`;
    }
    return phone;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Confirmado
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60">
            <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
            Concluído
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Pendente
          </span>
        );
      case 'CANCELLED':
      case 'CANCELED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  // Alteração Rápida de Status (1 Toque com Atualização Otimista)
  const handleQuickStatusChange = async (appId, newStatus) => {
    setAppointments(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    const token = btoa('admin:admin');
    try {
      await axios.patch(`http://localhost:8000/api/v1/appointments/${appId}/`, {
        status: newStatus
      }, {
        headers: { 'Authorization': `Basic ${token}` }
      });
    } catch (err) {
      console.warn('Falha ao atualizar status do agendamento:', err);
    }
  };

  // Cálculo de Proximidade e Timing em Tempo Real
  const getAppointmentTiming = (startTimeStr) => {
    if (!startTimeStr) return { label: '', color: '' };
    const start = new Date(startTimeStr);
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / 60000);

    if (diffMinutes < -60) {
      return { label: 'Concluído', color: 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60', isPast: true };
    }
    if (diffMinutes < 0) {
      return { label: 'Em atendimento agora', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 font-bold', isNow: true };
    }
    if (diffMinutes <= 30) {
      return { label: `Começa em ${diffMinutes} min`, color: 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 font-bold', isSoon: true };
    }
    if (diffMinutes <= 120) {
      return { label: `Daqui a ${Math.round(diffMinutes / 60)}h`, color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60' };
    }
    return { label: start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800' };
  };

  // Gerador de Mensagem Humanizada e Link Direto do WhatsApp
  const getWhatsAppDirectLink = (app) => {
    const phoneDigits = (app.client?.phone_number || '').replace(/\D/g, '');
    if (!phoneDigits) return 'https://web.whatsapp.com';
    const cleanPhone = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`;
    const startDate = new Date(app.start_time);
    const timeFormatted = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const clientFirstName = (app.client?.full_name || 'Cliente').split(' ')[0];
    const msg = `Olá, ${clientFirstName}! ✨ Passando para confirmar seu horário de *${app.service?.name || 'atendimento'}* hoje às *${timeFormatted}* no *${businessName || 'nosso espaço'}*. Tudo certo para você?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Criação de Agendamento Manual
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
      start_time: start_time
    };

    const token = btoa('admin:admin');
    
    axios.post('http://localhost:8000/api/v1/appointments/create_manual/', payload, {
      headers: { 'Authorization': `Basic ${token}` }
    })
    .then(res => {
      setAppointments(prev => [res.data, ...prev]);
      setIsModalOpen(false);
      alert("✅ Agendamento registrado com sucesso!");
    })
    .catch(err => {
      console.error("Erro ao criar agendamento:", err);
      alert("Falha ao criar agendamento. Verifique se o serviço é válido e tente novamente.");
    });
  };

  // Ação de Cancelar Agendamento Real com feedback instantâneo
  const handleCancelAppointment = async (appId) => {
    // 1. Atualização otimista imediata na UI
    setAppointments(prev => prev.map(a => a.id === appId ? { ...a, status: 'CANCELLED' } : a));

    const token = btoa('admin:admin');
    try {
      // 2. Chama a action dedicada POST /cancel/ do Django
      await axios.post(`http://localhost:8000/api/v1/appointments/${appId}/cancel/`, {}, {
        headers: { 'Authorization': `Basic ${token}` }
      });
    } catch (postErr) {
      console.warn("POST /cancel/ falhou, tentando fallback PATCH:", postErr);
      try {
        await axios.patch(`http://localhost:8000/api/v1/appointments/${appId}/`, {
          status: 'CANCELLED'
        }, {
          headers: { 'Authorization': `Basic ${token}` }
        });
      } catch (patchErr) {
        console.error("Falha ao sincronizar cancelamento no backend:", patchErr);
      }
    }
  };

  // Ação de Editar Agendamento
  const handleEditAppointment = (app) => {
    setCurrentEditApp(app);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!currentEditApp) return;

    const token = btoa('admin:admin');
    axios.patch(`http://localhost:8000/api/v1/appointments/${currentEditApp.id}/`, {
      status: currentEditApp.status
    }, {
      headers: { 'Authorization': `Basic ${token}` }
    })
    .then(res => {
      setAppointments(prev => prev.map(a => a.id === currentEditApp.id ? res.data : a));
      setIsEditModalOpen(false);
      alert("Status atualizado com sucesso!");
    })
    .catch(() => {
      setAppointments(prev => prev.map(a => a.id === currentEditApp.id ? currentEditApp : a));
      setIsEditModalOpen(false);
    });
  };

  // Copiar Link do Robô para Compartilhar
  const handleCopyBotLink = () => {
    const cleanNumber = whatsapp.replace(/\D/g, '');
    const botUrl = `https://wa.me/${cleanNumber || '5511999999999'}?text=${encodeURIComponent('#agendar')}`;
    navigator.clipboard.writeText(botUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // CÁLCULOS 100% DINÂMICOS E REAIS (SEM DADOS FICTÍCIOS / MOCK)
  const todayStr = new Date().toISOString().split('T')[0];

  // Agendamentos de Hoje
  const todayAppointments = appointments.filter(a => a.start_time?.startsWith(todayStr));
  
  // Entradas de hoje (Apenas serviços confirmados de hoje)
  const confirmedToday = todayAppointments.filter(a => a.status === 'CONFIRMED');
  const entradasHoje = confirmedToday.reduce((acc, curr) => acc + (parseFloat(curr.service?.price) || 0), 0);

  // A Receber (Pendentes de hoje)
  const pendingToday = todayAppointments.filter(a => a.status === 'PENDING');
  const aReceberHoje = pendingToday.reduce((acc, curr) => acc + (parseFloat(curr.service?.price) || 0), 0);

  // Saldo real do dia
  const saldoDia = entradasHoje;

  // Total Geral de Faturamento do Mês / Geral
  const confirmedAll = appointments.filter(a => a.status === 'CONFIRMED');
  const totalFaturamento = confirmedAll.reduce((acc, curr) => acc + (parseFloat(curr.service?.price) || 0), 0);

  // Ticket Médio Real (ou 0 se não houver agendamentos)
  const ticketMedio = confirmedAll.length > 0 ? (totalFaturamento / confirmedAll.length) : 0;

  // Taxa de Capacidade Ocupada do Dia (calculada sobre base média diária de 8 horários)
  const metaDiariaHorarios = 8;
  const capacidadePorcentagem = Math.min(100, Math.round((todayAppointments.length / metaDiariaHorarios) * 100));

  // Geração Dinâmica de Pílulas de Datas (Hoje, Amanhã e Próximos 7 Dias)
  const datePills = (() => {
    const pills = [
      { id: 'ALL', label: 'Todos os Dias', sub: 'Visão Geral', count: appointments.length }
    ];

    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const count = appointments.filter(a => a.start_time?.startsWith(iso)).length;
      
      let label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      label = label.charAt(0).toUpperCase() + label.slice(1);
      if (i === 0) label = 'Hoje';
      if (i === 1) label = 'Amanhã';

      const sub = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      pills.push({ id: iso, label, sub, count, isToday: i === 0 });
    }
    return pills;
  })();

  // Filtros de busca e data
  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = 
      app.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.client?.phone_number?.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'CANCELLED' ? (app.status === 'CANCELLED' || app.status === 'CANCELED') : app.status === statusFilter);
    const matchesDay = selectedDayFilter === 'ALL' || app.start_time?.startsWith(selectedDayFilter);
    return matchesSearch && matchesStatus && matchesDay;
  });

  return (
    <div className="space-y-8 min-w-0">
      {/* Header com foco no estabelecimento e tipografia Poppins (font-heading) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-line dark:border-slate-800 min-w-0">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft dark:bg-blue-950/50 border border-brand/20 dark:border-blue-900/60 text-brand dark:text-blue-300 text-xs font-semibold tracking-wide uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-growth animate-pulse"></span>
            Zenda CRM • {businessName}
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-ink dark:text-white tracking-tight leading-tight break-words">
            Gestão inteligente para <span className="text-brand dark:text-blue-400 underline decoration-brand/30 underline-offset-4">{businessName}</span>
          </h1>
          <p className="text-ink-soft dark:text-slate-400 mt-2 text-sm md:text-base max-w-2xl">
            Acompanhe horários em tempo real e deixe o robô do WhatsApp preencher a sua agenda automaticamente 24/7.
          </p>
        </div>

        {/* Botões de Ação do Topo (Responsivos sem truncamento no mobile) */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <Button
            variant="outline"
            onClick={handleCopyBotLink}
            title="Compartilhar link de agendamento automático com clientes"
          >
            {copiedLink ? <Check className="w-4 h-4 text-growth" /> : <Copy className="w-4 h-4 text-brand dark:text-blue-400" />}
            <span>{copiedLink ? "Link Copiado!" : "Copiar Link do Robô"}</span>
          </Button>

          <Button 
            variant="default"
            onClick={() => setIsModalOpen(true)}
            style={themeColor ? { backgroundColor: themeColor } : {}}
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </Button>
        </div>
      </div>

      {/* Grid de Métricas 100% DINÂMICAS COM DESIGN SYSTEM LYPSYOS / ZENDA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Faturamento Previsto */}
        <div className="min-w-0 bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 sm:p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <LypsyosIconBadge icon={TrendingUp} tone="growth" size="md" />
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 block truncate">
                  Faturamento Previsto
                </span>
                <span className="text-[11px] text-ink-muted dark:text-slate-500 block truncate">
                  Receita confirmada na agenda
                </span>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
              totalFaturamento > 0 
                ? 'text-growth-text dark:text-emerald-400 bg-growth-soft dark:bg-emerald-950/60 border-growth/25 dark:border-emerald-800' 
                : 'text-ink-muted dark:text-slate-500 bg-canvas dark:bg-slate-800/60 border-line dark:border-slate-700'
            }`}>
              {totalFaturamento > 0 ? '+100% real' : 'Zerado'}
            </span>
          </div>

          <div className="font-heading text-3xl font-extrabold text-growth-text dark:text-emerald-400 tracking-tight">
            R$ {totalFaturamento.toFixed(2).replace('.', ',')}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-line/70 dark:border-slate-800 text-xs">
            <div className="bg-canvas dark:bg-slate-800/60 p-2.5 rounded-xl min-w-0">
              <p className="text-ink-soft dark:text-slate-400 font-medium text-[11px] truncate">Ticket médio</p>
              <p className="font-heading font-bold text-ink dark:text-white mt-0.5 truncate">R$ {ticketMedio.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="bg-canvas dark:bg-slate-800/60 p-2.5 rounded-xl min-w-0">
              <p className="text-ink-soft dark:text-slate-400 font-medium text-[11px] truncate">Atendidos</p>
              <p className="font-heading font-bold text-ink dark:text-white mt-0.5">{confirmedAll.length}</p>
            </div>
            <div className="bg-canvas dark:bg-slate-800/60 p-2.5 rounded-xl min-w-0">
              <p className="text-ink-soft dark:text-slate-400 font-medium text-[11px] truncate">Capacidade</p>
              <p className={`font-heading font-bold mt-0.5 ${capacidadePorcentagem > 0 ? 'text-growth-text dark:text-emerald-400' : 'text-ink-muted dark:text-slate-500'}`}>
                {capacidadePorcentagem}%
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Resumo do Caixa DINÂMICO */}
        <div className="min-w-0 bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 sm:p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <LypsyosIconBadge icon={DollarSign} tone="brand" size="md" />
                <span className="text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 truncate">
                  Resumo do Caixa
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] font-semibold shrink-0">
                <span className="flex items-center gap-1 text-growth-text dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-growth"></span> Entradas
                </span>
                <span className="flex items-center gap-1 text-brand dark:text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-brand"></span> A Receber
                </span>
              </div>
            </div>

            <div className="space-y-2 mt-3">
              <div className="flex justify-between items-center bg-growth-soft/70 dark:bg-emerald-950/40 border border-growth/20 dark:border-emerald-800/60 px-3 py-2 rounded-xl text-xs">
                <span className="font-medium text-growth-text dark:text-emerald-300">↗ Entradas de Hoje</span>
                <span className="font-heading font-bold text-growth-text dark:text-emerald-400">R$ {entradasHoje.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between items-center bg-brand-soft/70 dark:bg-blue-950/40 border border-brand/20 dark:border-blue-900/60 px-3 py-2 rounded-xl text-xs">
                <span className="font-medium text-brand dark:text-blue-300">→ A Receber (Pendentes)</span>
                <span className="font-heading font-bold text-brand dark:text-blue-400">R$ {aReceberHoje.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-night text-white rounded-2xl p-3.5 flex items-center justify-between shadow-md border border-white/10">
            <div>
              <p className="text-[11px] text-white/60 font-medium">Saldo confirmado hoje</p>
              <p className="font-heading text-lg font-extrabold text-growth tracking-tight">R$ {saldoDia.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="flex items-center gap-1 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              {todayAppointments.length > 0 ? `${todayAppointments.length} agendados hoje` : 'Dia livre'}
            </div>
          </div>
        </div>

        {/* Card 3: Card Executivo Zenda Platform (Padrão Seção 6 do Guia Oficial) */}
        <div className="min-w-0 rounded-3xl border border-line dark:border-slate-800 bg-night p-5 sm:p-6 text-white shadow-2xl flex flex-col justify-between space-y-4">
          {/* Header com Ícone Oficial Zenda e Status */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-md border border-white/20">
                <img src="/logo-lypsyos-zenda-r1.svg" alt="Zenda Platform" className="size-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-white text-base leading-tight truncate">Zenda Platform</p>
                <p className="text-xs text-white/60 truncate">Sistema de Agendamento</p>
              </div>
            </div>
            <span className="rounded-full bg-growth-soft px-3 py-1 text-xs font-semibold text-growth-text shrink-0 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-growth animate-pulse"></span>
              Robô Ativo 24/7
            </span>
          </div>

          {/* Bloco Interno de Destaque */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/60">Faturamento previsto hoje</p>
              <span className="text-[11px] font-bold text-cyan-300">⚡ 3s resposta</span>
            </div>
            <p className="font-heading text-2xl sm:text-3xl font-extrabold text-growth">
              R$ {(entradasHoje + aReceberHoje).toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-white/70">
              {todayAppointments.length > 0
                ? `${todayAppointments.length} cliente(s) agendada(s) pelo robô hoje`
                : 'Aguardando novos agendamentos via #agendar'}
            </p>
          </div>
        </div>
      </div>

      {/* Carrossel de Datas e Filtro do Dia (One-Thumb Ergonomics) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Navegação Rápida da Agenda
          </span>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {selectedDayFilter === 'ALL' ? 'Mostrando todos os dias' : 'Filtrando dia selecionado'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {datePills.map(pill => {
            const isSelected = selectedDayFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setSelectedDayFilter(pill.id)}
                className={`flex flex-col items-start px-4 py-2.5 rounded-2xl border text-xs font-semibold shrink-0 transition-all cursor-pointer active:scale-95 shadow-2xs ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-blue-400/60 dark:hover:border-blue-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm">{pill.label}</span>
                  {pill.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                    }`}>
                      {pill.count}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-medium mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                  {pill.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Filtros, Busca e Modos de Visualização */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between w-full lg:w-auto gap-3">
          {/* Filtros de Status */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button 
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'ALL' 
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              Todos ({appointments.length})
            </button>
            <button 
              onClick={() => setStatusFilter('CONFIRMED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'CONFIRMED' 
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              Confirmados ({confirmedAll.length})
            </button>
            <button 
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'PENDING' 
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/20' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              Pendentes ({appointments.filter(a => a.status === 'PENDING').length})
            </button>
          </div>

          {/* Toggle de Modos de Exibição (com persistência em cache) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => handleViewModeChange('cards')}
              title="Visualização em Cartões (Padrão)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Cartões</span>
            </button>
            <button
              onClick={() => handleViewModeChange('table')}
              title="Visualização em Tabela Detalhada"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Tabela</span>
            </button>
            <button
              onClick={() => handleViewModeChange('timeline')}
              title="Visualização em Linha do Tempo / Agenda Diária"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Agendamentos com TRATAMENTO DE EMPTY STATE */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-16 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">Carregando seus agendamentos...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        /* EMPTY STATE ELEGANTE E COM CTAs AMIGÁVEIS */
        <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-10 md:p-16 text-center flex flex-col items-center justify-center shadow-soft">
          <div className="mb-4">
            <LypsyosIconBadge icon={Calendar} tone="brand" size="xl" />
          </div>
          
          <h3 className="font-heading text-xl font-bold text-ink dark:text-white break-words">Nenhum agendamento registrado ainda</h3>
          <p className="text-ink-soft dark:text-slate-400 mt-1 max-w-md text-xs sm:text-sm leading-relaxed break-words">
            Sua agenda está limpa e pronta para começar! Compartilhe o link do seu robô no WhatsApp com suas clientes ou faça um cadastro manual.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
            <Button 
              onClick={handleCopyBotLink}
              variant="whatsapp"
              size="md"
              className="w-full sm:w-auto"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>{copiedLink ? "Link Copiado!" : "Copiar Link do Robô (#agendar)"}</span>
            </Button>

            <Button 
              onClick={() => setIsModalOpen(true)}
              variant="primary"
              size="md"
              style={{ backgroundColor: themeColor || '#2457f5' }}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Novo Agendamento Manual</span>
            </Button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* 1. MODO TABELA PROFISSIONAL */
        <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Cliente</th>
                  <th className="py-3.5 px-4">Serviço</th>
                  <th className="py-3.5 px-4">Data & Horário</th>
                  <th className="py-3.5 px-4">Valor</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredAppointments.map(app => {
                  const startDate = new Date(app.start_time);
                  const isCanceled = app.status === 'CANCELLED' || app.status === 'CANCELED';
                  const phoneDigits = (app.client?.phone_number || '').replace(/\D/g, '');
                  const waUrl = phoneDigits.length >= 10 && phoneDigits.length <= 13
                    ? `https://wa.me/${phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits}?text=${encodeURIComponent(`Olá ${app.client?.full_name || ''}! Confirmamos seu agendamento no ${businessName}.`)}`
                    : `https://web.whatsapp.com`;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                            {app.client?.full_name ? app.client.full_name[0].toUpperCase() : 'C'}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-semibold text-slate-900 dark:text-white leading-tight">{app.client?.full_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{formatPhoneNumber(app.client?.phone_number || '')}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <ServiceIconBadge serviceName={app.service?.name} segmentId={segment} size="xs" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white leading-tight">{app.service?.name || "Serviço"}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {app.service?.duration_minutes || 30} min
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          R$ {parseFloat(app.service?.price || 0).toFixed(2).replace('.', ',')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Conversar no WhatsApp"
                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                          >
                            <MessageCircle className="w-4 h-4 fill-emerald-600" />
                          </a>
                          <button
                            onClick={() => handleEditAppointment(app)}
                            title="Editar Agendamento"
                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer shadow-2xs"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isCanceled && (
                            <button
                              onClick={() => handleCancelAppointment(app.id)}
                              title="Cancelar Agendamento"
                              className="p-2 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer shadow-2xs active:scale-95"
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
      ) : viewMode === 'timeline' ? (
        /* 2. MODO AGENDA / LINHA DO TEMPO CRONOLÓGICA INTERATIVA (PADRÃO HIGH-END) */
        <div className="space-y-6">
          {Object.entries(
            filteredAppointments.reduce((acc, app) => {
              const dateKey = new Date(app.start_time).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              });
              if (!acc[dateKey]) acc[dateKey] = [];
              acc[dateKey].push(app);
              return acc;
            }, {})
          ).map(([dateLabel, apps]) => {
            // Ordena cronologicamente os agendamentos do dia
            const sortedApps = [...apps].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
            const isToday = apps.some(a => a.start_time?.startsWith(todayStr));
            const now = new Date();
            let liveIndicatorRendered = false;

            return (
              <div key={dateLabel} className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 md:p-7 shadow-soft">
                {/* Header do Dia */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <LypsyosIconBadge icon={Calendar} tone="brand" size="sm" />
                    <div className="min-w-0">
                      <h4 className="font-heading font-extrabold text-ink dark:text-white capitalize text-base md:text-lg break-words">
                        {dateLabel}
                      </h4>
                      {isToday && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-growth-text dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-growth animate-pulse"></span>
                          Hoje • Dia Ativo
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/80">
                    {sortedApps.length} {sortedApps.length === 1 ? 'atendimento' : 'atendimentos'}
                  </span>
                </div>

                {/* Fluxo da Linha do Tempo */}
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200/80 dark:before:bg-slate-800">
                  {sortedApps.map((app, appIdx) => {
                    const startDate = new Date(app.start_time);
                    const endDate = new Date(startDate.getTime() + ((app.service?.duration_minutes || 30) * 60000));
                    const isCanceled = app.status === 'CANCELLED' || app.status === 'CANCELED';
                    const isConfirmed = app.status === 'CONFIRMED';
                    const isPending = app.status === 'PENDING';
                    const isCompleted = app.status === 'COMPLETED';

                    const timing = getAppointmentTiming(app.start_time);
                    const waUrl = getWhatsAppDirectLink(app);

                    // Indicador de "Agora" (se hoje e for o ponto de corte do horário atual)
                    const shouldRenderLiveNow = isToday && !liveIndicatorRendered && startDate > now;
                    if (shouldRenderLiveNow) {
                      liveIndicatorRendered = true;
                    }

                    return (
                      <div key={app.id} className="space-y-4">
                        {/* Linha Divisória de Horário Atual ("Agora") */}
                        {shouldRenderLiveNow && (
                          <div className="relative flex items-center gap-3 py-2 -ml-6 pl-6">
                            <span className="absolute -left-[30px] w-4 h-4 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                            </span>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm shadow-rose-500/30">
                              <Zap className="w-3 h-3 fill-current" />
                              <span>Agora • {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-rose-500 via-rose-300 dark:via-rose-900 to-transparent"></div>
                          </div>
                        )}

                        <div className="relative group">
                          {/* Marcador de Ponto na Linha */}
                          <span className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-slate-900 transition-all ${
                            isCanceled 
                              ? 'border-rose-400 group-hover:bg-rose-500' 
                              : isCompleted
                              ? 'border-blue-500 group-hover:bg-blue-500'
                              : isConfirmed
                              ? 'border-emerald-500 group-hover:bg-emerald-500'
                              : 'border-amber-400 group-hover:bg-amber-400'
                          }`}></span>

                          {/* Microcard Interativo */}
                          <div className={`bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border rounded-2xl p-4 transition-all duration-200 hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-l-4 ${
                            isCanceled
                              ? 'border-slate-200 dark:border-slate-750 border-l-rose-400 opacity-60'
                              : isCompleted
                              ? 'border-slate-200 dark:border-slate-700 border-l-blue-500'
                              : isConfirmed
                              ? 'border-slate-200 dark:border-slate-700 border-l-emerald-500'
                              : 'border-slate-200 dark:border-slate-700 border-l-amber-500'
                          }`}>
                            <div className="flex items-start sm:items-center gap-4">
                              {/* Bloco de Horário */}
                              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-2.5 rounded-xl text-center shrink-0 shadow-2xs min-w-[72px]">
                                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Início</span>
                                <span className="text-base font-black text-slate-900 dark:text-white">
                                  {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">
                                  até {endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              {/* Ícone Neural do Procedimento */}
                              <ServiceIconBadge serviceName={app.service?.name} segmentId={segment} size="sm" className="hidden sm:inline-flex" />

                              {/* Detalhes do Serviço & Cliente */}
                              <div className="space-y-1.5 overflow-hidden">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="font-bold text-slate-900 dark:text-white text-sm md:text-base leading-tight">
                                    {app.service?.name || "Serviço"}
                                  </h5>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                                    R$ {parseFloat(app.service?.price || 0).toFixed(2).replace('.', ',')}
                                  </span>
                                  {getStatusBadge(app.status)}
                                  {timing.label && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${timing.color}`}>
                                      {timing.label}
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                                  <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-black">
                                      {app.client?.full_name ? app.client.full_name[0].toUpperCase() : 'C'}
                                    </div>
                                    {app.client?.full_name}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                    {formatPhoneNumber(app.client?.phone_number || '')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    {app.service?.duration_minutes || 30} min
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Botões de Ações Rápidas com 1 Toque (Ergonomia Máxima) */}
                            <div className="flex items-center gap-2 self-end lg:self-center shrink-0 flex-wrap">
                              {/* 1-Tap Quick Action de Status */}
                              {isPending && (
                                <button
                                  onClick={() => handleQuickStatusChange(app.id, 'CONFIRMED')}
                                  title="Confirmar Agendamento com 1 Toque"
                                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Confirmar</span>
                                </button>
                              )}

                              {isConfirmed && (
                                <button
                                  onClick={() => handleQuickStatusChange(app.id, 'COMPLETED')}
                                  title="Marcar como Atendido / Concluído"
                                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Concluir</span>
                                </button>
                              )}

                              {/* WhatsApp Direct */}
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir conversa no WhatsApp com mensagem de confirmação"
                                className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
                              >
                                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                <span className="hidden sm:inline">WhatsApp</span>
                              </a>

                              {/* Editar Agendamento */}
                              <button
                                onClick={() => handleEditAppointment(app)}
                                className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer shadow-2xs transition-all active:scale-95"
                                title="Editar Agendamento"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Cancelar Agendamento */}
                              {!isCanceled && (
                                <button
                                  onClick={() => handleCancelAppointment(app.id)}
                                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer shadow-2xs active:scale-95 transition-all"
                                  title="Cancelar Agendamento"
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
      ) : (
        /* 3. MODO CARTÕES (PADRÃO ATUAL) */
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredAppointments.map(app => {
            const startDate = new Date(app.start_time);
            const isCanceled = app.status === 'CANCELLED' || app.status === 'CANCELED';
            const phoneDigits = (app.client?.phone_number || '').replace(/\D/g, '');
            const waUrl = phoneDigits.length >= 10 && phoneDigits.length <= 13
              ? `https://wa.me/${phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits}?text=${encodeURIComponent(`Olá ${app.client?.full_name || ''}! Confirmamos seu agendamento no ${businessName}.`)}`
              : `https://web.whatsapp.com`;

            return (
              <div 
                key={app.id} 
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Header Card */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {app.service?.name || "Serviço"}
                    </h3>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold mt-0.5">
                      R$ {parseFloat(app.service?.price || 0).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
                
                {/* Body Card */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center text-slate-700 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="w-9 h-9 rounded-lg bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{app.client?.full_name}</p>
                      <div className="flex items-center mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <Phone className="w-3 h-3 mr-1 text-slate-400" />
                        {formatPhoneNumber(app.client?.phone_number || '')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Clock className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <a 
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm shadow-emerald-500/20"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    Conversar no WhatsApp
                  </a>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleEditAppointment(app)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    {isCanceled ? (
                      <span className="flex items-center justify-center gap-1.5 py-2 px-3 text-rose-500 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/50 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-900/60">
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelado
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleCancelAppointment(app.id)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs cursor-pointer active:scale-95"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Novo Agendamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 to-white dark:from-slate-800 dark:to-slate-900">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Novo Agendamento</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cadastre o cliente e defina o horário</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Nome do Cliente
                </label>
                <input 
                  type="text" 
                  name="client_name" 
                  required 
                  placeholder="Ex: Maria Silva" 
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  WhatsApp com DDD
                </label>
                <input 
                  type="text" 
                  name="client_phone" 
                  required 
                  placeholder="(11) 99999-9999" 
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Serviço Desejado
                </label>
                <select 
                  name="service_id" 
                  required 
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                >
                  <option value="">Selecione o serviço...</option>
                  {availableServices.map(svc => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name} - R$ {parseFloat(svc.price).toFixed(2).replace('.', ',')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Data
                  </label>
                  <input 
                    type="date" 
                    name="date" 
                    required 
                    defaultValue={todayStr}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Horário
                  </label>
                  <input 
                    type="time" 
                    name="time" 
                    required 
                    defaultValue="14:00"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all" 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ backgroundColor: themeColor || '#2563eb' }}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer hover:opacity-90"
                >
                  Salvar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Status */}
      {isEditModalOpen && currentEditApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Editar Status do Agendamento</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cliente: <strong>{currentEditApp.client?.full_name}</strong>
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Status
                </label>
                <select
                  value={currentEditApp.status}
                  onChange={(e) => setCurrentEditApp({ ...currentEditApp, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="PENDING">Pendente</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: themeColor || '#2563eb' }}
                  className="flex-1 py-2 text-xs font-semibold text-white rounded-xl cursor-pointer hover:opacity-90"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
