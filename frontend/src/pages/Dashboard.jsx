import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, User, MessageCircle, Edit2, XCircle, Phone, Plus, X } from 'lucide-react';

export default function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Para nosso teste local, usamos o Basic Auth do admin que criamos no Python
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
  }, []);

  // Formata o número (Ex: 5511999999999 -> +55 (11) 99999-9999)
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
        return <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">Confirmado</span>;
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">Pendente</span>;
      case 'CANCELLED':
        return <span className="bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">Cancelado</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">{status}</span>;
    }
  };

  const handleCreateAppointment = (e) => {
    e.preventDefault();
    // Aqui no futuro faremos o POST para a API do Django
    alert("Agendamento manual criado com sucesso! (Integração com API na próxima etapa)");
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Agendamentos</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie seus horários e clientes</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Novo Agendamento
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-indigo-600 font-medium animate-pulse">Carregando seus horários...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center">
          <Calendar className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-800">Nenhum agendamento encontrado</h3>
          <p className="text-slate-500 mt-2">Você ainda não tem horários marcados para os próximos dias.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {appointments.map(app => {
            const startDate = new Date(app.start_time);
            return (
              <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                {/* Cabeçalho do Card */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 leading-tight mb-1">{app.service.name}</h3>
                    <p className="text-slate-500 text-sm font-medium">R$ {app.service.price}</p>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
                
                {/* Corpo do Card */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <User className="w-5 h-5 mr-3 text-indigo-500" />
                    <div>
                      <p className="font-medium text-sm">{app.client.full_name}</p>
                      <div className="flex items-center mt-0.5 text-xs text-slate-500">
                        <Phone className="w-3 h-3 mr-1" />
                        {formatPhoneNumber(app.client.phone_number)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                      <span className="font-medium">{startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                      <span className="font-medium">{startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                  <a 
                    href={`https://wa.me/${app.client.phone_number.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Enviar Mensagem
                  </a>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-1.5 py-2 px-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors border border-slate-200 hover:border-indigo-200 bg-white shadow-sm">
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button className="flex items-center justify-center gap-1.5 py-2 px-3 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors border border-slate-200 hover:border-rose-200 bg-white shadow-sm">
                      <XCircle className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Novo Agendamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Novo Agendamento</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateAppointment} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente</label>
                <input type="text" required placeholder="Ex: Maria Silva" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                <input type="text" required placeholder="(11) 99999-9999" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Serviço</label>
                <select required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
                  <option value="">Selecione um serviço...</option>
                  <option value="1">Manicure Simples</option>
                  <option value="2">Pedicure</option>
                  <option value="3">Alongamento em Gel</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <input type="date" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                  <input type="time" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors shadow-sm"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
