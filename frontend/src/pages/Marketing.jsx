import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Send,
  Users,
  Sparkles,
  CheckCircle2,
  Plus,
  Check,
  MessageCircle,
  RefreshCw,
  ChevronDown,
  UserPlus,
  X,
  AlertCircle,
  Clock,
  Smartphone,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SegmentIconBadge } from '../components/ui/SegmentServiceIcon';
import { LypsyosIconBadge } from '../components/ui/LypsyosIconBadge';
import { Button } from '../components/ui/Button';

const CAMPAIGN_TEMPLATES = [
  {
    id: 'week',
    label: '📅 Agenda da semana',
    audience: 'all',
    text: 'Olá, {nome_cliente}! {saudacao} ✨ Passando para avisar que abrimos os horários desta semana no *{estabelecimento}*. Quer garantir o seu horário? Responda *1* para agendar!',
  },
  {
    id: 'today',
    label: '⚡ Horários hoje',
    audience: 'active',
    text: 'Oi, {nome_cliente}! Tudo bem? Liberou um horário especial hoje no *{estabelecimento}* com condição exclusiva. Gostaria de aproveitar? Responda *1* aqui no WhatsApp!',
  },
  {
    id: 'winback',
    label: '💝 Saudade (+30 dias)',
    audience: 'inactive',
    text: 'Oi, {nome_cliente}! {saudacao} 💝 Faz um tempinho que não te vemos aqui no *{estabelecimento}* e separamos horários ótimos para cuidar de você nesta semana. Vamos agendar? Digite *1*!',
  },
  {
    id: 'return',
    label: '✨ Hora da manutenção',
    audience: 'active',
    text: 'Olá, {nome_cliente}! Passando para lembrar do seu retorno no *{estabelecimento}* para manter o resultado sempre impecável ✨. Qual dia fica melhor para você? Responda *1*!',
  },
];

function normalizePhoneDigits(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    digits = `55${digits}`;
  }
  return digits;
}

function formatDisplayPhone(raw) {
  const cleaned = String(raw || '').replace(/\D/g, '');
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
  return raw || '';
}

function getGreetingByHour() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function interpolatePreview(template, fullName, businessName) {
  const cleanName = (fullName || 'Camila').trim();
  const firstName = cleanName.split(/\s+/)[0] || 'Camila';
  const greeting = getGreetingByHour();
  return String(template || '')
    .replace(/\{nome_cliente\}/gi, firstName)
    .replace(/\{primeiro_nome\}/gi, firstName)
    .replace(/\{nome_completo\}/gi, cleanName)
    .replace(/\{estabelecimento\}/gi, businessName || 'Meu Estabelecimento')
    .replace(/\{saudacao\}/gi, greeting);
}

