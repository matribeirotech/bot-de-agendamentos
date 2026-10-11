import { useState } from 'react';
import { 
  Bot, MessageSquare, Plus, Save, Clock, Sparkles, CheckCircle2, 
  HelpCircle, ChevronRight, ToggleLeft, ToggleRight, Trash2, Calendar
} from 'lucide-react';

export default function BotConfig() {
  const [activeTab, setActiveTab] = useState('hours'); // 'hours' | 'messages' | 'triggers'
  
  // Toggles de comportamento
  const [botEnabled, setBotEnabled] = useState(true);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  
  // Mensagens
  const [greeting, setGreeting] = useState("Olá! 👋 Bem-vindo(a) à Lypsyos Salão. Como posso te ajudar hoje?\n\nDigite *#agendar* para ver os horários disponíveis e marcar o seu procedimento!");
  const [absenceMessage, setAbsenceMessage] = useState("No momento nosso salão está fechado. 🌙\n\nNosso horário de atendimento é de Segunda a Sábado das 09:00 às 19:00. Deixe sua mensagem ou digite *#agendar* para marcar para o próximo dia útil!");

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

  // Gatilhos e Respostas Customizadas
  const [customResponses, setCustomResponses] = useState([
    { id: 1, trigger: "preço", response: "Nossa manicure simples custa R$ 35,00 e o spa completo R$ 85,00. 💅" },
    { id: 2, trigger: "endereço", response: "Ficamos localizadas na Rua das Flores, 120 - Sala 3. Temos estacionamento no local!" },
    { id: 3, trigger: "pix", response: "Nossa chave PIX é o nosso CNPJ: 12.345.678/0001-90 (Lypsyos Manicure)." }
  ]);

  const updateHour = (index, field, value) => {
    const updated = [...businessHours];
    updated[index][field] = value;
    setBusinessHours(updated);
  };

  const handleSave = () => {
    alert("✅ Configurações e Horários do Robô sincronizados com sucesso no Lypsyos!");
  };

  return (
    <div className="space-y-8">
      {/* Header Estilo Landing Page */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Automação WhatsApp & Horários
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Configuração do <span className="text-emerald-500">Robô Atendente</span>
          </h1>
          <p className="text-slate-600 mt-2 text-sm md:text-base max-w-2xl">
            Ajuste os horários em que o salão está aberto, respostas automáticas e regras de agendamento 24h.
          </p>
        </div>

        <button 
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all whitespace-nowrap self-start md:self-auto cursor-pointer"
        >
          <Save className="w-5 h-5" />
          Salvar Alterações
        </button>
      </div>

      {/* Navegação por Abas (Step-by-step UX) */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('hours')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'hours'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          1. Horário de Atendimento
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'messages'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          2. Mensagens Padrão
        </button>
        <button
          onClick={() => setActiveTab('triggers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'triggers'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          3. Respostas Rápidas (FAQ)
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel Principal */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'hours' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Expediente Semanal</h3>
                <p className="text-xs text-slate-500 mt-1">
                  O bot usa esses horários para nunca agendar clientes em momentos de folga ou durante o almoço.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {businessHours.map((bh, idx) => (
                  <div key={bh.key} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-40">
                      <button
                        onClick={() => updateHour(idx, 'open', !bh.open)}
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          bh.open ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          bh.open ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                      <span className={`text-sm font-semibold ${bh.open ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                        {bh.day}
                      </span>
                    </div>

                    {bh.open ? (
                      <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                          <span className="text-slate-500 font-medium">Abre:</span>
                          <input 
                            type="time" 
                            value={bh.start}
                            onChange={(e) => updateHour(idx, 'start', e.target.value)}
                            className="bg-transparent font-bold text-slate-800 focus:outline-none"
                          />
                        </div>
                        <span className="text-slate-300">até</span>
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                          <span className="text-slate-500 font-medium">Fecha:</span>
                          <input 
                            type="time" 
                            value={bh.end}
                            onChange={(e) => updateHour(idx, 'end', e.target.value)}
                            className="bg-transparent font-bold text-slate-800 focus:outline-none"
                          />
                        </div>

                        {/* Pausa Almoço */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-blue-50/70 border border-blue-100 rounded-xl px-2 py-1.5 ml-1">
                          <span className="font-semibold text-blue-700">Almoço:</span>
                          <input 
                            type="time" 
                            value={bh.breakStart}
                            onChange={(e) => updateHour(idx, 'breakStart', e.target.value)}
                            className="bg-transparent text-blue-900 font-semibold focus:outline-none w-14"
                          />
                          <span>-</span>
                          <input 
                            type="time" 
                            value={bh.breakEnd}
                            onChange={(e) => updateHour(idx, 'breakEnd', e.target.value)}
                            className="bg-transparent text-blue-900 font-semibold focus:outline-none w-14"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl">
                        Fechado (O bot avisa que você está de folga)
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Mensagem de Ausência */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mensagem Automática Fora do Horário Comercial
                </label>
                <textarea
                  rows={3}
                  value={absenceMessage}
                  onChange={(e) => setAbsenceMessage(e.target.value)}
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800"
                />
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Mensagens Padrão do WhatsApp</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Personalize os textos automáticos que suas clientes recebem no primeiro contato.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mensagem de Saudação & Boas-Vindas
                  </label>
                  <textarea
                    rows={4}
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800 font-mono"
                  />
                  <span className="text-[11px] text-slate-400">
                    💡 Dica: Peça para suas clientes digitarem <strong>#agendar</strong> para ativar o fluxo.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'triggers' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Respostas Rápidas (Palavras-Chave)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Quando o cliente mandar essas palavras, o robô responde na hora.
                  </p>
                </div>
                <button 
                  onClick={() => setCustomResponses([...customResponses, { id: Date.now(), trigger: '', response: '' }])}
                  className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs px-3 py-2 rounded-xl border border-blue-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Gatilho
                </button>
              </div>

              <div className="space-y-3">
                {customResponses.map((item, index) => (
                  <div key={item.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
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
                          className="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg focus:outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => setCustomResponses(customResponses.filter(r => r.id !== item.id))}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
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
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Simulador / Preview WhatsApp (Visual Idêntico à Landing Page) */}
        <div>
          <div className="sticky top-6 bg-slate-900 text-white rounded-3xl p-5 shadow-xl border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xs text-white">
                  L
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Lypsyos Bot 💅</p>
                  <p className="text-[10px] text-emerald-400">Online 24h</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                Simulador
              </span>
            </div>

            {/* Balões de conversa WhatsApp */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/80 rounded-2xl rounded-tl-none p-3 border border-slate-700/60 max-w-[85%] text-slate-200 whitespace-pre-wrap">
                {greeting}
                <div className="text-[9px] text-slate-400 text-right mt-1">10:00</div>
              </div>

              <div className="bg-emerald-600 rounded-2xl rounded-tr-none p-3 ml-auto max-w-[80%] text-white shadow-sm">
                #agendar
                <div className="text-[9px] text-emerald-200 text-right mt-1">10:01 ✓✓</div>
              </div>

              <div className="bg-slate-800/80 rounded-2xl rounded-tl-none p-3 border border-slate-700/60 max-w-[85%] text-slate-200">
                <p className="font-semibold text-emerald-400 mb-1">💅 Escolha o serviço:</p>
                <p>1 - Manicure Simples (R$ 35,00)</p>
                <p>2 - Pedicure Simples (R$ 40,00)</p>
                <p>3 - Spa dos Pés e Mãos (R$ 85,00)</p>
                <div className="text-[9px] text-slate-400 text-right mt-1">10:01</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">
                Este é o fluxo em tempo real que suas clientes verão no WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
