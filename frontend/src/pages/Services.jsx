import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Clock,
  X,
  Edit3,
  Trash2,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SEGMENTS } from '../lib/segmentSeeds';
import {
  SegmentIconBadge,
  ServiceIconBadge,
  ServiceCategoryPill,
} from '../components/ui/SegmentServiceIcon';
import { Button } from '../components/ui/Button';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showSegmentPicker, setShowSegmentPicker] = useState(false);
  const [confirmSyncSeg, setConfirmSyncSeg] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const { segment, setSegment, saveUserProfile, themeColor } = useAppStore();
  const safeSegment = segment || 'manicure';
  const segmentObj = SEGMENTS.find((s) => s.id === safeSegment) || SEGMENTS[0];

  const showToast = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 3500);
  };

  useEffect(() => {
    fetchServices();
  }, [safeSegment]);

  const fetchServices = () => {
    const token = btoa('admin:admin');
    axios
      .get('http://localhost:8000/api/v1/services/', {
        headers: { Authorization: `Basic ${token}` },
      })
      .then((res) => {
        setServices(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const executeSyncSegment = async (targetSegmentId) => {
    setConfirmSyncSeg(null);
    setShowSegmentPicker(false);
    setIsSyncing(true);
    const token = btoa('admin:admin');
    const chosenSegObj = SEGMENTS.find((s) => s.id === targetSegmentId) || segmentObj;

    try {
      if (targetSegmentId !== safeSegment) {
        setSegment(targetSegmentId);
        saveUserProfile({ segment: targetSegmentId });
      }
      const res = await axios.post(
        'http://localhost:8000/api/v1/services/change_segment/',
        { segment: targetSegmentId },
        { headers: { Authorization: `Basic ${token}` } }
      );
      setServices(res.data.services || []);
      showToast('success', `Cardápio de "${chosenSegObj.title}" carregado!`);
    } catch {
      showToast('error', 'Não foi possível carregar os serviços padrão agora.');
    } finally {
      setIsSyncing(false);
    }
  };

  const openCreateModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const openEditModal = (svc) => {
    setEditingService(svc);
    setIsModalOpen(true);
  };

  const handleSaveService = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get('name'),
      duration_minutes: parseInt(formData.get('duration_minutes'), 10),
      price: parseFloat(formData.get('price')),
      is_active: editingService ? editingService.is_active : true,
    };

    const token = btoa('admin:admin');

    if (editingService) {
      axios
        .patch(`http://localhost:8000/api/v1/services/${editingService.id}/`, payload, {
          headers: { Authorization: `Basic ${token}` },
        })
        .then((res) => {
          setServices((prev) =>
            prev.map((s) => (s.id === editingService.id ? res.data : s))
          );
          setIsModalOpen(false);
          setEditingService(null);
          showToast('success', 'Procedimento atualizado!');
        })
        .catch(() => {
          showToast('error', 'Não foi possível salvar a edição.');
        });
    } else {
      axios
        .post('http://localhost:8000/api/v1/services/', payload, {
          headers: { Authorization: `Basic ${token}` },
        })
        .then((res) => {
          setServices((prev) => [...prev, res.data]);
          setIsModalOpen(false);
          showToast('success', 'Novo procedimento adicionado!');
        })
        .catch(() => {
          showToast('error', 'Não foi possível cadastrar o procedimento.');
        });
    }
  };

  const toggleServiceStatus = (service) => {
    const token = btoa('admin:admin');
    axios
      .patch(
        `http://localhost:8000/api/v1/services/${service.id}/`,
        { is_active: !service.is_active },
        { headers: { Authorization: `Basic ${token}` } }
      )
      .then((res) => {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? res.data : s))
        );
      })
      .catch(() => {});
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Deseja remover este procedimento do seu cardápio?')) return;
    const token = btoa('admin:admin');
    try {
      await axios.delete(`http://localhost:8000/api/v1/services/${serviceId}/`, {
        headers: { Authorization: `Basic ${token}` },
      });
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      showToast('success', 'Procedimento removido.');
    } catch {
      toggleServiceStatus({ id: serviceId, is_active: true });
      showToast('success', 'Procedimento pausado (possui agendamentos anteriores).');
    }
  };

  const activeServices = services.filter((s) => s.is_active);
  const inactiveServices = services.filter((s) => !s.is_active);

  return (
    <div className="space-y-6 pb-8 min-w-0">
      {/* Toast Mobile-Safe */}
      {statusMessage.text && (
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:top-auto sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl text-white text-xs sm:text-sm font-semibold animate-in fade-in ${
            statusMessage.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {statusMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
        </div>
      )}

      {/* Cabeçalho Enxuto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-line dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <SegmentIconBadge segmentId={safeSegment} size="md" />
          <div className="min-w-0">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink dark:text-white tracking-tight leading-tight">
              Serviços & <span className="text-growth">Preços</span>
            </h1>
            <p className="text-ink-soft dark:text-slate-400 text-xs sm:text-sm mt-0.5">
              {activeServices.length}{' '}
              {activeServices.length === 1 ? 'opção ativa' : 'opções ativas'} no seu WhatsApp
            </p>
          </div>
        </div>

        <Button
          onClick={openCreateModal}
          variant="primary"
          size="md"
          style={themeColor ? { backgroundColor: themeColor } : undefined}
          className="w-full sm:w-auto min-h-11 font-bold"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Adicionar Serviço</span>
        </Button>
      </div>

      {/* BARRA COMPACTA DE RAMO DE ATUAÇÃO (Recolhível para não poluir a tela no celular) */}
      <div className="bg-surface dark:bg-slate-900 border border-line dark:border-slate-800 rounded-2xl p-3.5 sm:px-5 shadow-soft space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs text-ink-soft dark:text-slate-400">Ramo atual:</span>
            <span className="font-heading text-xs sm:text-sm font-bold text-brand dark:text-blue-400 truncate">
              {segmentObj.title}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowSegmentPicker((v) => !v)}
            className="min-h-9 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 text-xs font-semibold text-ink dark:text-slate-200 hover:border-brand/40 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Trocar ramo ou carregar sugestões</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showSegmentPicker ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {showSegmentPicker && (
          <div className="pt-2 border-t border-line/70 dark:border-slate-800 space-y-2.5 animate-in fade-in">
            <p className="text-xs text-ink-soft dark:text-slate-400">
              Escolha um ramo abaixo se quiser carregar uma lista pronta de procedimentos sugeridos:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {SEGMENTS.map((seg) => {
                const isSelected = seg.id === safeSegment;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    disabled={isSyncing}
                    onClick={() => setConfirmSyncSeg(seg)}
                    className={`group text-left p-3 rounded-2xl border transition-all flex items-center gap-2.5 cursor-pointer min-w-0 ${
                      isSelected
                        ? 'border-brand bg-brand-soft/60 dark:bg-blue-950/40 ring-1 ring-brand/20'
                        : 'border-line dark:border-slate-800 bg-canvas/60 dark:bg-slate-800/40 hover:border-brand/40'
                    }`}
                  >
                    <SegmentIconBadge segmentId={seg.id} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-xs font-bold text-ink dark:text-white truncate">
                        {seg.title.split('&')[0].trim()}
                      </p>
                      <p className="text-[10px] text-ink-muted dark:text-slate-400 truncate">
                        {seg.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* LISTA DE SERVIÇOS */}
      {loading ? (
        <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-14 text-center flex flex-col items-center justify-center">
          <div className="w-9 h-9 border-4 border-brand/30 border-t-brand rounded-full animate-spin mb-3" />
          <p className="text-ink-soft dark:text-slate-400 font-medium text-sm">
            Carregando seu cardápio...
          </p>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-10 sm:p-14 text-center flex flex-col items-center justify-center shadow-soft">
          <div className="mb-4">
            <SegmentIconBadge segmentId={safeSegment} size="xl" />
          </div>
          <h3 className="font-heading text-lg sm:text-xl font-bold text-ink dark:text-white">
            Seu cardápio ainda está vazio
          </h3>
          <p className="text-ink-soft dark:text-slate-400 mt-1 max-w-sm text-xs sm:text-sm">
            Carregue sugestões prontas para {segmentObj.title} ou cadastre seu primeiro serviço.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Button
              onClick={() => executeSyncSegment(safeSegment)}
              variant="primary"
              size="md"
              style={themeColor ? { backgroundColor: themeColor } : undefined}
              className="w-full sm:w-auto min-h-11"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Carregar Sugestões de {segmentObj.title.split('&')[0]}</span>
            </Button>
            <Button
              onClick={openCreateModal}
              variant="outline"
              size="md"
              className="w-full sm:w-auto min-h-11"
            >
              <Plus className="w-4 h-4" />
              <span>Criar do Zero</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...activeServices, ...inactiveServices].map((svc) => (
            <div
              key={svc.id}
              className={`group min-w-0 bg-surface dark:bg-slate-900 rounded-3xl border transition-all p-5 flex flex-col justify-between shadow-soft ${
                svc.is_active
                  ? 'border-line dark:border-slate-800 hover:border-brand/30'
                  : 'border-line/60 dark:border-slate-800/60 opacity-65 bg-canvas/60 dark:bg-slate-900/50'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <ServiceIconBadge
                      serviceName={svc.name}
                      segmentId={safeSegment}
                      size="md"
                    />
                    <div className="min-w-0">
                      <ServiceCategoryPill
                        serviceName={svc.name}
                        segmentId={safeSegment}
                        className="mb-1"
                      />
                      <h3 className="font-heading text-base font-bold text-ink dark:text-white leading-snug break-words">
                        {svc.name}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleServiceStatus(svc)}
                    title={svc.is_active ? 'Toque para pausar' : 'Toque para ativar'}
                    className={`shrink-0 min-h-8 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      svc.is_active
                        ? 'bg-growth-soft dark:bg-emerald-950/60 text-growth-text dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : 'bg-canvas dark:bg-slate-800 text-ink-muted dark:text-slate-400 border-line dark:border-slate-700'
                    }`}
                  >
                    {svc.is_active ? '● Ativo' : '○ Pausado'}
                  </button>
                </div>

                {/* Preço e Tempo Limpos e Diretos */}
                <div className="flex items-center justify-between bg-canvas dark:bg-slate-800/60 px-3.5 py-3 rounded-2xl border border-line/60 dark:border-slate-700/60">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft dark:text-slate-300">
                    <Clock className="w-4 h-4 text-brand dark:text-blue-400 shrink-0" />
                    {svc.duration_minutes} min
                  </span>
                  <span className="font-heading text-xl font-extrabold text-growth-text dark:text-emerald-400">
                    R$ {parseFloat(svc.price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Ações: Editar / Ativar-Pausar / Excluir */}
              <div className="pt-3.5 mt-4 border-t border-line/70 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(svc)}
                  className="min-h-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas dark:bg-slate-800 hover:bg-brand-soft/60 text-xs font-bold text-ink dark:text-slate-200 hover:text-brand transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar preço / nome</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteService(svc.id)}
                  title="Excluir serviço"
                  className="size-10 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CRIAR / EDITAR SERVIÇO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-surface dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-200 border border-line dark:border-slate-800">
            <div className="flex justify-between items-center p-5 border-b border-line dark:border-slate-800">
              <div>
                <h3 className="font-heading font-bold text-lg text-ink dark:text-white">
                  {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                </h3>
                <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                  Defina o nome, tempo médio e valor cobrado
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingService(null);
                }}
                className="size-9 inline-flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-canvas dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 mb-1.5">
                  Nome do Serviço
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingService?.name || ''}
                  placeholder={
                    safeSegment === 'barbearia'
                      ? 'Ex: Corte Degradê'
                      : 'Ex: Pé e Mão Completo'
                  }
                  className="w-full min-h-11 px-3.5 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 text-ink dark:text-white rounded-xl focus:outline-none focus:border-brand font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 mb-1.5">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    name="price"
                    required
                    defaultValue={editingService?.price ?? ''}
                    placeholder="45.00"
                    className="w-full min-h-11 px-3.5 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 text-ink dark:text-white rounded-xl focus:outline-none focus:border-brand font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 mb-1.5">
                    Duração (min)
                  </label>
                  <input
                    type="number"
                    step="5"
                    name="duration_minutes"
                    required
                    defaultValue={editingService?.duration_minutes ?? 45}
                    className="w-full min-h-11 px-3.5 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 text-ink dark:text-white rounded-xl focus:outline-none focus:border-brand font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingService(null);
                  }}
                  className="flex-1 min-h-11 py-2.5 border border-line dark:border-slate-700 rounded-xl text-ink-soft dark:text-slate-400 font-semibold text-xs sm:text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: themeColor || '#2457f5' }}
                  className="flex-1 min-h-11 py-2.5 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer hover:opacity-95"
                >
                  {editingService ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO ANTES DE RECARREGAR CATÁLOGO DO RAMO */}
      {confirmSyncSeg && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-line dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-center">
              <SegmentIconBadge segmentId={confirmSyncSeg.id} size="lg" />
            </div>
            <div className="text-center">
              <h3 className="font-heading font-extrabold text-base text-ink dark:text-white">
                Carregar cardápio de {confirmSyncSeg.title}?
              </h3>
              <p className="text-xs text-ink-soft dark:text-slate-400 mt-1 leading-relaxed">
                Isso adiciona as sugestões padrão deste ramo para você personalizar como preferir.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmSyncSeg(null)}
                className="min-h-11 py-2.5 rounded-xl border border-line dark:border-slate-700 text-xs font-semibold text-ink dark:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => executeSyncSegment(confirmSyncSeg.id)}
                style={{ backgroundColor: themeColor || '#2457f5' }}
                className="min-h-11 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer"
              >
                Sim, carregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