export default function Marketing() {
  const { businessName, segment, themeColor, avatarUrl, whatsapp } = useAppStore();

  const [targetAudience, setTargetAudience] = useState('all');
  const [message, setMessage] = useState(
    `Olá, {nome_cliente}! {saudacao} ✨ Temos horários disponíveis nesta semana no *${businessName || 'nosso espaço'}*. Quer garantir o seu atendimento? Responda *1* para agendar!`
  );

  // Base real de clientes e status do WhatsApp
  const [clients, setClients] = useState([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, inactive: 0 });
  const [workerConnected, setWorkerConnected] = useState(false);
  const [loadingAudience, setLoadingAudience] = useState(true);

  // Seleção manual / números extras para envio ou teste rápido
  const [showRecipientsPanel, setShowRecipientsPanel] = useState(false);
  const [excludedPhones, setExcludedPhones] = useState(() => new Set());
  const [manualRecipients, setManualRecipients] = useState([]);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  // Preferência de envio: 'auto' (automático quando WhatsApp conectado) | 'manual_only' (1 a 1 pelo celular)
  const [dispatchPreference, setDispatchPreference] = useState('auto');

  // Estado de execução do disparo e modal/gaveta de resultados
  const [isDispatching, setIsDispatching] = useState(false);
  const [campaignResult, setCampaignResult] = useState(null);
  const [sentManualMap, setSentManualMap] = useState({});
  const [toast, setToast] = useState({ type: '', text: '' });

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4000);
  };

  const fetchAudienceAndStatus = async () => {
    setLoadingAudience(true);
    try {
      const res = await axios.get('http://localhost:8000/api/v1/bot/marketing/audience/');
      const data = res.data || {};
      const fetchedClients = Array.isArray(data.clients) ? data.clients : [];
      setClients(fetchedClients);
      setCounts(
        data.counts || {
          all: fetchedClients.length,
          active: fetchedClients.filter((c) => c.audience_type === 'active').length,
          inactive: fetchedClients.filter((c) => c.audience_type === 'inactive').length,
        }
      );
      setWorkerConnected(Boolean(data.worker_connected));
    } catch {
      // Fallback caso o endpoint ainda esteja reiniciando: extrai clientes dos agendamentos + status direto
      try {
        const token = btoa('admin:admin');
        const [appsRes, statusRes] = await Promise.allSettled([
          axios.get('http://localhost:8000/api/v1/appointments/', {
            headers: { Authorization: `Basic ${token}` },
          }),
          fetch('http://localhost:3001/status').then((r) => (r.ok ? r.json() : { connected: false })),
        ]);

        if (statusRes.status === 'fulfilled') {
          setWorkerConnected(Boolean(statusRes.value?.connected));
        }

        if (appsRes.status === 'fulfilled' && Array.isArray(appsRes.value.data)) {
          const mapByPhone = new Map();
          const now = Date.now();
          appsRes.value.data.forEach((app) => {
            const digits = normalizePhoneDigits(app.client?.phone_number);
            if (digits.length < 10 || digits.length > 15) return;
            const appTime = app.start_time ? new Date(app.start_time).getTime() : 0;
            const days = appTime ? Math.max(0, Math.floor((now - appTime) / 86400000)) : 999;
            const prev = mapByPhone.get(digits);
            if (!prev || days < prev.days_since_last) {
              const fullName = app.client?.full_name || 'Cliente';
              mapByPhone.set(digits, {
                id: String(app.client?.id || digits),
                full_name: fullName,
                first_name: fullName.split(/\s+/)[0] || 'Cliente',
                phone_number: digits,
                audience_type: days <= 30 ? 'active' : 'inactive',
                days_since_last: days,
              });
            }
          });
          const fallbackList = Array.from(mapByPhone.values());
          setClients(fallbackList);
          setCounts({
            all: fallbackList.length,
            active: fallbackList.filter((c) => c.audience_type === 'active').length,
            inactive: fallbackList.filter((c) => c.audience_type === 'inactive').length,
          });
        }
      } catch {
        // Mantém estado limpo sem erros técnicos para o usuário
      }
    } finally {
      setLoadingAudience(false);
    }
  };

  useEffect(() => {
    fetchAudienceAndStatus();
  }, []);

  // Lista filtrada pelo público escolhido + números adicionados manualmente
  const audienceClients = useMemo(() => {
    if (targetAudience === 'active') {
      return clients.filter((c) => c.audience_type === 'active');
    }
    if (targetAudience === 'inactive') {
      return clients.filter((c) => c.audience_type === 'inactive');
    }
    return clients;
  }, [clients, targetAudience]);

  const effectiveRecipients = useMemo(() => {
    const merged = [];
    const seen = new Set();

    manualRecipients.forEach((m) => {
      if (!excludedPhones.has(m.phone_number) && !seen.has(m.phone_number)) {
        seen.add(m.phone_number);
        merged.push({ ...m, isManual: true });
      }
    });

    audienceClients.forEach((c) => {
      if (!excludedPhones.has(c.phone_number) && !seen.has(c.phone_number)) {
        seen.add(c.phone_number);
        merged.push(c);
      }
    });

    return merged;
  }, [audienceClients, manualRecipients, excludedPhones]);

  const toggleRecipient = (phoneDigits) => {
    setExcludedPhones((prev) => {
      const next = new Set(prev);
      if (next.has(phoneDigits)) {
        next.delete(phoneDigits);
      } else {
        next.add(phoneDigits);
      }
      return next;
    });
  };

  const handleAddQuickRecipient = (e) => {
    if (e) e.preventDefault();
    const digits = normalizePhoneDigits(quickPhone);
    if (digits.length < 12) {
      showToast('error', 'Informe o DDD + número de WhatsApp válido (ex: 11 99999-9999).');
      return;
    }
    const cleanName = (quickName || 'Cliente').trim();
    setManualRecipients((prev) => {
      if (prev.some((item) => item.phone_number === digits)) return prev;
      return [
        {
          id: `manual_${digits}`,
          full_name: cleanName,
          first_name: cleanName.split(/\s+/)[0] || 'Cliente',
          phone_number: digits,
          audience_type: 'manual',
        },
        ...prev,
      ];
    });
    setExcludedPhones((prev) => {
      const next = new Set(prev);
      next.delete(digits);
      return next;
    });
    setQuickName('');
    setQuickPhone('');
    showToast('success', `${cleanName} adicionado(a) à lista de envio!`);
  };

  const handleAddMyOwnNumberForTest = () => {
    const myDigits = normalizePhoneDigits(whatsapp);
    if (myDigits.length < 12) {
      setShowRecipientsPanel(true);
      showToast('error', 'Digite seu número com DDD abaixo para receber uma mensagem de teste.');
      return;
    }
    setManualRecipients((prev) => {
      if (prev.some((item) => item.phone_number === myDigits)) return prev;
      return [
        {
          id: `self_${myDigits}`,
          full_name: 'Meu Teste',
          first_name: 'Teste',
          phone_number: myDigits,
          audience_type: 'manual',
        },
        ...prev,
      ];
    });
    setShowRecipientsPanel(true);
    showToast('success', 'Seu WhatsApp foi incluído na lista para teste!');
  };

  const handleRemoveManualRecipient = (phoneDigits) => {
    setManualRecipients((prev) => prev.filter((item) => item.phone_number !== phoneDigits));
  };

  const insertVariable = (variable) => {
    setMessage((prev) => `${prev}${prev.endsWith(' ') || !prev ? '' : ' '}${variable}`);
  };

  const applyTemplate = (tpl) => {
    setMessage(tpl.text);
    if (tpl.audience) {
      setTargetAudience(tpl.audience);
    }
  };

  const buildLocalFallbackQueue = (recipientsList) => {
    return recipientsList.map((r) => {
      const text = interpolatePreview(message, r.full_name, businessName);
      return {
        name: r.full_name || 'Cliente',
        first_name: r.first_name || 'Cliente',
        phone: r.phone_number,
        message: text,
        wa_link: `https://wa.me/${r.phone_number}?text=${encodeURIComponent(text)}`,
        status: 'pending',
      };
    });
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('error', 'Escreva a mensagem da campanha antes de enviar.');
      return;
    }

    if (effectiveRecipients.length === 0) {
      setShowRecipientsPanel(true);
      showToast('error', 'Adicione ao menos 1 contato ou selecione um público com clientes.');
      return;
    }

    setIsDispatching(true);
    setSentManualMap({});

    const recipientsPayload = effectiveRecipients.map((r) => ({
      full_name: r.full_name,
      phone_number: r.phone_number,
    }));

    const desiredMode = workerConnected && dispatchPreference === 'auto' ? 'auto' : 'manual_only';

    try {
      const res = await axios.post('http://localhost:8000/api/v1/bot/marketing/broadcast/', {
        audience: targetAudience,
        message_template: message,
        business_name: businessName || 'Meu Estabelecimento',
        dispatch_mode: desiredMode,
        recipients: recipientsPayload,
      });

      setCampaignResult(res.data);
      if (res.data?.mode === 'automated') {
        showToast('success', `Disparo concluído! ${res.data.sent_count} mensagem(ns) enviada(s).`);
      }
    } catch (err) {
      const apiErr = err?.response?.data?.error;
      if (apiErr) {
        showToast('error', apiErr);
      } else {
        // Fallback resiliente: monta a fila de envio 1-toque diretamente no celular
        const fallbackQueue = buildLocalFallbackQueue(effectiveRecipients);
        setCampaignResult({
          success: true,
          mode: 'manual_queue',
          worker_connected: false,
          total: fallbackQueue.length,
          sent_count: 0,
          failed_count: 0,
          queue: fallbackQueue,
        });
      }
    } finally {
      setIsDispatching(false);
    }
  };

  const handleOpenManualWhatsApp = (item) => {
    window.open(item.wa_link, '_blank', 'noopener,noreferrer');
    setSentManualMap((prev) => ({ ...prev, [item.phone]: true }));
  };

  const sampleRecipientName = effectiveRecipients[0]?.full_name || 'Camila';
  const previewText = interpolatePreview(message, sampleRecipientName, businessName);

  const manualSentCount = useMemo(() => {
    if (!campaignResult?.queue) return 0;
    return campaignResult.queue.filter(
      (q) => q.status === 'sent' || sentManualMap[q.phone]
    ).length;
  }, [campaignResult, sentManualMap]);

  const nextPendingManualItem = useMemo(() => {
    if (!campaignResult?.queue) return null;
    return campaignResult.queue.find(
      (q) => q.status !== 'sent' && !sentManualMap[q.phone]
    );
  }, [campaignResult, sentManualMap]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8 min-w-0">
      {/* Toast Mobile-Safe (Topo no celular para não cobrir a barra inferior) */}
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

      {/* Cabeçalho Enxuto e Mobile-First */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-line dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <LypsyosIconBadge icon={Send} tone="growth" size="md" />
            <div className="min-w-0">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink dark:text-white tracking-tight leading-tight">
                Disparos no <span className="text-growth">WhatsApp</span>
              </h1>
              <p className="text-ink-soft dark:text-slate-400 text-xs sm:text-sm mt-0.5">
                Divulgue horários vagos, promoções e traga clientes de volta.
              </p>
            </div>
          </div>
        </div>

        {/* Status em Tempo Real do Canal de Disparo */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {workerConnected ? (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-growth-soft dark:bg-emerald-950/60 text-growth-text dark:text-emerald-300 border border-growth/30">
              <span className="w-2 h-2 rounded-full bg-growth animate-pulse" />
              WhatsApp Conectado • Automático
            </span>
          ) : (
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Envio pelo Celular • Conectar QR</span>
            </Link>
          )}

          <button
            type="button"
            onClick={fetchAudienceAndStatus}
            disabled={loadingAudience}
            title="Atualizar lista de clientes"
            className="inline-flex items-center justify-center size-9 rounded-xl border border-line dark:border-slate-800 bg-surface dark:bg-slate-900 text-ink-soft dark:text-slate-400 hover:text-brand transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAudience ? 'animate-spin text-brand' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA PRINCIPAL: COMPOSIÇÃO E PÚBLICO */}
        <form onSubmit={handleSendBroadcast} className="lg:col-span-7 space-y-5 min-w-0">
          {/* PASSO 1: PÚBLICO-ALVO COMPACTO (3 COLUNAS LADO A LADO NO MOBILE) */}
          <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-4 sm:p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300">
                1. Quem vai receber?
              </label>
              <span className="text-xs font-bold text-brand dark:text-blue-400">
                {effectiveRecipients.length}{' '}
                {effectiveRecipients.length === 1 ? 'contato selecionado' : 'contatos selecionados'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                {
                  id: 'all',
                  title: 'Todos',
                  sub: 'Base completa',
                  count: counts.all,
                  icon: Users,
                  activeClass:
                    'border-brand bg-brand-soft/70 dark:bg-blue-950/50 text-brand dark:text-blue-300 ring-2 ring-brand/15',
                },
                {
                  id: 'active',
                  title: 'Recentes',
                  sub: 'Últimos 30 dias',
                  count: counts.active,
                  icon: CheckCircle2,
                  activeClass:
                    'border-growth bg-growth-soft/70 dark:bg-emerald-950/50 text-growth-text dark:text-emerald-300 ring-2 ring-growth/15',
                },
                {
                  id: 'inactive',
                  title: 'Sumidos',
                  sub: '+30 dias sem vir',
                  count: counts.inactive,
                  icon: Clock,
                  activeClass:
                    'border-violet-500 bg-violet-50/80 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 ring-2 ring-violet-500/15',
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = targetAudience === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTargetAudience(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[84px] ${
                      isSelected
                        ? opt.activeClass
                        : 'border-line dark:border-slate-800 bg-canvas/60 dark:bg-slate-800/40 text-ink-soft dark:text-slate-400 hover:bg-surface dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="font-heading text-sm sm:text-base font-extrabold text-ink dark:text-white">
                        {loadingAudience ? '...' : opt.count}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs font-bold text-ink dark:text-white leading-tight truncate">
                        {opt.title}
                      </p>
                      <p className="text-[10px] opacity-80 truncate mt-0.5">{opt.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Gaveta de Contatos e Adição Rápida (Ideal para testar ou enviar para número avulso) */}
            <div className="pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecipientsPanel((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand dark:text-blue-400 hover:underline py-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>
                    {showRecipientsPanel
                      ? 'Ocultar lista de contatos'
                      : 'Ver contatos ou adicionar número avulso'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      showRecipientsPanel ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleAddMyOwnNumberForTest}
                  className="text-[11px] font-semibold text-ink-soft dark:text-slate-400 hover:text-ink dark:hover:text-white bg-canvas dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-line dark:border-slate-700 cursor-pointer"
                >
                  + Testar no meu WhatsApp
                </button>
              </div>

              {showRecipientsPanel && (
                <div className="mt-3 p-3.5 rounded-2xl bg-canvas dark:bg-slate-800/50 border border-line dark:border-slate-800 space-y-3 animate-in fade-in">
                  {/* Adicionar Número Rápido */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      placeholder="Nome (ex: Ana)"
                      className="sm:col-span-4 px-3 py-2.5 min-h-11 text-base sm:text-xs bg-surface dark:bg-slate-900 border border-line dark:border-slate-700 rounded-xl text-ink dark:text-white focus:outline-none focus:border-brand"
                    />
                    <input
                      type="tel"
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      placeholder="WhatsApp com DDD (11 99999-9999)"
                      className="sm:col-span-5 px-3 py-2.5 min-h-11 text-base sm:text-xs bg-surface dark:bg-slate-900 border border-line dark:border-slate-700 rounded-xl text-ink dark:text-white focus:outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={handleAddQuickRecipient}
                      className="sm:col-span-3 min-h-11 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar</span>
                    </button>
                  </div>

                  {/* Lista Selecionável */}
                  {audienceClients.length === 0 && manualRecipients.length === 0 ? (
                    <p className="text-xs text-ink-muted dark:text-slate-400 text-center py-3">
                      Nenhum cliente neste filtro ainda. Adicione um número acima para disparar agora mesmo!
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto divide-y divide-line/60 dark:divide-slate-800 pr-1">
                      {[...manualRecipients, ...audienceClients].map((contact) => {
                        const isChecked = !excludedPhones.has(contact.phone_number);
                        const isManual = contact.audience_type === 'manual';
                        return (
                          <div
                            key={contact.phone_number}
                            className="py-2 flex items-center justify-between gap-2 text-xs"
                          >
                            <label className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleRecipient(contact.phone_number)}
                                className="size-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-ink dark:text-white truncate">
                                  {contact.full_name}
                                  {isManual && (
                                    <span className="ml-1.5 text-[10px] font-bold text-brand bg-brand-soft dark:bg-blue-950 px-1.5 py-0.5 rounded-md">
                                      Avulso
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-ink-muted dark:text-slate-400">
                                  {formatDisplayPhone(contact.phone_number)}
                                </p>
                              </div>
                            </label>

                            {isManual ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveManualRecipient(contact.phone_number)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                                title="Remover número"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-ink-muted dark:text-slate-500 shrink-0">
                                {contact.days_since_last != null
                                  ? contact.days_since_last === 0
                                    ? 'Hoje'
                                    : `há ${contact.days_since_last}d`
                                  : ''}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* PASSO 2: MODELOS RÁPIDOS + EDITOR DE MENSAGEM */}
          <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-4 sm:p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300">
                2. Escolha um modelo ou escreva
              </label>
              <span className="text-[11px] text-ink-muted dark:text-slate-400">
                Personalização automática
              </span>
            </div>

            {/* Pílulas de Modelos Prontos (1 Toque) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {CAMPAIGN_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="shrink-0 px-3 py-2 rounded-xl border border-line dark:border-slate-700 bg-canvas dark:bg-slate-800 hover:border-brand/50 hover:bg-brand-soft/40 text-xs font-semibold text-ink dark:text-slate-200 transition-all cursor-pointer active:scale-95"
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            {/* Editor sem auto-zoom no iPhone (text-base sm:text-sm) */}
            <div className="border border-line dark:border-slate-700 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand transition-all bg-canvas/40 dark:bg-slate-800/40">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
                className="w-full p-4 text-base sm:text-sm border-none focus:outline-none resize-none text-ink dark:text-slate-100 leading-relaxed font-sans bg-transparent"
                placeholder="Digite a mensagem que suas clientes vão receber..."
              />
              <div className="bg-surface dark:bg-slate-900/70 border-t border-line/70 dark:border-slate-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => insertVariable('{nome_cliente}')}
                    className="min-h-8 text-[11px] font-bold bg-brand-soft dark:bg-blue-950/60 text-brand dark:text-blue-300 px-2.5 py-1 rounded-lg border border-brand/20 cursor-pointer active:scale-95"
                  >
                    + Nome da Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable('{estabelecimento}')}
                    className="min-h-8 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-ink-soft dark:text-slate-300 px-2.5 py-1 rounded-lg border border-line dark:border-slate-700 cursor-pointer active:scale-95"
                  >
                    + Nome do Espaço
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable('*1*')}
                    className="min-h-8 text-[11px] font-bold bg-growth-soft dark:bg-emerald-950/60 text-growth-text dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-growth/25 cursor-pointer active:scale-95"
                  >
                    + Responda 1
                  </button>
                </div>
                <span className="text-[11px] text-ink-muted dark:text-slate-500">
                  {message.length} caracteres
                </span>
              </div>
            </div>

            {/* Modo de Envio quando o WhatsApp está conectado */}
            {workerConnected && (
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setDispatchPreference('auto')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dispatchPreference === 'auto'
                      ? 'bg-surface dark:bg-slate-900 text-growth-text dark:text-emerald-400 shadow-xs'
                      : 'text-ink-soft dark:text-slate-400'
                  }`}
                >
                  ⚡ Envio Automático
                </button>
                <button
                  type="button"
                  onClick={() => setDispatchPreference('manual_only')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dispatchPreference === 'manual_only'
                      ? 'bg-surface dark:bg-slate-900 text-brand dark:text-blue-400 shadow-xs'
                      : 'text-ink-soft dark:text-slate-400'
                  }`}
                >
                  📱 Enviar pelo Celular
                </button>
              </div>
            )}

            {/* Botão Principal de Disparo */}
            <Button
              type="submit"
              variant="whatsapp"
              size="lg"
              disabled={isDispatching}
              className="w-full min-h-12 text-sm font-bold shadow-lg"
              style={themeColor ? { backgroundColor: themeColor } : undefined}
            >
              {isDispatching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enviando mensagens no WhatsApp...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {effectiveRecipients.length > 0
                      ? `Enviar no WhatsApp (${effectiveRecipients.length} ${
                          effectiveRecipients.length === 1 ? 'contato' : 'contatos'
                        })`
                      : 'Preparar Envio no WhatsApp'}
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* COLUNA LATERAL: PRÉVIA COMPACTA DA MENSAGEM NO WHATSAPP */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-3">
          <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-4 sm:p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400">
                Como a cliente recebe
              </span>
              <span className="text-[11px] font-semibold text-growth-text dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Exemplo: {sampleRecipientName.split(' ')[0]}
              </span>
            </div>

            {/* Card compacto estilo conversa real do WhatsApp (sem chassi gigante vazio) */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center gap-2.5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={businessName}
                    className="size-8 rounded-full object-cover border border-white/30 shrink-0"
                  />
                ) : (
                  <SegmentIconBadge segmentId={segment || 'manicure'} size="xs" />
                )}
                <div className="min-w-0">
                  <p className="font-bold text-xs leading-tight truncate">
                    {businessName || 'Meu Estabelecimento'}
                  </p>
                  <p className="text-[10px] text-emerald-100">online agora</p>
                </div>
              </div>

              <div className="bg-[#EFEAE2] dark:bg-[#0b141a] p-4">
                <div className="bg-[#DCF8C6] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 p-3.5 rounded-2xl rounded-tr-xs shadow-xs text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {previewText}
                  <div className="text-[10px] text-slate-500 dark:text-emerald-200/80 text-right mt-1.5 font-medium">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-ink-muted dark:text-slate-400 leading-relaxed">
              💡 Cada cliente recebe a mensagem com o próprio nome automaticamente. Quando ela responder{' '}
              <strong className="text-ink dark:text-white">1</strong>, seu robô já inicia o agendamento!
            </p>
          </div>
        </div>
      </div>

      {/* MODAL / BOTTOM SHEET DE DISPARO REAL E FILA 1-TOQUE */}
      {campaignResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface dark:bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-line dark:border-slate-800 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-4 duration-200">
            {/* Header da Gaveta */}
            <div className="p-5 border-b border-line dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-2xl bg-growth-soft dark:bg-emerald-950/60 text-growth-text dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-base text-ink dark:text-white truncate">
                    {campaignResult.mode === 'automated'
                      ? 'Campanha Enviada Automaticamente!'
                      : 'Envio Rápido pelo WhatsApp'}
                  </h3>
                  <p className="text-xs text-ink-soft dark:text-slate-400">
                    {campaignResult.mode === 'automated'
                      ? `${campaignResult.sent_count} de ${campaignResult.total} mensagens entregues`
                      : `${manualSentCount} de ${campaignResult.total} enviados • Toque para abrir cada conversa`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCampaignResult(null)}
                className="size-9 rounded-xl flex items-center justify-center text-ink-muted hover:bg-canvas dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Progresso Visual */}
            <div className="px-5 pt-4 space-y-3">
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-growth transition-all duration-300 rounded-full"
                  style={{
                    width: `${
                      campaignResult.total > 0
                        ? Math.round(
                            ((campaignResult.mode === 'automated'
                              ? campaignResult.sent_count
                              : manualSentCount) /
                              campaignResult.total) *
                              100
                          )
                        : 100
                    }%`,
                  }}
                />
              </div>

              {/* Botão Acelerador: Próximo Contato da Fila */}
              {campaignResult.mode !== 'automated' && nextPendingManualItem && (
                <button
                  type="button"
                  onClick={() => handleOpenManualWhatsApp(nextPendingManualItem)}
                  className="w-full min-h-12 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar agora para {nextPendingManualItem.first_name}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>
              )}
            </div>

            {/* Lista de Destinatários e Status Individual */}
            <div className="p-5 overflow-y-auto divide-y divide-line/70 dark:divide-slate-800 flex-1">
              {(campaignResult.queue || []).map((item) => {
                const isSent = item.status === 'sent' || Boolean(sentManualMap[item.phone]);
                const isFailed = item.status === 'failed';
                return (
                  <div
                    key={item.phone}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-ink dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-ink-muted dark:text-slate-400">
                        {formatDisplayPhone(item.phone)}
                      </p>
                      {isFailed && item.error && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                          Use o botão ao lado para enviar direto pelo celular
                        </p>
                      )}
                    </div>

                    {isSent ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-growth-soft dark:bg-emerald-950/60 text-growth-text dark:text-emerald-400 text-xs font-bold shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        Enviado
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenManualWhatsApp(item)}
                        className="min-h-10 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        <span>Enviar</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rodapé */}
            <div className="p-4 bg-canvas dark:bg-slate-800/50 border-t border-line dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setCampaignResult(null)}
                className="w-full sm:w-auto min-h-11 px-6 py-2.5 rounded-xl bg-ink dark:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
