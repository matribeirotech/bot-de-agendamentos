import { useState } from 'react';
import { Bot, MessageSquare, Plus, Save, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

export default function BotConfig() {
  const [botEnabled, setBotEnabled] = useState(true);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  
  const [greeting, setGreeting] = useState("Olá! 👋 Bem-vindo(a) à {tenant_name}. Como posso ajudar hoje?\nDigite #agendar para marcar um horário.");
  const [absence, setAbsence] = useState("No momento estamos fora do nosso horário de atendimento. 🌙 Deixe sua mensagem e retornaremos em breve!");

  const [customResponses, setCustomResponses] = useState([
    { id: 1, trigger: "preço", response: "Nossa manicure simples custa R$ 35,00 e o alongamento em gel R$ 120,00." },
    { id: 2, trigger: "endereço", response: "Ficamos localizados na Av. Principal, 123 - Centro." }
  ]);

  const handleSave = (e) => {
    e.preventDefault();
    alert("Configurações do Robô salvas com sucesso! (Integração com API em breve)");
  };

  const addCustomResponse = () => {
    setCustomResponses([...customResponses, { id: Date.now(), trigger: "", response: "" }]);
  };

  const removeCustomResponse = (id) => {
    setCustomResponses(customResponses.filter(r => r.id !== id));
  };

  const updateCustomResponse = (id, field, value) => {
    setCustomResponses(customResponses.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Bot className="w-8 h-8 text-indigo-600" />
            Configurações do Robô
          </h2>
          <p className="text-slate-500 text-sm mt-1">Personalize como seu assistente virtual interage com os clientes.</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          <Save className="w-5 h-5" />
          Salvar Alterações
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Toggles e Mensagens Padrão */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Toggles */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <h3 className="font-semibold text-lg text-slate-800 border-b border-slate-100 pb-4">Comportamento Geral</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">Robô Ativo</p>
                <p className="text-sm text-slate-500">Liga ou desliga totalmente o assistente no WhatsApp.</p>
              </div>
              <button onClick={() => setBotEnabled(!botEnabled)} className={`transition-colors ${botEnabled ? 'text-indigo-600' : 'text-slate-300'}`}>
                {botEnabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">Fluxo de Agendamento</p>
                <p className="text-sm text-slate-500">Permite que o robô faça agendamentos sozinhos usando #agendar.</p>
              </div>
              <button onClick={() => setAutoReplyEnabled(!autoReplyEnabled)} className={`transition-colors ${autoReplyEnabled ? 'text-indigo-600' : 'text-slate-300'}`}>
                {autoReplyEnabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
              </button>
            </div>
          </div>

          {/* Mensagens Padrão */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <h3 className="font-semibold text-lg text-slate-800 border-b border-slate-100 pb-4">Mensagens Padrão</h3>
            
            <div>
              <label className="block font-medium text-slate-700 mb-2">Mensagem de Saudação</label>
              <textarea 
                rows="3" 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">Enviada quando um cliente novo entra em contato.</p>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-2">Mensagem de Ausência (Fora do Horário)</label>
              <textarea 
                rows="2" 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={absence}
                onChange={(e) => setAbsence(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Coluna Direita: Respostas Rápidas */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                Respostas Customizadas
              </h3>
              <button onClick={addCustomResponse} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 p-1.5 rounded-lg transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-4">
              Defina palavras-chave que o robô deve reconhecer e responder automaticamente (ex: "preço", "local").
            </p>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              {customResponses.map((item, index) => (
                <div key={item.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative group">
                  <button 
                    onClick={() => removeCustomResponse(item.id)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="mb-3 pr-6">
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Se o cliente disser:</label>
                    <input 
                      type="text" 
                      placeholder="Palavra-chave" 
                      value={item.trigger}
                      onChange={(e) => updateCustomResponse(item.id, 'trigger', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">O robô responde:</label>
                    <textarea 
                      rows="2" 
                      placeholder="Resposta automática" 
                      value={item.response}
                      onChange={(e) => updateCustomResponse(item.id, 'response', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              ))}
              {customResponses.length === 0 && (
                <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-sm text-slate-500">Nenhuma resposta customizada configurada.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

