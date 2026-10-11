import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bot, MessageSquare, Plus, Save, Clock, Sparkles, CheckCircle2, 
  HelpCircle, ChevronRight, ChevronDown, ToggleLeft, ToggleRight, Trash2, 
  Send, Sliders, MapPin, Headphones, LogOut, ShieldCheck, UserCheck, RefreshCw, AlertCircle,
  Calendar
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SEGMENTS } from '../lib/segmentSeeds';

export default function BotConfig() {
  const { businessName, setBusinessName, segment, themeColor } = useAppStore();
  const [activeTab, setActiveTab] = useState('messages'); // 'hours' | 'messages' | 'triggers'
  
  // Toggles de Comportamento
  const [botEnabled, setBotEnabled] = useState(true);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoGreeting, setAutoGreeting] = useState(true);
  const [ignoreSavedContacts, setIgnoreSavedContacts] = useState(false);
  const [outOfOfficeEnabled, setOutOfOfficeEnabled] = useState(false);

  // Gatilhos Numéricos URA (Personalizáveis)
  const [triggerSchedule, setTriggerSchedule] = useState('1');
  const [triggerAttendant, setTriggerAttendant] = useState('2');
  const [triggerLocation, setTriggerLocation] = useState('3');
  const [triggerExit, setTriggerExit] = useState('0');

  // Accordion de Configurações Avançadas
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Mensagens Padrão
  const [greeting, setGreeting] = useState(
    "Olá! 👋 Bem-vindo(a) ao atendimento de *{estabelecimento}*.\n\nComo posso ajudar você hoje?\n\n*{opcao_agendar}* - Iniciar agendamento\n*{opcao_atendente}* - Falar com atendente\n*{opcao_localizacao}* - Endereço & Localização\n*{opcao_sair}* - Finalizar atendimento\n\nDigite o número da opção desejada:"
  );
  const [absenceMessage, setAbsenceMessage] = useState(
    "No momento estamos fora do nosso horário de atendimento. 🌙\n\nNosso horário comercial é de Segunda a Sábado das 09:00 às 19:00. Deixe sua mensagem ou digite *{opcao_agendar}* para agendar um horário para o próximo dia útil!"
  );

  // Status de Salvamento
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ show: false, message: '', type: 'success' });

  // Horários de Atendimento Semanais
  const [businessHours, setBusinessHours] = useState([
    { day: 'Segunda-feira', key: 0, open: true, start: '09:00', end: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Terça-feira', key: 1, open: true, start: '09:00', end: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Quarta-feira', key: 2, open: true, start: '09:00', end: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Quinta-feira', key: 3, open: true, start: '09:00', end: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Sexta-feira', key: 4, open: true, start: '08:30', end: '19:30', breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Sábado', key: 5, open: true, start: '08:00', end: '18:00', breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Domingo', key: 6, open: false, start: '10:00', end: '15:00', breakStart: '', breakEnd: '' },
  ]);

  // Respostas Customizadas (FAQ)
  const [customResponses, setCustomResponses] = useState([
    { id: 1, trigger: "preço", response: "Nossos valores partem de R$ 35,00. Digite *1* para conferir a lista completa de procedimentos!" },
    { id: 2, trigger: "endereço", response: "Ficamos localizados na Rua Principal, 120 - Sala 3. Temos estacionamento no local!" },
    { id: 3, trigger: "pix", response: "Nossa chave PIX é o telefone do salão: (11) 99999-9999. Emitimos comprovante imediato." }
  ]);

  // Estado do Simulador de WhatsApp
  const [simulatorView, setSimulatorView] = useState('schedule'); // 'schedule' | 'attendant' | 'location' | 'exit'
  const [simulatorCustomInput, setSimulatorCustomInput] = useState('');

  // Segmento atual e serviços vinculados
  const currentSegment = SEGMENTS.find(s => s.id === segment) || SEGMENTS[0];

  // Carregar configurações do Backend se disponível
  useEffect(() => {
    axios.get('http://localhost:8000/api/v1/bot/config/')
      .then(res => {
        const data = res.data;
        if (data) {
          if (data.business_name && setBusinessName) {
            setBusinessName(data.business_name);
          }
          if (data.trigger_schedule) setTriggerSchedule(data.trigger_schedule);
          if (data.trigger_attendant) setTriggerAttendant(data.trigger_attendant);
          if (data.trigger_location) setTriggerLocation(data.trigger_location);
          if (data.trigger_exit) setTriggerExit(data.trigger_exit);
          if (data.bot_enabled !== undefined) setBotEnabled(data.bot_enabled);
          if (data.auto_reply_enabled !== undefined) setAutoReplyEnabled(data.auto_reply_enabled);
          if (data.auto_greeting !== undefined) setAutoGreeting(data.auto_greeting);
          if (data.ignore_saved_contacts !== undefined) setIgnoreSavedContacts(data.ignore_saved_contacts);
          if (data.out_of_office_enabled !== undefined) setOutOfOfficeEnabled(data.out_of_office_enabled);
          if (data.greeting_message) setGreeting(data.greeting_message);
          if (data.absence_message) setAbsenceMessage(data.absence_message);
        }
      })
      .catch(err => {
        console.log("Usando configurações locais padrão para o bot:", err.message);
      });
  }, [setBusinessName]);

  const updateHour = (index, field, value) => {
    const updated = [...businessHours];
    updated[index][field] = value;
    setBusinessHours(updated);
  };

  const handleResetTriggers = () => {
    setTriggerSchedule('1');
    setTriggerAttendant('2');
    setTriggerLocation('3');
    setTriggerExit('0');
    setSaveStatus({
      show: true,
      message: 'Gatilhos restaurados para os padrões seguros (1, 2, 3, 0)!',
      type: 'info'
    });
    setTimeout(() => setSaveStatus({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      business_name: businessName,
      bot_enabled: botEnabled,
      auto_reply_enabled: autoReplyEnabled,
      auto_greeting: autoGreeting,
      ignore_saved_contacts: ignoreSavedContacts,
      out_of_office_enabled: outOfOfficeEnabled,
      trigger_schedule: triggerSchedule.trim() || '1',
      trigger_attendant: triggerAttendant.trim() || '2',
      trigger_location: triggerLocation.trim() || '3',
      trigger_exit: triggerExit.trim() || '0',
      greeting_message: greeting,
      absence_message: absenceMessage,
    };

    try {
      await axios.post('http://localhost:8000/api/v1/bot/config/', payload);
      setSaveStatus({
        show: true,
        message: '✅ Configurações do Robô e atalhos salvos com sucesso no Lypsyos!',
        type: 'success'
      });
    } catch (err) {
      console.warn("Salvando localmente devido a falha na API:", err);
      localStorage.setItem('lypsyos_bot_config', JSON.stringify(payload));
      setSaveStatus({
        show: true,
        message: '✅ Configurações salvas e atalhos atualizados localmente!',
        type: 'success'
      });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus({ show: false, message: '', type: 'success' }), 4000);
    }
  };

  // Monta a mensagem de saudação formatada para o simulador
  const renderFormattedGreeting = () => {
    return greeting
      .replace(/{estabelecimento}/g, businessName || 'Nosso Estabelecimento')
      .replace(/{tenant_name}/g, businessName || 'Nosso Estabelecimento')
      .replace(/{opcao_agendar}/g, triggerSchedule || '1')
      .replace(/{opcao_atendente}/g, triggerAttendant || '2')
      .replace(/{opcao_localizacao}/g, triggerLocation || '3')
      .replace(/{opcao_sair}/g, triggerExit || '0');
  };

  // Testa input manual no simulador
  const handleTestSimulatorInput = (e) => {
    e.preventDefault();
    const val = simulatorCustomInput.trim();
    if (!val) return;

    if (val === triggerSchedule) {
      setSimulatorView('schedule');
    } else if (val === triggerAttendant) {
      setSimulatorView('attendant');
    } else if (val === triggerLocation) {
      setSimulatorView('location');
    } else if (val === triggerExit) {
      setSimulatorView('exit');
    } else {
      setSimulatorView('schedule');
    }
    setSimulatorCustomInput('');
  };

  return (
    <div className="space-y-8">
      {/* Toast de Feedback */}
      {saveStatus.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-semibold transition-all transform animate-bounce ${
          saveStatus.type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'
        }`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Header Estilo Landing Page Lypsyos */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold tracking-wide uppercase mb-3">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor || '#2563eb' }}></span>
            Automação WhatsApp & URA Numérica
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Meu <span className="text-emerald-500">Robô Atendente</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm md:text-base max-w-2xl">
            Configure o fluxo de auto-saudação, atalhos numéricos da URA e regras inteligentes de agendamento automático 24h.
          </p>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          style={{ backgroundColor: themeColor || '#2563eb' }}
          className="inline-flex items-center justify-center gap-2.5 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all whitespace-nowrap self-start md:self-auto cursor-pointer disabled:opacity-70 hover:opacity-90"
        >
          {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Sincronizando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Navegação por Abas (Step-by-step UX) */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('messages')}
          style={activeTab === 'messages' ? { backgroundColor: themeColor || '#2563eb' } : {}}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'messages'
              ? 'text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          1. Mensagens e Atalhos (URA)
        </button>
        <button
          onClick={() => setActiveTab('hours')}
          style={activeTab === 'hours' ? { backgroundColor: themeColor || '#2563eb' } : {}}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'hours'
              ? 'text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          2. Horário de Atendimento
        </button>
        <button
          onClick={() => setActiveTab('triggers')}
          style={activeTab === 'triggers' ? { backgroundColor: themeColor || '#2563eb' } : {}}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'triggers'
              ? 'text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          3. Respostas Rápidas (FAQ)
        </button>
      </div>

      {/* Conteúdo das Abas e Simulador */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel Principal */}
        <div className="lg:col-span-2 space-y-6">

          {/* ABA 1: MENSAGENS E ATALHOS (NOVA URA INTELIGENTE) */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              {/* Card de Configuração dos Gatilhos Numéricos */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wide mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Menu Numérico URA
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Atalhos do Menu WhatsApp</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Substitua comandos complicados como <span className="font-mono text-slate-700 dark:text-slate-300">#agendar</span> por dígitos diretos no teclado.
                    </p>
                  </div>
                  <button
                    onClick={handleResetTriggers}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                    title="Restaurar gatilhos para 1, 2, 3 e 0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Restaurar Padrões (1 e 0)
                  </button>
                </div>

                {/* Grid dos 4 Gatilhos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Gatilho 1: Iniciar Agendamento */}
                  <div className="p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-2xl border border-blue-100/80 dark:border-blue-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        Iniciar Agendamento
                      </label>
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={5}
                        value={triggerSchedule}
                        onChange={(e) => setTriggerSchedule(e.target.value)}
                        className="w-16 text-center text-base font-extrabold text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-xl p-2 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                        <span className="font-semibold text-slate-800 dark:text-white">Substitui #agendar:</span> Lista os serviços de <strong className="text-blue-700 dark:text-blue-400">{currentSegment.title}</strong>.
                      </div>
                    </div>
                  </div>

                  {/* Gatilho 0: Finalizar Atendimento */}
                  <div className="p-4 bg-gradient-to-br from-rose-50/50 to-orange-50/30 dark:from-rose-950/30 dark:to-orange-950/20 rounded-2xl border border-rose-100/80 dark:border-rose-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        Finalizar / Sair
                      </label>
                      <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                        Encerramento
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={5}
                        value={triggerExit}
                        onChange={(e) => setTriggerExit(e.target.value)}
                        className="w-16 text-center text-base font-extrabold text-rose-700 dark:text-rose-400 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-700 rounded-xl p-2 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                      />
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                        <span className="font-semibold text-slate-800 dark:text-white">Cancela / Encerra:</span> Reseta a conversa com uma mensagem amigável.
                      </div>
                    </div>
                  </div>

                  {/* Gatilho 2: Falar com Atendente */}
                  <div className="p-4 bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Headphones className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        Falar com Atendente
                      </label>
                      <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        Transbordo
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={5}
                        value={triggerAttendant}
                        onChange={(e) => setTriggerAttendant(e.target.value)}
                        className="w-16 text-center text-base font-extrabold text-slate-800 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 focus:ring-2 focus:ring-slate-400/20 focus:outline-none"
                      />
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        Pausa o robô e direciona para atendimento humano manual.
                      </div>
                    </div>
                  </div>

                  {/* Gatilho 3: Endereço & Localização */}
                  <div className="p-4 bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        Endereço & Localização
                      </label>
                      <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        Informativo
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={5}
                        value={triggerLocation}
                        onChange={(e) => setTriggerLocation(e.target.value)}
                        className="w-16 text-center text-base font-extrabold text-slate-800 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 focus:ring-2 focus:ring-slate-400/20 focus:outline-none"
                      />
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        Informa o endereço do estabelecimento e pontos de referência.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mensagem de Saudação & Variáveis */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Mensagem de Saudação & Menu Principal
                    </label>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      Suporta variáveis: {'{estabelecimento}'}, {'{opcao_agendar}'}
                    </span>
                  </div>
                  <textarea
                    rows={7}
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    className="w-full text-xs p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800 dark:text-slate-100 font-mono leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    💡 O robô substitui automaticamente <code className="bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 px-1 py-0.5 rounded">*{'{opcao_agendar}'}*</code> pelo atalho definido acima (atualmente <strong className="text-slate-800 dark:text-white">*{triggerSchedule}*</strong>).
                  </p>
                </div>
              </div>

              {/* Accordion: Configurações Avançadas de Conversa */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <button
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full p-5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Configurações Avançadas de Conversa</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Auto-saudação no primeiro contato, proteção de agenda pessoal e horário de ausência.
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAdvancedOpen && (
                  <div className="p-6 pt-4 space-y-5 border-t border-slate-100 divide-y divide-slate-100">
                    {/* Toggle: Auto-Greeting */}
                    <div className="pt-2 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                          Auto-Greeting (Saudação Automática no 1º Contato)
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Ao receber qualquer primeira mensagem (ex: "Oi", "Boa tarde", ou áudio), o bot responde imediatamente com a mensagem de saudação e a URA numérica.
                        </p>
                      </div>
                      <button
                        onClick={() => setAutoGreeting(!autoGreeting)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${
                          autoGreeting ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          autoGreeting ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Toggle: Filtro de Privacidade (Ignorar Agenda Pessoal) */}
                    <div className="pt-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          Filtro de Privacidade (Ignorar Agenda Pessoal)
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Se você utiliza seu WhatsApp pessoal para trabalho, o robô <strong className="text-slate-800 dark:text-white">não responde</strong> automaticamente a contatos que já estejam salvos na sua agenda (permanece em silêncio absoluto). Para agendar, o contato salvo precisa digitar explicitamente <code className="bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 px-1 py-0.5 rounded font-mono font-bold">/agendar</code>.
                        </p>
                      </div>
                      <button
                        onClick={() => setIgnoreSavedContacts(!ignoreSavedContacts)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${
                          ignoreSavedContacts ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          ignoreSavedContacts ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Toggle: Modo Ausência Fora de Expediente */}
                    <div className="pt-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-500" />
                          Resposta Automática Fora do Expediente
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Envia a mensagem de ausência durante a noite ou feriados quando o estabelecimento estiver fechado.
                        </p>
                      </div>
                      <button
                        onClick={() => setOutOfOfficeEnabled(!outOfOfficeEnabled)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${
                          outOfOfficeEnabled ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          outOfOfficeEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 2: HORÁRIO DE ATENDIMENTO */}
          {activeTab === 'hours' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Expediente Semanal</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  O bot usa esses horários para nunca agendar clientes em momentos de folga ou durante o almoço.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {businessHours.map((bh, idx) => (
                  <div key={bh.key} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-40">
                      <button
                        onClick={() => updateHour(idx, 'open', !bh.open)}
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          bh.open ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          bh.open ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                      <span className={`text-sm font-semibold ${bh.open ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 line-through'}`}>
                        {bh.day}
                      </span>
                    </div>

                    {bh.open ? (
                      <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Abre:</span>
                          <input 
                            type="time" 
                            value={bh.start}
                            onChange={(e) => updateHour(idx, 'start', e.target.value)}
                            className="bg-transparent font-bold text-slate-800 dark:text-white focus:outline-none"
                          />
                        </div>
                        <span className="text-slate-300 dark:text-slate-600">até</span>
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Fecha:</span>
                          <input 
                            type="time" 
                            value={bh.end}
                            onChange={(e) => updateHour(idx, 'end', e.target.value)}
                            className="bg-transparent font-bold text-slate-800 dark:text-white focus:outline-none"
                          />
                        </div>

                        {/* Pausa Almoço */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl px-2 py-1.5 ml-1">
                          <span className="font-semibold text-blue-700 dark:text-blue-300">Almoço:</span>
                          <input 
                            type="time" 
                            value={bh.breakStart}
                            onChange={(e) => updateHour(idx, 'breakStart', e.target.value)}
                            className="bg-transparent text-blue-900 dark:text-blue-200 font-semibold focus:outline-none w-14"
                          />
                          <span>-</span>
                          <input 
                            type="time" 
                            value={bh.breakEnd}
                            onChange={(e) => updateHour(idx, 'breakEnd', e.target.value)}
                            className="bg-transparent text-blue-900 dark:text-blue-200 font-semibold focus:outline-none w-14"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                        Fechado (O bot avisa que você está de folga)
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Mensagem de Ausência */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Mensagem Automática Fora do Horário Comercial
                </label>
                <textarea
                  rows={3}
                  value={absenceMessage}
                  onChange={(e) => setAbsenceMessage(e.target.value)}
                  className="w-full text-xs p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* ABA 3: RESPOSTAS RÁPIDAS (FAQ) */}
          {activeTab === 'triggers' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Respostas Rápidas (Palavras-Chave)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Quando o cliente mandar essas palavras específicas, o robô responde instantaneamente.
                  </p>
                </div>
                <button 
                  onClick={() => setCustomResponses([...customResponses, { id: Date.now(), trigger: '', response: '' }])}
                  className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold text-xs px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-900/40 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Gatilho
                </button>
              </div>

              <div className="space-y-3">
                {customResponses.map((item, index) => (
                  <div key={item.id} className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900/60">
                          Se o cliente disser:
                        </span>
                        <input
                          type="text"
                          value={item.trigger}
                          placeholder="ex: onde fica, endereço"
                          onChange={(e) => {
                            const updated = [...customResponses];
                            updated[index].trigger = e.target.value;
                            setCustomResponses(updated);
                          }}
                          className="text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg focus:outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => setCustomResponses(customResponses.filter(r => r.id !== item.id))}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={item.response}
                      placeholder="O robô vai responder..."
                      onChange={(e) => {
                        const updated = [...customResponses];
                        updated[index].response = e.target.value;
                        setCustomResponses(updated);
                      }}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Simulador / Preview WhatsApp em Tempo Real (Estilo Lypsyos WhatsApp Dark) */}
        <div>
          <div className="sticky top-6 bg-slate-900 text-white rounded-3xl p-5 shadow-2xl border border-slate-800 space-y-4">
            
            {/* Header do WhatsApp */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-emerald-500/20">
                  {currentSegment.icon || 'L'}
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight flex items-center gap-1.5 text-white">
                    {businessName || 'Meu Estabelecimento'}
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </p>
                  <p className="text-[10px] text-emerald-400 font-medium">Online 24h • URA Ativa</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700">
                Simulador Vivo
              </span>
            </div>

            {/* Balões de conversa WhatsApp (Atualização em Tempo Real) */}
            <div className="space-y-3 text-xs max-h-[460px] overflow-y-auto pr-1">
              
              {/* Balão 1 (Bot): Auto-Greeting + Menu Numérico URA */}
              <div className="bg-slate-800/90 rounded-2xl rounded-tl-none p-3.5 border border-slate-700/60 max-w-[88%] text-slate-200 whitespace-pre-wrap leading-relaxed shadow-sm">
                {renderFormattedGreeting()}
                <div className="text-[9px] text-slate-400 text-right mt-1.5">10:00</div>
              </div>

              {/* Balão 2 (Cliente): Opção Digitada pelo Usuário */}
              <div className="bg-emerald-600 rounded-2xl rounded-tr-none p-2.5 px-3.5 ml-auto max-w-[70%] text-white shadow-md text-right font-medium">
                {simulatorView === 'schedule' && (triggerSchedule || '1')}
                {simulatorView === 'attendant' && (triggerAttendant || '2')}
                {simulatorView === 'location' && (triggerLocation || '3')}
                {simulatorView === 'exit' && (triggerExit || '0')}
                <div className="text-[9px] text-emerald-200 text-right mt-0.5">10:01 ✓✓</div>
              </div>

              {/* Balão 3 (Bot): Resposta Dinâmica Baseada no Gatilho */}
              {simulatorView === 'schedule' && (
                <div className="bg-slate-800/90 rounded-2xl rounded-tl-none p-3.5 border border-slate-700/60 max-w-[90%] text-slate-200 shadow-sm space-y-2">
                  <p className="font-bold text-emerald-400">
                    ✨ Procedimentos Disponíveis em {businessName || 'Nosso Estabelecimento'}:
                  </p>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    {currentSegment.defaultServices.map((svc, idx) => {
                      const letter = String.fromCharCode(65 + idx); // A, B, C, D...
                      return (
                        <div key={idx} className="flex items-center justify-between gap-2 border-b border-slate-700/40 pb-1">
                          <span>
                            <strong className="text-white">*{letter}*</strong> - {svc.name}
                          </span>
                          <span className="text-emerald-300 font-semibold whitespace-nowrap">
                            R$ {svc.price.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1">
                    Digite a letra da opção (ex: <strong className="text-white">*A*</strong>) ou <strong className="text-white">*{triggerExit || '0'}*</strong> para voltar:
                  </p>
                  <div className="text-[9px] text-slate-400 text-right mt-1">10:01</div>
                </div>
              )}

              {simulatorView === 'attendant' && (
                <div className="bg-slate-800/90 rounded-2xl rounded-tl-none p-3.5 border border-slate-700/60 max-w-[88%] text-slate-200 shadow-sm">
                  <p className="text-slate-200 leading-relaxed">
                    Transferindo seu contato para nossa equipe... Um atendente responderá aqui em instantes! 💬
                  </p>
                  <div className="text-[9px] text-slate-400 text-right mt-1.5">10:01</div>
                </div>
              )}

              {simulatorView === 'location' && (
                <div className="bg-slate-800/90 rounded-2xl rounded-tl-none p-3.5 border border-slate-700/60 max-w-[88%] text-slate-200 shadow-sm space-y-1">
                  <p className="font-bold text-emerald-400">📍 Localização & Atendimento:</p>
                  <p className="text-slate-300">{businessName || 'Nosso Estabelecimento'}</p>
                  <p className="text-[11px] text-slate-400">Rua Principal, 120 - Sala 3. Atendimento com hora marcada.</p>
                  <div className="text-[9px] text-slate-400 text-right mt-1.5">10:01</div>
                </div>
              )}

              {simulatorView === 'exit' && (
                <div className="bg-slate-800/90 rounded-2xl rounded-tl-none p-3.5 border border-slate-700/60 max-w-[88%] text-slate-200 shadow-sm">
                  <p className="text-slate-200 leading-relaxed">
                    Atendimento finalizado. Se precisar de algo mais, estamos à disposição! Tenha um ótimo dia! 👋
                  </p>
                  <div className="text-[9px] text-slate-400 text-right mt-1.5">10:01</div>
                </div>
              )}
            </div>

            {/* Barra de Testes Rápidos da URA */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Simular Resposta do Cliente:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setSimulatorView('schedule')}
                  className={`text-[11px] font-bold p-1.5 px-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    simulatorView === 'schedule'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Digitou {triggerSchedule || '1'} (Agendar)
                </button>
                <button
                  onClick={() => setSimulatorView('attendant')}
                  className={`text-[11px] font-bold p-1.5 px-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    simulatorView === 'attendant'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Digitou {triggerAttendant || '2'} (Humano)
                </button>
                <button
                  onClick={() => setSimulatorView('location')}
                  className={`text-[11px] font-bold p-1.5 px-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    simulatorView === 'location'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Digitou {triggerLocation || '3'} (Local)
                </button>
                <button
                  onClick={() => setSimulatorView('exit')}
                  className={`text-[11px] font-bold p-1.5 px-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    simulatorView === 'exit'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Digitou {triggerExit || '0'} (Sair)
                </button>
              </div>

              {/* Mini Campo de Entrada Interativa */}
              <form onSubmit={handleTestSimulatorInput} className="flex items-center gap-1.5 pt-2">
                <input
                  type="text"
                  placeholder="Digite 1, 2, 3 ou 0..."
                  value={simulatorCustomInput}
                  onChange={(e) => setSimulatorCustomInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-xl transition-colors cursor-pointer"
                  title="Testar comando"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
