import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, Clock, User, MessageCircle, Edit2, XCircle, Phone, Plus, X, 
  TrendingUp, CheckCircle2, AlertCircle, Sparkles, Search, DollarSign, Users, ArrowUpRight
} from 'lucide-react';

export default function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchAppointments();
  }, []);

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
      setLoading(false);
    });
  };

  const formatPhoneNumber = (phone) => {
    const cleaned = ('' + phone).replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('55')) {
      return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
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
      alert("✅ Agendamento criado com sucesso!");
    })
    .catch(err => {
      console.error("Erro ao criar agendamento:", err);
      alert("Falha ao criar agendamento. Verifique se o serviço é válido e tente novamente.");
    });
  };

  // Métricas
  const totalAppointments = appointments.length;
  const confirmedCount = appointments.filter(a => a.status === 'CONFIRMED').length;
  const totalRevenue = appointments.reduce((acc, curr) => acc + (parseFloat(curr.service?.price) || 0), 0);

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = 
      app.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.client?.phone_number?.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Hero Header Estilo Landing Page */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          {/* Pill Badge igual Landing Page */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Gestão e Agendamento para Manicures
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Gestão simples para o seu salão <span className="text-emerald-500 underline decoration-emerald-200 underline-offset-4">atender mais.</span>
          </h1>
          <p className="text-slate-600 mt-2 text-sm md:text-base max-w-2xl">
            Acompanhe horários em tempo real, faturamento do dia e deixe o robô do WhatsApp preencher a sua agenda automaticamente.
          </p>
        </div>

        {/* CTA Principal */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all whitespace-nowrap self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Novo Agendamento
        </button>
      </div>

      {/* Grid de Métricas / Cards Inspirados na Landing Page */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Faturamento do Dia (Estilo "Vendas de hoje") */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500">Faturamento Previsto</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <TrendingUp className="w-3.5 h-3.5" />
              +18% vs ontem
            </span>
          </div>

          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            R$ {totalRevenue > 0 ? totalRevenue.toFixed(2).replace('.', ',') : '420,00'}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <p className="text-slate-500 font-medium">Ticket médio</p>
              <p className="font-bold text-slate-900 mt-0.5">R$ 48,20</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <p className="text-slate-500 font-medium">Atendidos</p>
              <p className="font-bold text-slate-900 mt-0.5">{confirmedCount}</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <p className="text-slate-500 font-medium">Capacidade</p>
              <p className="font-bold text-emerald-600 mt-0.5">85%</p>
            </div>
          </div>
        </div>

        {/* Card 2: Entradas x Saídas (Estilo Landing Page Card) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-500">Resumo do Caixa</span>
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
              <span className="font-bold text-emerald-700">R$ 290,00</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50/70 border border-blue-100 px-3 py-2 rounded-xl text-xs">
              <span className="font-medium text-blue-800">→ A Receber (Agendados)</span>
              <span className="font-bold text-blue-700">R$ 130,00</span>
            </div>
          </div>

          {/* Badge Escuro "Saldo do dia" flutuante idêntico à Landing Page */}
          <div className="mt-4 bg-slate-950 text-white rounded-xl p-3.5 flex items-center justify-between shadow-md">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Saldo do dia</p>
              <p className="text-lg font-bold text-white tracking-tight">R$ 340,00</p>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              100% no alvo
            </div>
          </div>
        </div>

        {/* Card 3: Status do WhatsApp e Eficiência */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-500">Automação WhatsApp</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Bot Ativo
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              3s tempo de resposta
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Clientes são respondidos no WhatsApp instantaneamente mesmo fora do expediente.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Agendamentos automáticos
              </span>
              <span className="font-bold text-slate-900">92%</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Lembretes automáticos
              </span>
              <span className="font-bold text-slate-900">Ativado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button 
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'ALL' 
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Todos ({appointments.length})
          </button>
          <button 
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'CONFIRMED' 
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Confirmados ({confirmedCount})
          </button>
          <button 
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'PENDING' 
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Pendentes ({appointments.filter(a => a.status === 'PENDING').length})
          </button>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium text-sm">Carregando seus agendamentos...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Nenhum agendamento encontrado</h3>
          <p className="text-slate-500 mt-1 max-w-sm text-sm">
            Nenhum cliente agendado para o filtro atual. Crie um agendamento manual ou envie uma mensagem no WhatsApp com <span className="font-semibold text-slate-800">#agendar</span>.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Agendamento
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredAppointments.map(app => {
            const startDate = new Date(app.start_time);
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
                    href={`https://wa.me/${(app.client?.phone_number || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm shadow-emerald-500/20"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    Conversar no WhatsApp
                  </a>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-1.5 py-2 px-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl text-xs font-semibold transition-colors border border-slate-200 bg-white shadow-2xs">
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button className="flex items-center justify-center gap-1.5 py-2 px-3 text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl text-xs font-semibold transition-colors border border-slate-200 bg-white shadow-2xs">
                      <XCircle className="w-3.5 h-3.5" />
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Novo Agendamento Refatorado com Visual da Lypsyos */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-white">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Novo Agendamento</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cadastre um cliente e defina o horário</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
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
                  Serviço de Manicure
                </label>
                <select 
                  name="service_id" 
                  required 
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white transition-all"
                >
                  <option value="">Selecione o serviço...</option>
                  <option value="682034a4-cd24-4551-847c-8294e6fe1898">💅 Manicure Simples - R$ 35,00</option>
                  <option value="1bc12eb6-8b5f-4047-84c8-cdbf1c6db71f">🦶 Pedicure Simples - R$ 40,00</option>
                  <option value="a8b89082-317c-4a83-aace-0a9d506bffd6">✨ Spa dos Pés e Mãos - R$ 85,00</option>
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
                    defaultValue={new Date().toISOString().split('T')[0]}
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
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
