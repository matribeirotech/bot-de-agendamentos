import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Bot, MessageSquare, Plus, Save, Clock, Sparkles, CheckCircle2, 
  HelpCircle, ChevronRight, ChevronDown, ToggleLeft, ToggleRight, Trash2, 
  Send, Sliders, MapPin, Headphones, LogOut, ShieldCheck, UserCheck, RefreshCw, AlertCircle,
  Calendar, Phone, Video, MoreVertical, Smile, RotateCcw, BadgeCheck, CheckCheck, Smartphone, X
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SEGMENTS } from '../lib/segmentSeeds';
import { LypsyosIconBadge } from '../components/ui/LypsyosIconBadge';
import { Button } from '../components/ui/Button';

export default function BotConfig() {
  const { businessName, setBusinessName, segment, themeColor, avatarUrl } = useAppStore();
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

  // Estado do Simulador de WhatsApp em Tempo Real com Máquina de Estados
  const [chatMessages, setChatMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [simulatorCustomInput, setSimulatorCustomInput] = useState('');
  const [simStep, setSimStep] = useState('IDLE'); // 'IDLE' | 'AWAITING_SERVICE' | 'AWAITING_DATE' | 'AWAITING_DATE_LIST' | 'AWAITING_TIME' | 'CONFIRMED'
  const [simSelectedService, setSimSelectedService] = useState(null);
  const [simSelectedDate, setSimSelectedDate] = useState(null);
  const [showFlowsModal, setShowFlowsModal] = useState(false);
  const [flowsDate, setFlowsDate] = useState(() => new Date().toISOString().split('T')[0]);
  const chatScrollRef = useRef(null);

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

  const getGreetingQuickReplies = () => [
    { id: triggerSchedule || '1', label: `📅 ${triggerSchedule || '1'} (Agendar)` },
    { id: triggerAttendant || '2', label: `👤 ${triggerAttendant || '2'} (Atendente)` },
    { id: triggerLocation || '3', label: `📍 ${triggerLocation || '3'} (Localização)` },
    { id: triggerExit || '0', label: `🚪 ${triggerExit || '0'} (Sair)` },
  ];

  // Inicializa o chat ou atualiza a saudação inicial em tempo real
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
        quickReplies: getGreetingQuickReplies()
      }
    ]);
  }, [businessName, greeting, triggerSchedule, triggerAttendant, triggerLocation, triggerExit]);

  // Auto-scroll para acompanhar as novas mensagens no smartphone
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isBotTyping]);

  // Envio Interativo de Mensagem no Simulador com Resposta Inteligente e Máquina de Estados
  const handleSendSimulatorMessage = (rawText) => {
    const text = (rawText || simulatorCustomInput).trim();
    if (!text) return;
    setSimulatorCustomInput('');

    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: Date.now(), sender: 'user', text, time: nowTime };
    
    setChatMessages(prev => [...prev, userMsg]);
    setIsBotTyping(true);

    setTimeout(() => {
      setIsBotTyping(false);
      const lower = text.toLowerCase().trim();
      const cleanAlpha = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      let reply = '';
      let quickReplies = null;
      let listOptions = null;
      let nextStep = simStep;

      // 0. Comandos Universais de Finalização / Voltar / Menu
      const exitTrigger = (triggerExit || '0').trim().toLowerCase();
      const attendantTrigger = (triggerAttendant || '2').trim().toLowerCase();
      const locationTrigger = (triggerLocation || '3').trim().toLowerCase();
      const scheduleTrigger = (triggerSchedule || '1').trim().toLowerCase();

      if (lower === exitTrigger || lower === '0' || lower === 'sair' || lower === 'cancelar' || lower === 'finalizar') {
        reply = 'Atendimento finalizado com sucesso! Se precisar de algo mais, estamos à disposição. Tenha um ótimo dia! 👋';
        nextStep = 'IDLE';
        quickReplies = [{ id: scheduleTrigger, label: '📅 Iniciar Novo Agendamento' }];
      } else if (lower === 'menu' || lower === 'início' || lower === 'inicio' || lower === 'voltar' || lower === 'reiniciar') {
        reply = renderFormattedGreeting();
        nextStep = 'IDLE';
        quickReplies = getGreetingQuickReplies();
      } else if (lower === attendantTrigger || lower.includes('atendente') || lower.includes('humano')) {
        reply = 'Transferindo seu contato para nossa equipe... Um atendente responderá aqui em instantes! 💬';
        nextStep = 'IDLE';
        quickReplies = [{ id: scheduleTrigger, label: '📅 Voltar ao Agendamento' }];
      } else if (lower === locationTrigger || lower.includes('local') || lower.includes('onde')) {
        reply = `📍 *Localização & Atendimento:*\n${businessName || 'Nosso Estabelecimento'}\nRua Principal, 120 - Sala 3. Atendimento com hora marcada! ✨\n\nDigite *${triggerSchedule || '1'}* para agendar ou *${triggerExit || '0'}* para sair.`;
        quickReplies = [
          { id: scheduleTrigger, label: '📅 Iniciar Agendamento' },
          { id: exitTrigger, label: '🚪 Sair' }
        ];
      } else {
        // 1. Processamento por Etapa da Máquina de Estados (State Machine)
        const services = currentSegment.defaultServices || [];

        // ETAPA IDLE
        if (simStep === 'IDLE') {
          const matchedFaq = customResponses.find(r => r.trigger && lower.includes(r.trigger.toLowerCase().trim()));
          if (lower === scheduleTrigger || lower.includes('agendar') || lower.includes('agenda')) {
            nextStep = 'AWAITING_SERVICE';
            const servicesList = services.map((svc, idx) => {
              const letter = String.fromCharCode(65 + idx);
              return `*${letter}* - ${svc.name} (R$ ${svc.price.toFixed(2)})`;
            }).join('\n');
            reply = `✨ *Procedimentos Disponíveis em ${businessName || 'Nosso Espaço'}:*\n\n${servicesList}\n\nDigite a letra da opção (ex: *A*) ou toque no botão do serviço:`;
            quickReplies = services.map((svc, idx) => ({
              id: String.fromCharCode(65 + idx),
              label: `${String.fromCharCode(65 + idx)} - ${svc.name}`
            }));
          } else if (matchedFaq) {
            reply = matchedFaq.response;
            quickReplies = getGreetingQuickReplies();
          } else {
            reply = renderFormattedGreeting();
            quickReplies = getGreetingQuickReplies();
          }
        }

        // ETAPA AWAITING_SERVICE (Escolha do Procedimento)
        else if (simStep === 'AWAITING_SERVICE') {
          let matchedSvc = null;
          // Normaliza: remove barras, pontuações, extrai letra ou número
          if (cleanAlpha.length > 0) {
            const firstChar = cleanAlpha[0];
            const letterIdx = firstChar.charCodeAt(0) - 65; // A = 0, B = 1...
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
            reply = `Excelente escolha para *${matchedSvc.name}*! ✨\n\n📅 *Para qual data gostaria de agendar?*\n\nSelecione uma das opções rápidas abaixo ou abra o calendário nativo (Flows):`;
            quickReplies = [
              { id: 'btn_hoje', label: '📅 Hoje' },
              { id: 'btn_amanha', label: '🌅 Amanhã' },
              { id: 'btn_outra_data', label: '🗓️ Outra data' },
              { id: 'btn_flows', label: '✨ Abrir Calendário (Flows)' }
            ];
          } else {
            // MENSAGEM DE TENTAR NOVAMENTE - NÃO RESETA PARA O MENU
            nextStep = 'AWAITING_SERVICE';
            reply = `⚠️ Opção não reconhecida.\n\nPor favor, escolha uma das letras dos procedimentos abaixo ou digite a letra correspondente (ex: *A*) (ou *${triggerExit || '0'}* para voltar):`;
            quickReplies = services.map((svc, idx) => ({
              id: String.fromCharCode(65 + idx),
              label: `${String.fromCharCode(65 + idx)} - ${svc.name}`
            }));
          }
        }

        // ETAPA AWAITING_DATE / AWAITING_DATE_LIST (Escolha da Data)
        else if (simStep === 'AWAITING_DATE' || simStep === 'AWAITING_DATE_LIST') {
          const today = new Date();
          const todayStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const tomorrow = new Date();
          tomorrow.setDate(today.getDate() + 1);
          const tomorrowStr = tomorrow.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

          // 1. WhatsApp Flows (Calendário Visual)
          if (lower === 'btn_flows' || lower.includes('flows') || lower.includes('calendario') || lower.includes('calendário')) {
            setShowFlowsModal(true);
            reply = `✨ *WhatsApp Flows:* Abrindo o seletor nativo de calendário (DatePicker) na sua tela. Selecione o dia desejado no formulário:`;
            quickReplies = [
              { id: 'btn_hoje', label: '📅 Hoje' },
              { id: 'btn_amanha', label: '🌅 Amanhã' },
              { id: 'btn_outra_data', label: '🗓️ Outra data' }
            ];
          }
          // 2. Quick Reply: Hoje
          else if (lower === 'hoje' || lower === 'btn_hoje' || (lower === '1' && simStep === 'AWAITING_DATE')) {
            setSimSelectedDate(`Hoje (${todayStr})`);
            nextStep = 'AWAITING_TIME';
            reply = `Perfeito! Data de *Hoje (${todayStr})* reservada. 🗓️\n\n⏰ *Horários disponíveis para hoje:*\n☀️ *Manhã:* 09:00, 10:30\n⛅ *Tarde:* 14:00, 16:30\n\nQual horário você prefere? Toque em um dos botões:`;
            quickReplies = [
              { id: '09:00', label: '☀️ 09:00' },
              { id: '10:30', label: '☀️ 10:30' },
              { id: '14:00', label: '⛅ 14:00' },
              { id: '16:30', label: '⛅ 16:30' }
            ];
          }
          // 2. Quick Reply: Amanhã
          else if (lower === 'amanha' || lower === 'amanhã' || lower === 'btn_amanha' || (lower === '2' && simStep === 'AWAITING_DATE')) {
            setSimSelectedDate(`Amanhã (${tomorrowStr})`);
            nextStep = 'AWAITING_TIME';
            reply = `Perfeito! Data de *Amanhã (${tomorrowStr})* reservada. 🗓️\n\n⏰ *Horários disponíveis para amanhã:*\n☀️ *Manhã:* 09:00, 11:00\n⛅ *Tarde:* 14:00, 15:30, 17:00\n\nQual horário você prefere? Toque em um dos botões:`;
            quickReplies = [
              { id: '09:00', label: '☀️ 09:00' },
              { id: '11:00', label: '☀️ 11:00' },
              { id: '14:00', label: '⛅ 14:00' },
              { id: '15:30', label: '⛅ 15:30' }
            ];
          }
          // 3. Quick Reply: Outra Data -> Mensagens de Lista (List Messages)
          else if (lower === 'btn_outra_data' || lower === 'outra data' || lower === 'outra' || lower === 'outras' || lower === 'lista') {
            nextStep = 'AWAITING_DATE_LIST';
            const daysNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
            const upcomingList = [];
            for (let i = 2; i <= 6; i++) {
              const d = new Date();
              d.setDate(today.getDate() + i);
              const fmt = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              const wName = daysNames[d.getDay() === 0 ? 6 : d.getDay() - 1];
              upcomingList.push({ id: fmt, label: `${wName}, ${fmt}` });
            }
            reply = `🗓️ *Mensagens de Lista (List Messages):*\n\nSelecione um dos próximos dias disponíveis na agenda abaixo:`;
            listOptions = upcomingList;
            quickReplies = [
              { id: 'btn_hoje', label: '📅 Hoje' },
              { id: 'btn_amanha', label: '🌅 Amanhã' },
              { id: 'btn_flows', label: '✨ Abrir Calendário (Flows)' }
            ];
          }
          // 4. Data digitada manualmente (ex: 15/10, 16/11) ou vinda de listOption/DatePicker
          else {
            const dateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})/);
            if (dateMatch) {
              const dStr = `${dateMatch[1].padStart(2, '0')}/${dateMatch[2].padStart(2, '0')}`;
              setSimSelectedDate(dStr);
              nextStep = 'AWAITING_TIME';
              reply = `Ótimo! Data *${dStr}* anotada. 🗓️\n\n⏰ *Horários disponíveis para este dia:*\n☀️ *Manhã:* 09:30, 11:00\n⛅ *Tarde:* 14:00, 16:00\n\nQual horário você prefere? Toque em um dos botões:`;
              quickReplies = [
                { id: '09:30', label: '☀️ 09:30' },
                { id: '11:00', label: '☀️ 11:00' },
                { id: '14:00', label: '⛅ 14:00' },
                { id: '16:00', label: '⛅ 16:00' }
              ];
            } else {
              // MENSAGEM DE ERRO NA ESCOLHA DA DATA - SOLICITA TENTAR NOVAMENTE!
              nextStep = 'AWAITING_DATE';
              reply = `⚠️ Não entendi a data informada.\n\nPor favor, tente novamente escolhendo um dos botões rápidos abaixo ou digite no formato *DD/MM* (ex: 15/10):`;
              quickReplies = [
                { id: 'btn_hoje', label: '📅 Hoje' },
                { id: 'btn_amanha', label: '🌅 Amanhã' },
                { id: 'btn_outra_data', label: '🗓️ Outra data' },
                { id: 'btn_flows', label: '✨ Abrir Calendário (Flows)' }
              ];
            }
          }
        }

        // ETAPA AWAITING_TIME (Escolha do Horário)
        else if (simStep === 'AWAITING_TIME') {
          const timeMatch = text.match(/(\d{1,2})[:h](\d{2})?/i);
          if (timeMatch || ['09:00', '10:30', '11:00', '14:00', '15:30', '16:00', '16:30'].includes(text)) {
            const chosenTime = text.includes(':') ? text : timeMatch ? `${timeMatch[1].padStart(2, '0')}:${(timeMatch[2] || '00')}` : text;
            nextStep = 'CONFIRMED';
            reply = `🎉 *Agendamento Confirmado com Sucesso!*\n\n👤 *Cliente:* Amanda Silva\n💇 *Procedimento:* ${simSelectedService?.name || 'Procedimento'}\n📅 *Data:* ${simSelectedDate || 'Hoje'}\n⏰ *Horário:* ${chosenTime}\n💰 *Valor:* R$ ${(simSelectedService?.price || 45).toFixed(2)}\n📍 *Local:* ${businessName || 'Nosso Espaço'}\n\nAgradecemos a preferência! Te esperamos lá. ✨`;
            quickReplies = [
              { id: 'menu', label: '🔄 Iniciar Novo Agendamento' }
            ];
          } else {
            nextStep = 'AWAITING_TIME';
            reply = `⚠️ Horário não reconhecido.\n\nPor favor, escolha um dos horários disponíveis abaixo ou digite no formato *HH:MM* (ex: 14:00):`;
            quickReplies = [
              { id: '09:00', label: '☀️ 09:00' },
              { id: '10:30', label: '☀️ 10:30' },
              { id: '14:00', label: '⛅ 14:00' },
              { id: '16:30', label: '⛅ 16:30' }
            ];
          }
        }

        // ETAPA CONFIRMED
        else if (simStep === 'CONFIRMED') {
          nextStep = 'IDLE';
          reply = renderFormattedGreeting();
          quickReplies = getGreetingQuickReplies();
        }
      }

      setSimStep(nextStep);
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: reply,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        quickReplies,
        listOptions
      }]);
    }, 400);
  };

  // Reiniciar a conversa no simulador
  const handleResetSimulatorChat = () => {
    setSimStep('IDLE');
    setSimSelectedService(null);
    setSimSelectedDate(null);
    setChatMessages([
      { 
        id: Date.now(), 
        sender: 'bot', 
        text: renderFormattedGreeting(), 
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        quickReplies: getGreetingQuickReplies()
      }
    ]);
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

      {/* Header Estilo Landing Page Lypsyos / Zenda */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-line dark:border-slate-800">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 text-brand dark:text-blue-300 text-xs font-semibold tracking-wide uppercase mb-3">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor || '#2457f5' }}></span>
            Automação WhatsApp & URA Numérica
          </div>
          <div className="flex items-center gap-3.5">
            <LypsyosIconBadge icon={Bot} tone="growth" size="md" />
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-ink dark:text-white tracking-tight leading-tight break-words">
              Meu <span className="text-growth">Robô Atendente</span>
            </h1>
          </div>
          <p className="text-ink-soft dark:text-slate-400 mt-2 text-sm md:text-base max-w-2xl break-words">
            Configure o fluxo de auto-saudação, atalhos numéricos da URA e regras inteligentes de agendamento automático 24h.
          </p>
        </div>

        <Button 
          onClick={handleSave}
          disabled={saving}
          variant="primary"
          size="lg"
          style={{ backgroundColor: themeColor || '#2457f5' }}
          className="w-full sm:w-auto self-start md:self-auto"
        >
          {saving ? <RefreshCw className="w-5 h-5 animate-spin shrink-0" /> : <Save className="w-5 h-5 shrink-0" />}
          <span>{saving ? 'Sincronizando...' : 'Salvar Alterações'}</span>
        </Button>
      </div>

      {/* Navegação por Abas (Step-by-step UX) */}
      <div className="flex items-center gap-2 bg-surface dark:bg-slate-900 p-1.5 rounded-2xl border border-line dark:border-slate-800 shadow-soft overflow-x-auto">
        <button
          onClick={() => setActiveTab('messages')}
          style={activeTab === 'messages' ? { backgroundColor: themeColor || '#2457f5' } : {}}
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
          style={activeTab === 'hours' ? { backgroundColor: themeColor || '#2457f5' } : {}}
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
          style={activeTab === 'triggers' ? { backgroundColor: themeColor || '#2457f5' } : {}}
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
        <div className="min-w-0 lg:col-span-2 space-y-6">

          {/* ABA 1: MENSAGENS E ATALHOS (NOVA URA INTELIGENTE) */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              {/* Card de Configuração dos Gatilhos Numéricos */}
              <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-6 shadow-soft space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-growth-soft dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 text-growth-text dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wide mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-growth" />
                      Menu Numérico URA
                    </div>
                    <h3 className="font-heading text-lg font-bold text-ink dark:text-white break-words">Atalhos do Menu WhatsApp</h3>
                    <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5 break-words">
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

        {/* Simulador ao Vivo em Chassi de Smartphone Real (Design Instagram / Meta Standard) */}
        <div className="min-w-0 w-full lg:w-[380px] shrink-0">
          <div className="sticky top-6">
            
            {/* Título & Botão de Recomeçar */}
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                Simulador ao Vivo (WhatsApp)
              </span>
              <button
                type="button"
                onClick={handleResetSimulatorChat}
                title="Reiniciar Simulação da Conversa"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            </div>

            {/* MOLDURA FÍSICA DO SMARTPHONE */}
            <div className="relative mx-auto w-full max-w-[340px] rounded-[50px] border-[10px] border-slate-950 dark:border-slate-800 bg-slate-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-between px-3">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></span>
                <span className="w-2 h-2 rounded-full bg-blue-950/60"></span>
              </div>

              {/* Barra de Status do Sistema Operacional (iOS/Android) */}
              <div className="pt-2 px-6 pb-1 flex items-center justify-between text-white text-[11px] font-bold z-20 relative bg-[#0b141a]">
                <span>9:41</span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <span className="w-3.5 h-2 rounded-xs border border-white flex items-center p-0.2">
                    <span className="h-full w-full bg-white rounded-2xs"></span>
                  </span>
                </div>
              </div>

              {/* TOP BAR OFICIAL DO WHATSAPP BUSINESS */}
              <div className="bg-[#1f2c34] text-white px-3 py-2.5 flex items-center justify-between border-b border-[#2a3942] z-20 relative shadow-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      currentSegment.icon || '🏪'
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-white truncate max-w-[130px]">
                        {businessName || 'Meu Negócio'}
                      </p>
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      online
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <Video className="w-4 h-4 cursor-pointer hover:text-white" />
                  <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
                  <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
                </div>
              </div>

              {/* TELA DE CHAT WHATSAPP COM WALLPAPER REAL */}
              <div 
                ref={chatScrollRef}
                className="h-[410px] overflow-y-auto p-3 space-y-2.5 text-xs bg-[#0b141a] relative scroll-smooth"
                style={{
                  backgroundImage: `radial-gradient(#182229 1px, transparent 1px)`,
                  backgroundSize: '16px 16px'
                }}
              >
                {/* Chip de Criptografia do WhatsApp */}
                <div className="flex justify-center my-1">
                  <span className="bg-[#182229] text-[#ffd279] text-[9px] px-2.5 py-1 rounded-lg text-center max-w-[90%] shadow-2xs leading-tight">
                    🔒 Mensagens protegidas com criptografia de ponta a ponta do WhatsApp.
                  </span>
                </div>

                {/* Stream de Mensagens da Conversa */}
                {chatMessages.map((msg) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                    >
                      <div className={`p-2.5 px-3 rounded-2xl max-w-[85%] whitespace-pre-wrap leading-relaxed shadow-sm text-xs ${
                        isBot 
                          ? 'bg-[#202c33] text-[#e9edef] rounded-tl-xs border border-[#2a3942]/60' 
                          : 'bg-[#005c4b] text-[#e9edef] rounded-tr-xs'
                      }`}>
                        {msg.text}

                        {/* Botões de Resposta Rápida (Quick Replies) do WhatsApp */}
                        {msg.quickReplies && (
                          <div className="mt-2.5 pt-2 border-t border-[#2a3942]/80 flex flex-col gap-1.5">
                            {msg.quickReplies.map((btn) => (
                              <button
                                key={btn.id}
                                type="button"
                                onClick={() => handleSendSimulatorMessage(btn.id)}
                                className="w-full bg-[#182229] hover:bg-[#2a3942] active:scale-[0.98] text-[#53bdeb] hover:text-white border border-[#2a3942] rounded-xl py-1.5 px-2.5 text-[11px] font-bold text-center transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <span>{btn.label}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Mensagens de Lista (List Messages) */}
                        {msg.listOptions && (
                          <div className="mt-2.5 pt-2 border-t border-[#2a3942]/80 space-y-1.5">
                            <span className="text-[10px] text-[#8696a0] font-semibold block">
                              📋 Selecione uma opção da lista:
                            </span>
                            {msg.listOptions.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSendSimulatorMessage(opt.id)}
                                className="w-full bg-[#182229] hover:bg-[#2a3942] active:scale-[0.98] text-white border border-[#2a3942] rounded-xl p-2 text-[11px] font-medium transition-all flex items-center justify-between cursor-pointer"
                              >
                                <span>{opt.label}</span>
                                <span className="text-[10px] text-emerald-400 font-bold">Escolher →</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className={`text-[9px] text-right mt-1.5 flex items-center justify-end gap-1 ${
                          isBot ? 'text-[#8696a0]' : 'text-[#8696a0]'
                        }`}>
                          <span>{msg.time}</span>
                          {!isBot && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Indicador de "Digitando..." Animado */}
                {isBotTyping && (
                  <div className="flex items-center gap-1 bg-[#202c33] text-[#8696a0] px-3 py-2 rounded-2xl rounded-tl-xs w-20 shadow-sm border border-[#2a3942]/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                )}
              </div>

              {/* Modal Nativo WhatsApp Flows (Componente DatePicker) */}
              {showFlowsModal && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-40 flex items-end animate-in fade-in duration-200">
                  <div className="bg-[#1f2c34] text-white w-full rounded-t-3xl p-4 border-t border-[#2a3942] shadow-2xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#2a3942]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-white">WhatsApp Flows • DatePicker</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowFlowsModal(false)}
                        className="text-[#8696a0] hover:text-white p-1 rounded-full cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-[10px] text-[#8696a0] leading-relaxed">
                      Formulário com seletor de calendário nativo do WhatsApp Flows. Escolha o dia da sessão:
                    </p>

                    <div className="bg-[#111b21] p-3 rounded-2xl border border-[#2a3942]">
                      <label className="text-[10px] font-bold text-[#8696a0] uppercase block mb-1">
                        Data do Agendamento
                      </label>
                      <input
                        type="date"
                        value={flowsDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFlowsDate(e.target.value)}
                        className="w-full bg-[#202c33] text-white rounded-xl p-2.5 text-xs border border-[#2a3942] focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowFlowsModal(false)}
                        className="flex-1 py-2 rounded-xl bg-[#2a3942] hover:bg-[#32444f] text-[#8696a0] text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFlowsModal(false);
                          const [y, m, d] = flowsDate.split('-');
                          handleSendSimulatorMessage(`${d}/${m}`);
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Confirmar Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CHIPS DE SUGESTÃO RÁPIDA (1 TOQUE PARA TESTAR) */}
              <div className="bg-[#1f2c34] px-2 py-1.5 border-t border-[#2a3942] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleSendSimulatorMessage(triggerSchedule || '1')}
                  className="px-2.5 py-1 rounded-full bg-[#2a3942] hover:bg-[#32444f] text-[#53bdeb] text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                >
                  📅 {triggerSchedule || '1'} (Agendar)
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSimulatorMessage(triggerAttendant || '2')}
                  className="px-2.5 py-1 rounded-full bg-[#2a3942] hover:bg-[#32444f] text-emerald-400 text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                >
                  👤 {triggerAttendant || '2'} (Humano)
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSimulatorMessage(triggerLocation || '3')}
                  className="px-2.5 py-1 rounded-full bg-[#2a3942] hover:bg-[#32444f] text-amber-300 text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                >
                  📍 {triggerLocation || '3'} (Local)
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSimulatorMessage('preço')}
                  className="px-2.5 py-1 rounded-full bg-[#2a3942] hover:bg-[#32444f] text-purple-300 text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                >
                  💳 Preço
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSimulatorMessage(triggerExit || '0')}
                  className="px-2.5 py-1 rounded-full bg-[#2a3942] hover:bg-[#32444f] text-rose-400 text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                >
                  🚪 {triggerExit || '0'} (Sair)
                </button>
              </div>

              {/* BARRA DE ENTRADA DO WHATSAPP COM BOTÃO DE ENVIO */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendSimulatorMessage();
                }}
                className="bg-[#1f2c34] p-2 flex items-center gap-1.5 border-t border-[#2a3942]"
              >
                <div className="flex-1 flex items-center gap-2 bg-[#2a3942] rounded-full px-3 py-1.5">
                  <Smile className="w-4 h-4 text-[#8696a0]" />
                  <input
                    type="text"
                    value={simulatorCustomInput}
                    onChange={(e) => setSimulatorCustomInput(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="w-full bg-transparent text-white placeholder-[#8696a0] text-xs focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!simulatorCustomInput.trim()}
                  className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              </form>

              {/* Barra de Navegação Inferior do Celular (Home Bar) */}
              <div className="h-4 bg-[#1f2c34] flex items-center justify-center pb-1">
                <span className="w-24 h-1 bg-slate-600 rounded-full"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
