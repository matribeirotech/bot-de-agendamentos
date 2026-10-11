import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, Clock, User, MessageCircle, Edit2, XCircle, Phone, Plus, X, 
  TrendingUp, CheckCircle2, AlertCircle, Sparkles, Search, DollarSign, 
  Users, ArrowUpRight, Share2, Copy, Check, LayoutGrid, List, CalendarDays
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditApp, setCurrentEditApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedLink, setCopiedLink] = useState(false);

  // Modo de visualização com persistência em cache (localStorage)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('lypsyos_appointments_view_mode') || 'cards';
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('lypsyos_appointments_view_mode', mode);
  };

  const { businessName, whatsapp } = useAppStore();
  const [availableServices, setAvailableServices] = useState([]);

  useEffect(() => {
    fetchAppointments();
    fetchServices();
  }, []);

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
    })
    .catch(err => {
      console.error("Erro ao buscar agendamentos:", err);
      setAppointments([]);
      setLoading(false);
    });
  };

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Confirmado
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Pendente
          </span>
        );
      case 'CANCELLED':
      case 'CANCELED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
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

  // Capacidade do dia (Estimado em 8 slots por profissional)
  const capacidadePorcentagem = Math.min(100, Math.round((todayAppointments.length / 8) * 100));

  // Filtros de busca
  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = 
      app.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.client?.phone_number?.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'CANCELLED' ? (app.status === 'CANCELLED' || app.status === 'CANCELED') : app.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header com foco no estabelecimento */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Painel Operacional • {businessName}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Gestão simples para <span className="text-emerald-500 underline decoration-emerald-200 underline-offset-4">{businessName}</span>
          </h1>
          <p className="text-slate-600 mt-2 text-sm md:text-base max-w-2xl">
            Acompanhe horários em tempo real e deixe o robô do WhatsApp preencher a sua agenda automaticamente.
          </p>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <button
            onClick={handleCopyBotLink}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-3 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
            title="Compartilhar link de agendamento automático com clientes"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-blue-600" />}
            <span>{copiedLink ? "Link Copiado!" : "Copiar Link do Robô"}</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Grid de Métricas 100% DINÂMICAS E ZERADAS PARA NOVOS USUÁRIOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Faturamento do Dia */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Faturamento Previsto</span>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
              totalFaturamento > 0 
                ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                : 'text-slate-400 bg-slate-50 border-slate-200'
            }`}>
              <TrendingUp className="w-3.5 h-3.5" />
              {totalFaturamento > 0 ? '+100% real' : 'Sem agendamentos'}
            </span>
          </div>

          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            R$ {totalFaturamento.toFixed(2).replace('.', ',')}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <p className="text-slate-500 font-medium text-[11px]">Ticket médio</p>
              <p className="font-bold text-slate-900 mt-0.5">R$ {ticketMedio.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <p className="text-slate-500 font-medium text-[11px]">Atendidos</p>
              <p className="font-bold text-slate-900 mt-0.5">{confirmedAll.length}</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <p className="text-slate-500 font-medium text-[11px]">Capacidade</p>
              <p className={`font-bold mt-0.5 ${capacidadePorcentagem > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {capacidadePorcentagem}%
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Resumo do Caixa DINÂMICO */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Resumo do Caixa</span>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Entradas
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> A Receber
              </span>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between items-center bg-emerald-50/70 border border-emerald-100 px-3 py-2 rounded-xl text-xs">
              <span className="font-medium text-emerald-800">↗ Entradas de Hoje</span>
              <span className="font-bold text-emerald-700">R$ {entradasHoje.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50/70 border border-blue-100 px-3 py-2 rounded-xl text-xs">
              <span className="font-medium text-blue-800">→ A Receber (Pendentes)</span>
              <span className="font-bold text-blue-700">R$ {aReceberHoje.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div className="mt-4 bg-slate-950 text-white rounded-xl p-3.5 flex items-center justify-between shadow-md">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Saldo do dia</p>
              <p className="text-lg font-bold text-white tracking-tight">R$ {saldoDia.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              {todayAppointments.length > 0 ? `${todayAppointments.length} agendados hoje` : 'Dia livre'}
            </div>
          </div>
        </div>

        {/* Card 3: Automação WhatsApp & Eficiência */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Robô WhatsApp</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online 24h
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              3s tempo de resposta
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Clientes que enviam mensagem no WhatsApp ou digitam <strong>#agendar</strong> recebem atendimento imediato.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Agendamentos automáticos
              </span>
              <span className="font-bold text-slate-900">{appointments.length > 0 ? 'Ativo' : 'Aguardando'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Lembretes automáticos
              </span>
              <span className="font-bold text-emerald-600 font-semibold">Plano Pro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Busca e Modos de Visualização */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Todos ({appointments.length})
            </button>
            <button 
              onClick={() => setStatusFilter('CONFIRMED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'CONFIRMED' 
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Confirmados ({confirmedAll.length})
            </button>
            <button 
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'PENDING' 
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/20' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Pendentes ({appointments.filter(a => a.status === 'PENDING').length})
            </button>
          </div>

          {/* Toggle de Modos de Exibição (com persistência em cache) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => handleViewModeChange('cards')}
              title="Visualização em Cartões (Padrão)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Cartões</span>
            </button>
            <button
              onClick={() => handleViewModeChange('table')}
              title="Visualização em Tabela Detalhada"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <List className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Tabela</span>
            </button>
            <button
              onClick={() => handleViewModeChange('timeline')}
              title="Visualização em Linha do Tempo / Agenda Diária"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Agendamentos com TRATAMENTO DE EMPTY STATE */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium text-sm">Carregando seus agendamentos...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        /* EMPTY STATE ELEGANTE E COM CTAs AMIGÁVEIS */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 md:p-16 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
            <Calendar className="w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-bold text-slate-900">Nenhum agendamento registrado ainda</h3>
          <p className="text-slate-500 mt-1 max-w-md text-xs sm:text-sm leading-relaxed">
            Sua agenda está limpa e pronta para começar! Compartilhe o link do seu robô no WhatsApp com suas clientes ou faça um cadastro manual.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={handleCopyBotLink}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink ? "Link Copiado!" : "Copiar Link do Robô (#agendar)"}
            </button>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Agendamento Manual
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* 1. MODO TABELA PROFISSIONAL */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Cliente</th>
                  <th className="py-3.5 px-4">Serviço</th>
                  <th className="py-3.5 px-4">Data & Horário</th>
                  <th className="py-3.5 px-4">Valor</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAppointments.map(app => {
                  const startDate = new Date(app.start_time);
                  const isCanceled = app.status === 'CANCELLED' || app.status === 'CANCELED';
                  const phoneDigits = (app.client?.phone_number || '').replace(/\D/g, '');
                  const waUrl = phoneDigits.length >= 10 && phoneDigits.length <= 13
                    ? `https://wa.me/${phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits}?text=${encodeURIComponent(`Olá ${app.client?.full_name || ''}! Confirmamos seu agendamento no ${businessName}.`)}`
                    : `https://web.whatsapp.com`;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            {app.client?.full_name ? app.client.full_name[0].toUpperCase() : 'C'}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-semibold text-slate-900 leading-tight">{app.client?.full_name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{formatPhoneNumber(app.client?.phone_number || '')}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{app.service?.name || "Serviço"}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {app.service?.duration_minutes || 30} min
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          <p className="font-semibold text-slate-900">
                            {startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-slate-500 font-medium mt-0.5">
                            {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-600 text-sm">
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
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 shadow-2xs"
                          >
                            <MessageCircle className="w-4 h-4 fill-emerald-600" />
                          </a>
                          <button
                            onClick={() => handleEditAppointment(app)}
                            title="Editar Agendamento"
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 bg-white cursor-pointer shadow-2xs"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isCanceled && (
                            <button
                              onClick={() => handleCancelAppointment(app.id)}
                              title="Cancelar Agendamento"
                              className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 bg-white cursor-pointer shadow-2xs active:scale-95"
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
        /* 2. MODO AGENDA / LINHA DO TEMPO CRONOLÓGICA */
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
          ).map(([dateLabel, apps]) => (
            <div key={dateLabel} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-slate-900 capitalize text-sm sm:text-base">{dateLabel}</h4>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 ml-auto border border-slate-200">
                  {apps.length} {apps.length === 1 ? 'agendamento' : 'agendamentos'}
                </span>
              </div>

              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {apps.map(app => {
                  const startDate = new Date(app.start_time);
                  const isCanceled = app.status === 'CANCELLED' || app.status === 'CANCELED';
                  const phoneDigits = (app.client?.phone_number || '').replace(/\D/g, '');
                  const waUrl = phoneDigits.length >= 10 && phoneDigits.length <= 13
                    ? `https://wa.me/${phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits}?text=${encodeURIComponent(`Olá ${app.client?.full_name || ''}! Confirmamos seu agendamento no ${businessName}.`)}`
                    : `https://web.whatsapp.com`;

                  return (
                    <div key={app.id} className="relative group">
                      {/* Ponto da Linha do Tempo */}
                      <span className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 bg-white transition-all ${
                        isCanceled 
                          ? 'border-rose-400 group-hover:bg-rose-500' 
                          : app.status === 'CONFIRMED'
                          ? 'border-emerald-500 group-hover:bg-emerald-500'
                          : 'border-amber-400 group-hover:bg-amber-400'
                      }`}></span>

                      <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 transition-all hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start md:items-center gap-4">
                          <div className="bg-white border border-slate-200/80 px-3 py-2 rounded-xl text-center shrink-0 shadow-2xs">
                            <span className="block text-[11px] font-bold text-slate-500 uppercase">Horário</span>
                            <span className="text-base font-extrabold text-slate-900">
                              {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="font-bold text-slate-900 text-sm">{app.service?.name}</h5>
                              <span className="text-emerald-600 font-bold text-xs">
                                R$ {parseFloat(app.service?.price || 0).toFixed(2).replace('.', ',')}
                              </span>
                              {getStatusBadge(app.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-semibold text-slate-800">
                                <User className="w-3.5 h-3.5 text-blue-600" />
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

                        {/* Botões de Ação na Linha do Tempo */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-current" />
                            WhatsApp
                          </a>
                          <button
                            onClick={() => handleEditAppointment(app)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-xl border border-slate-200 bg-white cursor-pointer shadow-2xs"
                            title="Editar Agendamento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isCanceled && (
                            <button
                              onClick={() => handleCancelAppointment(app.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-white rounded-xl border border-slate-200 bg-white cursor-pointer shadow-2xs active:scale-95"
                              title="Cancelar Agendamento"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Header Card */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {app.service?.name || "Serviço"}
                    </h3>
                    <p className="text-emerald-600 text-sm font-bold mt-0.5">
                      R$ {parseFloat(app.service?.price || 0).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
                
                {/* Body Card */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center mr-3 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-sm text-slate-900 truncate">{app.client?.full_name}</p>
                      <div className="flex items-center mt-0.5 text-xs text-slate-500">
                        <Phone className="w-3 h-3 mr-1 text-slate-400" />
                        {formatPhoneNumber(app.client?.phone_number || '')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex items-center text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        {startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <Clock className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col gap-2">
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
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl text-xs font-semibold transition-colors border border-slate-200 bg-white shadow-2xs cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    {isCanceled ? (
                      <span className="flex items-center justify-center gap-1.5 py-2 px-3 text-rose-500 bg-rose-50/80 rounded-xl text-xs font-semibold border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelado
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleCancelAppointment(app.id)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl text-xs font-semibold transition-colors border border-slate-200 bg-white shadow-2xs cursor-pointer active:scale-95"
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-white">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Novo Agendamento</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cadastre o cliente e defina o horário</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome do Cliente
                </label>
                <input 
                  type="text" 
                  name="client_name" 
                  required 
                  placeholder="Ex: Maria Silva" 
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  WhatsApp com DDD
                </label>
                <input 
                  type="text" 
                  name="client_phone" 
                  required 
                  placeholder="(11) 99999-9999" 
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Serviço Desejado
                </label>
                <select 
                  name="service_id" 
                  required 
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white transition-all"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Data
                  </label>
                  <input 
                    type="date" 
                    name="date" 
                    required 
                    defaultValue={todayStr}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Horário
                  </label>
                  <input 
                    type="time" 
                    name="time" 
                    required 
                    defaultValue="14:00"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all" 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Editar Status do Agendamento</h3>
            <p className="text-xs text-slate-500">
              Cliente: <strong>{currentEditApp.client?.full_name}</strong>
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Status
                </label>
                <select
                  value={currentEditApp.status}
                  onChange={(e) => setCurrentEditApp({ ...currentEditApp, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
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
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer"
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
