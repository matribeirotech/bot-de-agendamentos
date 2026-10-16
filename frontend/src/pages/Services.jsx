import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sparkles, Plus, Clock, DollarSign, Check, X, Edit3, 
  Trash2, Tag, CheckCircle2, RefreshCw, Scissors, Store 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SEGMENTS } from '../lib/segmentSeeds';
import { SegmentIconBadge, ServiceIconBadge, ServiceCategoryPill } from '../components/ui/SegmentServiceIcon';
import { LypsyosIconBadge } from '../components/ui/LypsyosIconBadge';
import { Button } from '../components/ui/Button';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const { segment, setSegment, saveUserProfile, businessName, themeColor } = useAppStore();
  const segmentObj = SEGMENTS.find(s => s.id === segment) || SEGMENTS[0];

  useEffect(() => {
    fetchServices();
  }, [segment]);

  const fetchServices = () => {
    const token = btoa('admin:admin');
    axios.get('http://localhost:8000/api/v1/services/', {
      headers: { 'Authorization': `Basic ${token}` }
    })
    .then(res => {
      setServices(res.data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Erro ao carregar serviços:", err);
      setLoading(false);
    });
  };

  // Sincronizar / Redefinir serviços com os padrões do segmento
  const handleSyncSegment = async (targetSegmentId = segment) => {
    setIsSyncing(true);
    const token = btoa('admin:admin');
    const chosenSegObj = SEGMENTS.find(s => s.id === targetSegmentId) || segmentObj;
    try {
      if (targetSegmentId !== segment) {
        setSegment(targetSegmentId);
        saveUserProfile({ segment: targetSegmentId });
      }
      const res = await axios.post('http://localhost:8000/api/v1/services/change_segment/', {
        segment: targetSegmentId
      }, {
        headers: { 'Authorization': `Basic ${token}` }
      });
      setServices(res.data.services);
      setStatusMessage({ 
        type: 'success', 
        text: `Procedimentos sincronizados com o segmento "${chosenSegObj.title}"!` 
      });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      console.error("Erro ao sincronizar segmento:", err);
      setStatusMessage({ type: 'error', text: 'Falha ao sincronizar serviços com o nicho.' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateService = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get('name'),
      duration_minutes: parseInt(formData.get('duration_minutes')),
      price: parseFloat(formData.get('price')),
      is_active: true
    };

    const token = btoa('admin:admin');
    axios.post('http://localhost:8000/api/v1/services/', payload, {
      headers: { 'Authorization': `Basic ${token}` }
    })
    .then(res => {
      setServices(prev => [...prev, res.data]);
      setIsModalOpen(false);
      setStatusMessage({ type: 'success', text: 'Serviço cadastrado com sucesso!' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    })
    .catch(err => {
      console.error("Erro ao criar serviço:", err);
      alert("Erro ao cadastrar serviço.");
    });
  };

  const toggleServiceStatus = (service) => {
    const token = btoa('admin:admin');
    axios.patch(`http://localhost:8000/api/v1/services/${service.id}/`, {
      is_active: !service.is_active
    }, {
      headers: { 'Authorization': `Basic ${token}` }
    })
    .then(res => {
      setServices(prev => prev.map(s => s.id === service.id ? res.data : s));
    })
    .catch(err => console.error(err));
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm("Deseja realmente remover este procedimento?")) return;
    const token = btoa('admin:admin');
    try {
      await axios.delete(`http://localhost:8000/api/v1/services/${serviceId}/`, {
        headers: { 'Authorization': `Basic ${token}` }
      });
      setServices(prev => prev.filter(s => s.id !== serviceId));
      setStatusMessage({ type: 'success', text: 'Procedimento excluído.' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    } catch {
      // Se tiver agendamentos atrelados, desativa para preservar integridade
      toggleServiceStatus({ id: serviceId, is_active: true });
    }
  };

  // Separa serviços ativos dos inativos
  const activeServices = services.filter(s => s.is_active);
  const inactiveServices = services.filter(s => !s.is_active);

  return (
    <div className="space-y-8">
      {/* Header Estilo Landing Page Lypsyos / Zenda */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-line dark:border-slate-800">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 text-brand dark:text-blue-300 text-xs font-semibold tracking-wide uppercase mb-3">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor || '#2457f5' }}></span>
            Catálogo de Serviços • {businessName}
          </div>
          <div className="flex items-center gap-3.5">
            <SegmentIconBadge segmentId={segment} size="md" />
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-ink dark:text-white tracking-tight leading-tight break-words">
              Seus Procedimentos & <span className="text-growth">Valores</span>
            </h1>
          </div>
          <p className="text-ink-soft dark:text-slate-400 mt-2 text-sm md:text-base max-w-2xl break-words">
            Configure o cardápio de serviços que o robô do WhatsApp oferece automaticamente para os seus clientes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-start md:self-auto w-full sm:w-auto">
          {/* Botão de Sincronizar Procedimentos do Nicho */}
          <Button
            onClick={() => handleSyncSegment(segment)}
            disabled={isSyncing}
            variant="outline"
            size="md"
            className="w-full sm:w-auto"
            title="Atualiza os serviços padrão para o segmento configurado no seu perfil"
          >
            <RefreshCw className={`w-4 h-4 text-brand dark:text-blue-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? "Sincronizando..." : `Sincronizar ${segmentObj.title.split('&')[0]}`}</span>
          </Button>

          <Button 
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            size="md"
            style={{ backgroundColor: themeColor || '#2457f5' }}
            className="w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span>Novo Procedimento</span>
          </Button>
        </div>
      </div>

      {/* Seletor Visual de Segmento com Ícones Neurais Proprietários */}
      <div className="bg-surface dark:bg-slate-900 border border-line dark:border-slate-800 rounded-3xl p-5 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-sm font-bold text-ink dark:text-white flex items-center gap-2">
              <span>Nicho Ativo:</span>
              <span className="text-brand dark:text-blue-400">{segmentObj.title}</span>
            </h2>
            <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
              Toque em um segmento abaixo para carregar automaticamente o catálogo ideal para o seu espaço:
            </p>
          </div>
          <span className="bg-growth-soft dark:bg-emerald-950/60 text-growth-text dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
            {activeServices.length} serviços ativos no robô
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SEGMENTS.map((seg) => {
            const isSelected = seg.id === segment;
            return (
              <button
                key={seg.id}
                type="button"
                disabled={isSyncing}
                onClick={() => handleSyncSegment(seg.id)}
                className={`group text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3 cursor-pointer min-w-0 ${
                  isSelected
                    ? 'border-brand bg-brand-soft/60 dark:bg-blue-950/40 dark:border-blue-500 shadow-sm ring-2 ring-brand/15'
                    : 'border-line dark:border-slate-800 bg-canvas/60 dark:bg-slate-800/40 hover:border-brand/40 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <SegmentIconBadge segmentId={seg.id} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-heading text-xs font-bold text-ink dark:text-white truncate">
                      {seg.title.split('&')[0].trim()}
                    </p>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-growth shrink-0 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[10px] text-ink-muted dark:text-slate-400 truncate mt-0.5">
                    {seg.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mensagem de Feedback */}
      {statusMessage.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Grid de Serviços */}
      {loading ? (
        <div className="bg-surface dark:bg-slate-900 rounded-2xl border border-line dark:border-slate-800 p-16 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand/30 border-t-brand rounded-full animate-spin mb-4"></div>
          <p className="text-ink-soft dark:text-slate-400 font-medium text-sm">Carregando serviços cadastrados...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-12 md:p-16 text-center flex flex-col items-center justify-center shadow-soft">
          <div className="mb-4">
            <SegmentIconBadge segmentId={segment} size="xl" />
          </div>
          <h3 className="font-heading text-xl font-bold text-ink dark:text-white">Nenhum serviço cadastrado</h3>
          <p className="text-ink-soft dark:text-slate-400 mt-1 max-w-sm text-sm">
            Clique no botão abaixo para carregar os serviços padrão de {segmentObj.title} ou crie um manualmente.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button 
              onClick={() => handleSyncSegment(segment)}
              variant="primary"
              size="md"
              style={{ backgroundColor: themeColor || '#2457f5' }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Carregar Serviços de {segmentObj.title.split('&')[0]}</span>
            </Button>
            <Button 
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              size="md"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Manual</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Ordena serviços ativos primeiro */}
          {[...activeServices, ...inactiveServices].map(svc => (
            <div 
              key={svc.id} 
              className={`group min-w-0 bg-surface dark:bg-slate-900 rounded-3xl border transition-all duration-300 p-6 flex flex-col justify-between shadow-soft hover:shadow-lift hover:-translate-y-0.5 ${
                svc.is_active 
                  ? 'border-line dark:border-slate-800 hover:border-brand/30' 
                  : 'border-line/60 dark:border-slate-800/60 opacity-60 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div>
                {/* Topo do Card com Ícone Neural do Procedimento + Status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ServiceIconBadge serviceName={svc.name} segmentId={segment} size="lg" />
                    <div className="min-w-0">
                      <ServiceCategoryPill serviceName={svc.name} segmentId={segment} className="mb-1.5" />
                      <h3 className="font-heading text-base sm:text-lg font-bold text-ink dark:text-white leading-snug break-words">
                        {svc.name}
                      </h3>
                    </div>
                  </div>

                  <button 
                    onClick={() => toggleServiceStatus(svc)}
                    className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      svc.is_active 
                        ? 'bg-growth-soft dark:bg-emerald-950/60 text-growth-text dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {svc.is_active ? '● Ativo' : '○ Pausado'}
                  </button>
                </div>

                {/* Valor em Destaque */}
                <div className="flex items-baseline justify-between mb-4 pt-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-slate-500">
                    Investimento
                  </span>
                  <div className="font-heading text-2xl font-extrabold text-growth dark:text-emerald-400 tracking-tight">
                    R$ {parseFloat(svc.price).toFixed(2).replace('.', ',')}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs font-medium text-ink-soft dark:text-slate-300 bg-canvas dark:bg-slate-800/60 p-3 rounded-2xl border border-line/70 dark:border-slate-700/60 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand dark:text-blue-400 shrink-0" />
                    <span>Duração: <strong className="text-ink dark:text-white">{svc.duration_minutes} min</strong></span>
                  </div>
                  <span className="text-[11px] font-semibold text-growth-text dark:text-emerald-400">
                    ⚡ Auto-agenda
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button 
                  onClick={() => toggleServiceStatus(svc)}
                  className="text-brand dark:text-blue-400 hover:text-brand-hover dark:hover:text-blue-300 font-semibold cursor-pointer"
                >
                  {svc.is_active ? 'Desativar no Bot' : 'Reativar no Bot'}
                </button>

                <button
                  onClick={() => handleDeleteService(svc.id)}
                  title="Excluir procedimento"
                  className="p-1.5 text-slate-400 hover:text-danger dark:hover:text-rose-400 rounded-lg hover:bg-danger-soft/50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Serviço */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 to-white dark:from-slate-800 dark:to-slate-900">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Novo Procedimento</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Defina o nome, duração e valor cobrado</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateService} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Nome do Procedimento
                </label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder={segment === 'barbearia' ? 'Ex: Corte Degradê Navalhado' : 'Ex: Manicure e Esmaltação'}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Preço (R$)
                  </label>
                  <input 
                    type="number" 
                    step="0.50" 
                    name="price" 
                    required 
                    placeholder="45.00" 
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Duração (min)
                  </label>
                  <input 
                    type="number" 
                    step="5" 
                    name="duration_minutes" 
                    required 
                    defaultValue="45" 
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium" 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ backgroundColor: themeColor || '#2563eb' }}
                  className="flex-1 py-3 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer hover:opacity-90"
                >
                  Salvar Procedimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
