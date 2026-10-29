import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Bot,
  MessageSquare,
  Plus,
  Save,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Trash2,
  Send,
  Sliders,
  MapPin,
  Headphones,
  LogOut,
  UserCheck,
  RefreshCw,
  Calendar,
  Phone,
  Video,
  MoreVertical,
  Smile,
  RotateCcw,
  BadgeCheck,
  CheckCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SEGMENTS } from '../lib/segmentSeeds';
import { LypsyosIconBadge } from '../components/ui/LypsyosIconBadge';
import { SegmentIconBadge } from '../components/ui/SegmentServiceIcon';
import { Button } from '../components/ui/Button';

export default function BotConfig() {
  const { businessName, setBusinessData, segment, themeColor, avatarUrl } = useAppStore();
  const safeSegment = segment || 'manicure';
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' | 'hours' | 'triggers' | 'simulator'

  // Comportamento do robô
  const [botEnabled, setBotEnabled] = useState(true);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoGreeting, setAutoGreeting] = useState(true);
  const [ignoreSavedContacts, setIgnoreSavedContacts] = useState(false);
  const [outOfOfficeEnabled, setOutOfOfficeEnabled] = useState(false);

  // Opções numéricas do menu
  const [triggerSchedule, setTriggerSchedule] = useState('1');
  const [triggerAttendant, setTriggerAttendant] = useState('2');
  const [triggerLocation, setTriggerLocation] = useState('3');
  const [triggerExit, setTriggerExit] = useState('0');

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const [greeting, setGreeting] = useState(
    'Olá! 👋 Bem-vindo(a) ao atendimento de *{estabelecimento}*.\n\nComo posso ajudar você hoje?\n\n*{opcao_agendar}* - Agendar um horário\n*{opcao_atendente}* - Falar com atendente\n*{opcao_localizacao}* - Endereço e localização\n*{opcao_sair}* - Encerrar conversa\n\nDigite o número da opção desejada:'
  );
  const [absenceMessage, setAbsenceMessage] = useState(
    'No momento estamos fora do nosso horário de atendimento. 🌙\n\nAtendemos de Segunda a Sábado das 09:00 às 19:00. Digite *{opcao_agendar}* se quiser já deixar seu horário reservado!'
  );

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ show: false, message: '', type: 'success' });

  const [businessHours, setBusinessHours] = useState([
    { day: 'Segunda', key: 0, open: true, start: '09:00', end: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Terça', key: 1, open: true, start: '09:00', end: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Quarta', key: 2, open: true, start: '09:00', end: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Quinta', key: 3, open: true, start: '09:00', end: '19:00', breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Sexta', key: 4, open: true, start: '08:30', end: '19:30', breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Sábado', key: 5, open: true, start: '08:00', end: '18:00', breakStart: '12:00', breakEnd: '13:00' },
    { day: 'Domingo', key: 6, open: false, start: '10:00', end: '15:00', breakStart: '', breakEnd: '' },
  ]);

  const [customResponses, setCustomResponses] = useState([
    { id: 1, trigger: 'preço', response: 'Nossos procedimentos partem de R$ 35,00. Digite *1* para ver todas as opções e valores!' },
    { id: 2, trigger: 'endereço', response: 'Atendemos com hora marcada! Digite *3* para receber nossa localização completa.' },
    { id: 3, trigger: 'pix', response: 'Aceitamos PIX, cartão e dinheiro no dia do seu atendimento.' },
  ]);

  // Simulador interativo em tempo real
  const [chatMessages, setChatMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [simulatorCustomInput, setSimulatorCustomInput] = useState('');
  const [simStep, setSimStep] = useState('IDLE');
  const [simSelectedService, setSimSelectedService] = useState(null);
  const [simSelectedDate, setSimSelectedDate] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => new Date().toISOString().split('T')[0]);
  const chatScrollRef = useRef(null);

  const currentSegment = SEGMENTS.find((s) => s.id === safeSegment) || SEGMENTS[0];

  useEffect(() => {
    axios
      .get('http://localhost:8000/api/v1/bot/config/')
      .then((res) => {
        const data = res.data;
        if (data) {
          if (data.business_name && setBusinessData) {
            setBusinessData({ businessName: data.business_name });
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
      .catch(() => {});
  }, [setBusinessData]);

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
      message: 'Opções restauradas para o padrão (1, 2, 3 e 0)!',
      type: 'info',
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
    } catch {
      localStorage.setItem('lypsyos_bot_config', JSON.stringify(payload));
    } finally {
      setSaving(false);
      setSaveStatus({
        show: true,
        message: 'Alterações salvas com sucesso!',
        type: 'success',
      });
      setTimeout(() => setSaveStatus({ show: false, message: '', type: 'success' }), 3500);
    }
  };

  const renderFormattedGreeting = () => {
    return greeting
      .replace(/{estabelecimento}/g, businessName || 'Nosso Espaço')
      .replace(/{tenant_name}/g, businessName || 'Nosso Espaço')
      .replace(/{opcao_agendar}/g, triggerSchedule || '1')
      .replace(/{opcao_atendente}/g, triggerAttendant || '2')
      .replace(/{opcao_localizacao}/g, triggerLocation || '3')
      .replace(/{opcao_sair}/g, triggerExit || '0');
  };

  const getGreetingQuickReplies = () => [
    { id: triggerSchedule || '1', label: `📅 ${triggerSchedule || '1'} — Agendar` },
    { id: triggerAttendant || '2', label: `👤 ${triggerAttendant || '2'} — Atendente` },
    { id: triggerLocation || '3', label: `📍 ${triggerLocation || '3'} — Endereço` },
    { id: triggerExit || '0', label: `🚪 ${triggerExit || '0'} — Sair` },
  ];

  useEffect(() => {
    setSimStep('IDLE');
    setSimSelectedService(null);
    setSimSelectedDate(null);
    setChatMessages([
      {
        id: 1,
        sender: 'bot',
        text: renderFormattedGreeting(),
        time: '10:00',
        quickReplies: getGreetingQuickReplies(),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessName, greeting, triggerSchedule, triggerAttendant, triggerLocation, triggerExit]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isBotTyping]);

  const handleSendSimulatorMessage = (rawText) => {
    const text = (rawText || simulatorCustomInput).trim();
    if (!text) return;
    setSimulatorCustomInput('');

    const nowTime = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setChatMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text, time: nowTime }]);
    setIsBotTyping(true);

    setTimeout(() => {
      setIsBotTyping(false);
      const lower = text.toLowerCase().trim();
      const cleanAlpha = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      let reply = '';
      let quickReplies = null;
      let listOptions = null;
      let nextStep = simStep;

      const exitTrigger = (triggerExit || '0').trim().toLowerCase();
      const attendantTrigger = (triggerAttendant || '2').trim().toLowerCase();
      const locationTrigger = (triggerLocation || '3').trim().toLowerCase();
      const scheduleTrigger = (triggerSchedule || '1').trim().toLowerCase();

      if (
        lower === exitTrigger ||
        lower === '0' ||
        lower === 'sair' ||
        lower === 'cancelar' ||
        lower === 'finalizar'
      ) {
        reply =
          'Atendimento encerrado! Se precisar de algo mais, estamos sempre por aqui. Tenha um ótimo dia! 👋';
        nextStep = 'IDLE';
        quickReplies = [{ id: scheduleTrigger, label: '📅 Fazer novo agendamento' }];
      } else if (
        lower === 'menu' ||
        lower === 'início' ||
        lower === 'inicio' ||
        lower === 'voltar' ||
        lower === 'reiniciar'
      ) {
        reply = renderFormattedGreeting();
        nextStep = 'IDLE';
        quickReplies = getGreetingQuickReplies();
      } else if (
        lower === attendantTrigger ||
        lower.includes('atendente') ||
        lower.includes('humano')
      ) {
        reply =
          'Certo! Já avisei nossa equipe e alguém vai te responder por aqui em instantes. 💬';
        nextStep = 'IDLE';
        quickReplies = [{ id: scheduleTrigger, label: '📅 Voltar ao agendamento' }];
      } else if (
        lower === locationTrigger ||
        lower.includes('local') ||
        lower.includes('onde')
      ) {
        reply = `📍 *Nosso Endereço:*\n${
          businessName || 'Nosso Espaço'
        }\nAtendimento com hora marcada! ✨\n\nDigite *${
          triggerSchedule || '1'
        }* para agendar seu horário.`;
        quickReplies = [
          { id: scheduleTrigger, label: '📅 Agendar horário' },
          { id: exitTrigger, label: '🚪 Sair' },
        ];
      } else {
        const services = currentSegment.defaultServices || [];

        if (simStep === 'IDLE') {
          const matchedFaq = customResponses.find(
            (r) => r.trigger && lower.includes(r.trigger.toLowerCase().trim())
          );
          if (lower === scheduleTrigger || lower.includes('agendar') || lower.includes('agenda')) {
            nextStep = 'AWAITING_SERVICE';
            const servicesList = services
              .map((svc, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return `*${letter}* - ${svc.name} (R$ ${svc.price.toFixed(2)})`;
              })
              .join('\n');
            reply = `✨ *Serviços disponíveis em ${
              businessName || 'nosso espaço'
            }:*\n\n${servicesList}\n\nToque no serviço desejado ou digite a letra da opção:`;
            quickReplies = services.map((svc, idx) => ({
              id: String.fromCharCode(65 + idx),
              label: `${String.fromCharCode(65 + idx)} — ${svc.name}`,
            }));
          } else if (matchedFaq) {
            reply = matchedFaq.response;
            quickReplies = getGreetingQuickReplies();
          } else {
            reply = renderFormattedGreeting();
            quickReplies = getGreetingQuickReplies();
          }
        } else if (simStep === 'AWAITING_SERVICE') {
          let matchedSvc = null;
          if (cleanAlpha.length > 0) {
            const firstChar = cleanAlpha[0];
            const letterIdx = firstChar.charCodeAt(0) - 65;
            if (letterIdx >= 0 && letterIdx < services.length) {
              matchedSvc = services[letterIdx];
            } else {
              const numIdx = parseInt(firstChar, 10) - 1;
              if (!isNaN(numIdx) && numIdx >= 0 && numIdx < services.length) {
                matchedSvc = services[numIdx];
              }
            }
          }

          if (matchedSvc) {
            setSimSelectedService(matchedSvc);
            nextStep = 'AWAITING_DATE';
            reply = `Ótima escolha: *${matchedSvc.name}*! ✨\n\n📅 *Para qual data gostaria de agendar?*`;
            quickReplies = [
              { id: 'btn_hoje', label: '📅 Hoje' },
              { id: 'btn_amanha', label: '🌅 Amanhã' },
              { id: 'btn_outra_data', label: '📋 Outra data' },
              { id: 'btn_calendario', label: '🗓️ Escolher no Calendário' },
            ];
          } else {
            nextStep = 'AWAITING_SERVICE';
            reply = `⚠️ Não reconheci essa opção.\n\nPor favor, tente novamente tocando em um dos serviços abaixo ou digitando a letra correspondente (ex: *A*):`;
            quickReplies = services.map((svc, idx) => ({
              id: String.fromCharCode(65 + idx),
              label: `${String.fromCharCode(65 + idx)} — ${svc.name}`,
            }));
          }
        } else if (simStep === 'AWAITING_DATE' || simStep === 'AWAITING_DATE_LIST') {
          const today = new Date();
          const todayFmt = today.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          });
          const tomorrow = new Date();
          tomorrow.setDate(today.getDate() + 1);
          const tomorrowFmt = tomorrow.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          });

          if (
            lower === 'btn_calendario' ||
            lower.includes('calendario') ||
            lower.includes('calendário')
          ) {
            setShowCalendarModal(true);
            reply = '🗓️ Escolha o dia que fica melhor para você no calendário abaixo:';
            quickReplies = [
              { id: 'btn_hoje', label: '📅 Hoje' },
              { id: 'btn_amanha', label: '🌅 Amanhã' },
              { id: 'btn_outra_data', label: '📋 Outra data' },
            ];
          } else if (
            lower === 'hoje' ||
            lower === 'btn_hoje' ||
            (lower === '1' && simStep === 'AWAITING_DATE')
          ) {
            setSimSelectedDate(`Hoje (${todayFmt})`);
            nextStep = 'AWAITING_TIME';
            reply = `Perfeito! Para *Hoje (${todayFmt})* temos estes horários livres:\n\n☀️ *Manhã:* 09:00, 10:30\n⛅ *Tarde:* 14:00, 16:30\n\nQual horário você prefere?`;
            quickReplies = [
              { id: '09:00', label: '☀️ 09:00' },
              { id: '10:30', label: '☀️ 10:30' },
              { id: '14:00', label: '⛅ 14:00' },
              { id: '16:30', label: '⛅ 16:30' },
            ];
          } else if (
            lower === 'amanha' ||
            lower === 'amanhã' ||
            lower === 'btn_amanha' ||
            (lower === '2' && simStep === 'AWAITING_DATE')
          ) {
            setSimSelectedDate(`Amanhã (${tomorrowFmt})`);
            nextStep = 'AWAITING_TIME';
            reply = `Perfeito! Para *Amanhã (${tomorrowFmt})* temos estes horários livres:\n\n☀️ *Manhã:* 09:00, 11:00\n⛅ *Tarde:* 14:00, 15:30\n\nQual horário você prefere?`;
            quickReplies = [
              { id: '09:00', label: '☀️ 09:00' },
              { id: '11:00', label: '☀️ 11:00' },
              { id: '14:00', label: '⛅ 14:00' },
              { id: '15:30', label: '⛅ 15:30' },
            ];
          } else if (
            lower === 'btn_outra_data' ||
            lower === 'outra data' ||
            lower === 'outra' ||
            lower === 'outras'
          ) {
            nextStep = 'AWAITING_DATE_LIST';
            const daysNames = [
              'Domingo',
              'Segunda',
              'Terça',
              'Quarta',
              'Quinta',
              'Sexta',
              'Sábado',
            ];
            const upcomingList = [];
            for (let i = 2; i <= 6; i++) {
              const d = new Date();
              d.setDate(today.getDate() + i);
              const fmt = d.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              });
              upcomingList.push({ id: fmt, label: `${daysNames[d.getDay()]}, ${fmt}` });
            }
            reply = '🗓️ *Próximos dias disponíveis:*\n\nToque no dia desejado abaixo:';
            listOptions = upcomingList;
            quickReplies = [
              { id: 'btn_hoje', label: '📅 Hoje' },
              { id: 'btn_amanha', label: '🌅 Amanhã' },
              { id: 'btn_calendario', label: '🗓️ Abrir Calendário' },
            ];
          } else {
            const dateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})/);
            if (dateMatch) {
              const dStr = `${dateMatch[1].padStart(2, '0')}/${dateMatch[2].padStart(
                2,
                '0'
              )}`;
              setSimSelectedDate(dStr);
              nextStep = 'AWAITING_TIME';
              reply = `Ótimo! Para o dia *${dStr}* temos estes horários livres:\n\n☀️ *Manhã:* 09:30, 11:00\n⛅ *Tarde:* 14:00, 16:00\n\nQual horário você prefere?`;
              quickReplies = [
                { id: '09:30', label: '☀️ 09:30' },
                { id: '11:00', label: '☀️ 11:00' },
                { id: '14:00', label: '⛅ 14:00' },
                { id: '16:00', label: '⛅ 16:00' },
              ];
            } else {
              nextStep = 'AWAITING_DATE';
              reply =
                '⚠️ Não consegui identificar essa data.\n\nPor favor, tente novamente escolhendo uma opção abaixo ou digite o dia e mês (ex: *18/11*):';
              quickReplies = [
                { id: 'btn_hoje', label: '📅 Hoje' },
                { id: 'btn_amanha', label: '🌅 Amanhã' },
                { id: 'btn_outra_data', label: '📋 Outra data' },
                { id: 'btn_calendario', label: '🗓️ Escolher no Calendário' },
              ];
            }
          }
        } else if (simStep === 'AWAITING_TIME') {
          const timeMatch = text.match(/(\d{1,2})[:h](\d{2})?/i);
          if (
            timeMatch ||
            ['09:00', '09:30', '10:30', '11:00', '14:00', '15:30', '16:00', '16:30'].includes(
              text
            )
          ) {
            const chosenTime = text.includes(':')
              ? text
              : timeMatch
              ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2] || '00'}`
              : text;
            nextStep = 'CONFIRMED';
            reply = `🎉 *Agendamento Confirmado!*\n\n✨ *Serviço:* ${
              simSelectedService?.name || 'Procedimento'
            }\n📅 *Data:* ${simSelectedDate || 'Hoje'}\n⏰ *Horário:* ${chosenTime}\n💰 *Valor:* R$ ${(
              simSelectedService?.price || 45
            )
              .toFixed(2)
              .replace('.', ',')}\n📍 *Local:* ${
              businessName || 'Nosso Espaço'
            }\n\nTe esperamos! 💖`;
            quickReplies = [{ id: 'menu', label: '🔄 Testar novo agendamento' }];
          } else {
            nextStep = 'AWAITING_TIME';
            reply =
              '⚠️ Horário não reconhecido.\n\nToque em um dos horários livres abaixo ou digite no formato *14:00*:';
            quickReplies = [
              { id: '09:00', label: '☀️ 09:00' },
              { id: '10:30', label: '☀️ 10:30' },
              { id: '14:00', label: '⛅ 14:00' },
              { id: '16:30', label: '⛅ 16:30' },
            ];
          }
        } else if (simStep === 'CONFIRMED') {
          nextStep = 'IDLE';
          reply = renderFormattedGreeting();
          quickReplies = getGreetingQuickReplies();
        }
      }

      setSimStep(nextStep);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: reply,
          time: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          quickReplies,
          listOptions,
        },
      ]);
    }, 350);
  };

  const handleResetSimulatorChat = () => {
    setSimStep('IDLE');
    setSimSelectedService(null);
    setSimSelectedDate(null);
    setChatMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: renderFormattedGreeting(),
        time: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        quickReplies: getGreetingQuickReplies(),
      },
    ]);
  };

  const renderSimulatorWidget = (isMobileView = false) => (
    <div
      className={
        isMobileView
          ? 'w-full rounded-3xl border border-slate-800 bg-[#0b141a] shadow-xl overflow-hidden relative'
          : 'relative mx-auto w-full max-w-[340px] rounded-[42px] border-[8px] border-slate-950 dark:border-slate-800 bg-[#0b141a] shadow-2xl overflow-hidden'
      }
    >
      {/* Topo estilo WhatsApp */}
      <div className="bg-[#1f2c34] text-white px-3.5 py-3 flex items-center justify-between border-b border-[#2a3942]">
        <div className="flex items-center gap-2.5 min-w-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="size-9 rounded-full object-cover shrink-0 border border-white/20"
            />
          ) : (
            <SegmentIconBadge segmentId={safeSegment} size="xs" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold text-white truncate max-w-[150px]">
                {businessName || 'Meu Espaço'}
              </p>
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </div>
            <p className="text-[10px] text-emerald-400 font-medium">
              {botEnabled ? 'online • responde na hora' : 'atendimento pausado'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-slate-300">
          <button
            type="button"
            onClick={handleResetSimulatorChat}
            title="Recomeçar conversa"
            className="p-1.5 rounded-lg hover:bg-white/10 text-xs font-semibold flex items-center gap-1 text-emerald-400 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[10px]">Reiniciar</span>
          </button>
          <Video className="w-4 h-4 hidden sm:block opacity-70" />
          <Phone className="w-4 h-4 hidden sm:block opacity-70" />
          <MoreVertical className="w-4 h-4 opacity-70" />
        </div>
      </div>

      {/* Conversa */}
      <div
        ref={isMobileView ? undefined : chatScrollRef}
        className="h-[380px] sm:h-[400px] overflow-y-auto p-3 space-y-2.5 text-xs bg-[#0b141a] relative scroll-smooth"
        style={{
          backgroundImage: 'radial-gradient(#182229 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {chatMessages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`p-2.5 px-3 rounded-2xl max-w-[88%] whitespace-pre-wrap leading-relaxed shadow-xs text-xs ${
                  isBot
                    ? 'bg-[#202c33] text-[#e9edef] rounded-tl-xs border border-[#2a3942]/60'
                    : 'bg-[#005c4b] text-[#e9edef] rounded-tr-xs'
                }`}
              >
                {msg.text}

                {msg.quickReplies && (
                  <div className="mt-2.5 pt-2 border-t border-[#2a3942]/80 flex flex-col gap-1.5">
                    {msg.quickReplies.map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => handleSendSimulatorMessage(btn.id)}
                        className="w-full min-h-9 bg-[#182229] hover:bg-[#2a3942] active:scale-[0.98] text-[#53bdeb] hover:text-white border border-[#2a3942] rounded-xl py-2 px-2.5 text-[11px] font-bold text-center transition-all cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}

                {msg.listOptions && (
                  <div className="mt-2.5 pt-2 border-t border-[#2a3942]/80 space-y-1.5">
                    <span className="text-[10px] text-[#8696a0] font-semibold block">
                      📋 Escolha um dia disponível:
                    </span>
                    {msg.listOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSendSimulatorMessage(opt.id)}
                        className="w-full min-h-9 bg-[#182229] hover:bg-[#2a3942] text-white border border-[#2a3942] rounded-xl p-2 text-[11px] font-medium flex items-center justify-between cursor-pointer"
                      >
                        <span>{opt.label}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">
                          Escolher →
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-[9px] text-right mt-1.5 flex items-center justify-end gap-1 text-[#8696a0]">
                  <span>{msg.time}</span>
                  {!isBot && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                </div>
              </div>
            </div>
          );
        })}

        {isBotTyping && (
          <div className="flex items-center gap-1 bg-[#202c33] px-3 py-2 rounded-2xl rounded-tl-xs w-16 border border-[#2a3942]/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      {/* Seletor Visual de Calendário */}
      {showCalendarModal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-40 flex items-end animate-in fade-in duration-200">
          <div className="bg-[#1f2c34] text-white w-full rounded-t-3xl p-4 border-t border-[#2a3942] shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2a3942]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white">Escolher Data no Calendário</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="text-[#8696a0] hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#111b21] p-3 rounded-2xl border border-[#2a3942]">
              <label className="text-[10px] font-bold text-[#8696a0] uppercase block mb-1">
                Selecione o dia desejado
              </label>
              <input
                type="date"
                value={calendarDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setCalendarDate(e.target.value)}
                className="w-full min-h-11 bg-[#202c33] text-white rounded-xl p-2.5 text-base sm:text-xs border border-[#2a3942] focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="flex-1 min-h-10 py-2 rounded-xl bg-[#2a3942] text-[#8696a0] text-xs font-bold cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCalendarModal(false);
                  const [, m, d] = calendarDate.split('-');
                  handleSendSimulatorMessage(`${d}/${m}`);
                }}
                className="flex-1 min-h-10 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Confirmar Dia</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sugestões rápidas */}
      <div className="bg-[#1f2c34] px-2.5 py-2 border-t border-[#2a3942] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => handleSendSimulatorMessage(triggerSchedule || '1')}
          className="px-2.5 py-1 rounded-full bg-[#2a3942] text-[#53bdeb] text-[11px] font-bold shrink-0 cursor-pointer"
        >
          📅 {triggerSchedule || '1'} (Agendar)
        </button>
        <button
          type="button"
          onClick={() => handleSendSimulatorMessage(triggerAttendant || '2')}
          className="px-2.5 py-1 rounded-full bg-[#2a3942] text-emerald-400 text-[11px] font-bold shrink-0 cursor-pointer"
        >
          👤 {triggerAttendant || '2'} (Atendente)
        </button>
        <button
          type="button"
          onClick={() => handleSendSimulatorMessage('preço')}
          className="px-2.5 py-1 rounded-full bg-[#2a3942] text-purple-300 text-[11px] font-bold shrink-0 cursor-pointer"
        >
          💳 Preço
        </button>
      </div>

      {/* Campo de digitação */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendSimulatorMessage();
        }}
        className="bg-[#1f2c34] p-2.5 flex items-center gap-2 border-t border-[#2a3942]"
      >
        <div className="flex-1 flex items-center gap-2 bg-[#2a3942] rounded-full px-3.5 py-2">
          <Smile className="w-4 h-4 text-[#8696a0] shrink-0" />
          <input
            type="text"
            value={simulatorCustomInput}
            onChange={(e) => setSimulatorCustomInput(e.target.value)}
            placeholder="Teste uma mensagem aqui..."
            className="w-full bg-transparent text-white placeholder-[#8696a0] text-base sm:text-xs focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!simulatorCustomInput.trim()}
          className="size-10 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-md"
        >
          <Send className="w-4 h-4 fill-current" />
        </button>
      </form>
    </div>
  );

  return (
    <div className="space-y-6 pb-8 min-w-0">
      {/* Toast Mobile-Safe */}
      {saveStatus.show && (
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:top-auto sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl text-white text-xs sm:text-sm font-semibold animate-in fade-in ${
            saveStatus.type === 'info' ? 'bg-brand' : 'bg-emerald-600'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Cabeçalho com Chave Liga/Desliga do Robô + Botão Salvar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-line dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <LypsyosIconBadge icon={Bot} tone="growth" size="md" />
          <div className="min-w-0">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink dark:text-white tracking-tight leading-tight">
              Meu <span className="text-growth">Robô</span>
            </h1>
            <p className="text-ink-soft dark:text-slate-400 text-xs sm:text-sm mt-0.5">
              Personalize as mensagens, horários de trabalho e dúvidas frequentes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Toggle Rápido Liga / Pausa Robô */}
          <button
            type="button"
            onClick={() => setBotEnabled((v) => !v)}
            className={`min-h-11 inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              botEnabled
                ? 'bg-growth-soft/70 dark:bg-emerald-950/50 border-growth/30 text-growth-text dark:text-emerald-300'
                : 'bg-canvas dark:bg-slate-800 border-line dark:border-slate-700 text-ink-muted dark:text-slate-400'
            }`}
          >
            <span
              className={`size-2.5 rounded-full ${
                botEnabled ? 'bg-growth animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{botEnabled ? 'Robô Ativo' : 'Robô Pausado'}</span>
          </button>

          <Button
            onClick={handleSave}
            disabled={saving}
            variant="primary"
            size="md"
            style={themeColor ? { backgroundColor: themeColor } : undefined}
            className="flex-1 sm:flex-initial min-h-11 font-bold"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <Save className="w-4 h-4 shrink-0" />
            )}
            <span>{saving ? 'Salvando...' : 'Salvar'}</span>
          </Button>
        </div>
      </div>

      {/* Navegação por Abas Compactas (Inclui aba "Testar" exclusiva no celular!) */}
      <div className="grid grid-cols-4 lg:inline-flex items-center gap-1.5 bg-surface dark:bg-slate-900 p-1.5 rounded-2xl border border-line dark:border-slate-800 shadow-soft">
        {[
          { id: 'messages', label: 'Mensagens', icon: MessageSquare, mobileOnly: false },
          { id: 'hours', label: 'Horários', icon: Clock, mobileOnly: false },
          { id: 'triggers', label: 'Dúvidas', icon: Sparkles, mobileOnly: false },
          { id: 'simulator', label: 'Testar', icon: Smartphone, mobileOnly: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={isActive ? { backgroundColor: themeColor || '#2457f5' } : undefined}
              className={`${
                tab.mobileOnly ? 'lg:hidden' : ''
              } min-h-10 flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-ink-soft dark:text-slate-400 hover:bg-canvas dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* PAINEL DE CONFIGURAÇÃO */}
        <div className="min-w-0 lg:col-span-2 space-y-5">
          {/* ABA 1: MENSAGENS E MENU DE OPÇÕES */}
          {activeTab === 'messages' && (
            <div className="space-y-5">
              <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 sm:p-6 shadow-soft space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line/70 dark:border-slate-800">
                  <div>
                    <h3 className="font-heading text-base sm:text-lg font-bold text-ink dark:text-white">
                      Menu de Opções no WhatsApp
                    </h3>
                    <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                      Escolha quais números sua cliente digita para cada opção
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetTriggers}
                    className="min-h-9 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft dark:text-slate-400 bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl px-3 py-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Padrão (1, 2, 3, 0)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 bg-brand-soft/40 dark:bg-blue-950/30 rounded-2xl border border-brand/20 flex items-center gap-3">
                    <input
                      type="text"
                      maxLength={3}
                      value={triggerSchedule}
                      onChange={(e) => setTriggerSchedule(e.target.value)}
                      className="size-12 text-center text-base font-extrabold text-brand dark:text-blue-400 bg-surface dark:bg-slate-800 border border-brand/30 rounded-xl focus:outline-none shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink dark:text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand" />
                        Agendar Horário
                      </p>
                      <p className="text-[11px] text-ink-soft dark:text-slate-400 mt-0.5">
                        Mostra seu cardápio de serviços e horários vagos.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-canvas dark:bg-slate-800/60 rounded-2xl border border-line dark:border-slate-700 flex items-center gap-3">
                    <input
                      type="text"
                      maxLength={3}
                      value={triggerAttendant}
                      onChange={(e) => setTriggerAttendant(e.target.value)}
                      className="size-12 text-center text-base font-extrabold text-ink dark:text-white bg-surface dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl focus:outline-none shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink dark:text-white flex items-center gap-1.5">
                        <Headphones className="w-3.5 h-3.5 text-ink-soft" />
                        Falar com Você
                      </p>
                      <p className="text-[11px] text-ink-soft dark:text-slate-400 mt-0.5">
                        Pausa o robô para atendimento humano direto.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-canvas dark:bg-slate-800/60 rounded-2xl border border-line dark:border-slate-700 flex items-center gap-3">
                    <input
                      type="text"
                      maxLength={3}
                      value={triggerLocation}
                      onChange={(e) => setTriggerLocation(e.target.value)}
                      className="size-12 text-center text-base font-extrabold text-ink dark:text-white bg-surface dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl focus:outline-none shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink dark:text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-ink-soft" />
                        Endereço
                      </p>
                      <p className="text-[11px] text-ink-soft dark:text-slate-400 mt-0.5">
                        Envia o endereço e ponto de referência do espaço.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200/70 dark:border-rose-900/40 flex items-center gap-3">
                    <input
                      type="text"
                      maxLength={3}
                      value={triggerExit}
                      onChange={(e) => setTriggerExit(e.target.value)}
                      className="size-12 text-center text-base font-extrabold text-rose-600 dark:text-rose-400 bg-surface dark:bg-slate-800 border border-rose-200 dark:border-rose-800 rounded-xl focus:outline-none shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink dark:text-white flex items-center gap-1.5">
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        Encerrar Conversa
                      </p>
                      <p className="text-[11px] text-ink-soft dark:text-slate-400 mt-0.5">
                        Finaliza o atendimento com uma despedida cordial.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mensagem de Boas-Vindas */}
                <div className="pt-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300">
                    Mensagem de Boas-Vindas
                  </label>
                  <textarea
                    rows={6}
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    className="w-full text-base sm:text-xs p-3.5 bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 rounded-2xl focus:outline-none focus:border-brand text-ink dark:text-slate-100 leading-relaxed"
                  />
                  <p className="text-[11px] text-ink-muted dark:text-slate-400">
                    💡 O texto <strong>{'{estabelecimento}'}</strong> é trocado automaticamente pelo nome do seu espaço.
                  </p>
                </div>
              </div>

              {/* Preferências extras */}
              <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 shadow-soft overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full p-5 flex items-center justify-between hover:bg-canvas/60 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 bg-brand-soft dark:bg-blue-950/60 rounded-xl flex items-center justify-center text-brand dark:text-blue-400 shrink-0">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink dark:text-white">
                        Preferências de Privacidade
                      </h4>
                      <p className="text-xs text-ink-soft dark:text-slate-400">
                        Boas-vindas automáticas e silêncio para contatos pessoais
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      isAdvancedOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isAdvancedOpen && (
                  <div className="p-5 pt-2 space-y-4 border-t border-line/70 dark:border-slate-800 divide-y divide-line/60 dark:divide-slate-800">
                    <div className="pt-2 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-ink dark:text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-growth" />
                          Boas-vindas automáticas no 1º contato
                        </span>
                        <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                          Responde com o menu assim que uma cliente manda "Oi" ou "Bom dia".
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoGreeting(!autoGreeting)}
                        className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                          autoGreeting ? 'bg-growth' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-5 h-5 rounded-full shadow transform transition-transform ${
                            autoGreeting ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-4 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-ink dark:text-white flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-brand" />
                          Não responder contatos pessoais salvos
                        </span>
                        <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                          Ideal se você usa o mesmo celular para família e amigos: o robô só atende números novos.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIgnoreSavedContacts(!ignoreSavedContacts)}
                        className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                          ignoreSavedContacts ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-5 h-5 rounded-full shadow transform transition-transform ${
                            ignoreSavedContacts ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 2: HORÁRIOS DE ATENDIMENTO */}
          {activeTab === 'hours' && (
            <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 sm:p-6 shadow-soft space-y-5">
              <div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-ink dark:text-white">
                  Dias e Horários de Trabalho
                </h3>
                <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                  O robô respeita sua agenda e nunca marca clientes na sua folga ou almoço.
                </p>
              </div>

              <div className="divide-y divide-line/70 dark:divide-slate-800">
                {businessHours.map((bh, idx) => (
                  <div
                    key={bh.key}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateHour(idx, 'open', !bh.open)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                          bh.open ? 'bg-growth' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                            bh.open ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span
                        className={`text-sm font-bold ${
                          bh.open
                            ? 'text-ink dark:text-white'
                            : 'text-ink-muted dark:text-slate-500 line-through'
                        }`}
                      >
                        {bh.day}
                      </span>
                    </div>

                    {bh.open ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="flex items-center gap-1.5 bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                          <span className="text-ink-muted">Das</span>
                          <input
                            type="time"
                            value={bh.start}
                            onChange={(e) => updateHour(idx, 'start', e.target.value)}
                            className="bg-transparent font-bold text-ink dark:text-white focus:outline-none"
                          />
                          <span className="text-ink-muted">às</span>
                          <input
                            type="time"
                            value={bh.end}
                            onChange={(e) => updateHour(idx, 'end', e.target.value)}
                            className="bg-transparent font-bold text-ink dark:text-white focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 bg-brand-soft/50 dark:bg-blue-950/40 border border-brand/20 rounded-xl px-2.5 py-1.5">
                          <span className="font-semibold text-brand dark:text-blue-300">
                            Almoço:
                          </span>
                          <input
                            type="time"
                            value={bh.breakStart}
                            onChange={(e) => updateHour(idx, 'breakStart', e.target.value)}
                            className="bg-transparent text-ink dark:text-blue-200 font-semibold focus:outline-none"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={bh.breakEnd}
                            onChange={(e) => updateHour(idx, 'breakEnd', e.target.value)}
                            className="bg-transparent text-ink dark:text-blue-200 font-semibold focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-ink-muted dark:text-slate-500 bg-canvas dark:bg-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                        Fechado / Folga
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Aviso Fora do Expediente */}
              <div className="pt-4 border-t border-line/70 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink dark:text-slate-200">
                      Aviso Automático Fora do Horário
                    </label>
                    <p className="text-[11px] text-ink-soft dark:text-slate-400">
                      Envia este recado quando alguém chamar à noite ou em dias fechados
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOutOfOfficeEnabled(!outOfOfficeEnabled)}
                    className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      outOfOfficeEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow transform transition-transform ${
                        outOfOfficeEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={absenceMessage}
                  onChange={(e) => setAbsenceMessage(e.target.value)}
                  className="w-full text-base sm:text-xs p-3.5 bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 rounded-2xl focus:outline-none focus:border-brand text-ink dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* ABA 3: DÚVIDAS FREQUENTES */}
          {activeTab === 'triggers' && (
            <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 sm:p-6 shadow-soft space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading text-base sm:text-lg font-bold text-ink dark:text-white">
                    Respostas para Dúvidas Comuns
                  </h3>
                  <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                    Quando a cliente escrever a palavra-chave, o robô responde na hora.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCustomResponses([
                      ...customResponses,
                      { id: Date.now(), trigger: '', response: '' },
                    ])
                  }
                  className="min-h-10 inline-flex items-center gap-1.5 bg-brand-soft dark:bg-blue-950/50 text-brand dark:text-blue-300 font-bold text-xs px-3.5 py-2 rounded-xl border border-brand/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Nova Resposta
                </button>
              </div>

              <div className="space-y-3">
                {customResponses.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 bg-canvas dark:bg-slate-800/50 rounded-2xl border border-line dark:border-slate-700 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                        <span className="text-[11px] font-bold text-brand dark:text-blue-400 shrink-0">
                          Se a cliente perguntar por:
                        </span>
                        <input
                          type="text"
                          value={item.trigger}
                          placeholder="ex: pix, estacionamento, valor"
                          onChange={(e) => {
                            const updated = [...customResponses];
                            updated[index].trigger = e.target.value;
                            setCustomResponses(updated);
                          }}
                          className="w-full sm:w-56 min-h-10 text-base sm:text-xs font-bold text-ink dark:text-white bg-surface dark:bg-slate-800 border border-line dark:border-slate-700 px-3 py-1.5 rounded-xl focus:outline-none focus:border-brand"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCustomResponses(
                            customResponses.filter((r) => r.id !== item.id)
                          )
                        }
                        className="size-9 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-xl cursor-pointer shrink-0"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={item.response}
                      placeholder="Escreva a resposta que o robô vai enviar..."
                      onChange={(e) => {
                        const updated = [...customResponses];
                        updated[index].response = e.target.value;
                        setCustomResponses(updated);
                      }}
                      className="w-full text-base sm:text-xs p-3 bg-surface dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand text-ink dark:text-slate-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 4 (EXCLUSIVA CELULAR): TESTAR CONVERSA SEM MOLDURA PESADA */}
          {activeTab === 'simulator' && (
            <div className="lg:hidden space-y-3">
              <p className="text-xs text-ink-soft dark:text-slate-400 px-1">
                Toque nos botões abaixo como se fosse uma cliente conversando com seu espaço:
              </p>
              {renderSimulatorWidget(true)}
            </div>
          )}
        </div>

        {/* SIMULADOR LATERAL FIXO (Exibido apenas no Computador lg+) */}
        <div className="hidden lg:block min-w-0 w-full">
          <div className="sticky top-6 space-y-2.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-growth" />
                Teste ao Vivo no WhatsApp
              </span>
            </div>
            {renderSimulatorWidget(false)}
          </div>
        </div>
      </div>
    </div>
  );
}
