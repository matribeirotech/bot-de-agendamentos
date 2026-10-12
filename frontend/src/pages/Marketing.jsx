import { useState } from 'react';
import { Send, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SEGMENTS } from '../lib/segmentSeeds';

export default function Marketing() {
  const { businessName, segment, themeColor } = useAppStore();
  const segmentObj = SEGMENTS.find(s => s.id === segment) || SEGMENTS[0];

  const [message, setMessage] = useState(
    `Olá {nome_cliente}! 👋 Temos horários especiais nesta semana em *${businessName || 'nosso espaço'}*. Quer garantir o seu procedimento? Responda com *1* para agendar!`
  );
  const [targetAudience, setTargetAudience] = useState('all');

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      alert("Digite uma mensagem para enviar.");
      return;
    }
    alert(`📢 Disparo em massa iniciado!\n\nEstabelecimento: ${businessName || 'Meu Estabelecimento'}\nPúblico-alvo: ${targetAudience === 'all' ? 'Todos os clientes (base completa)' : targetAudience === 'active' ? 'Clientes ativos (últimos 30 dias)' : 'Clientes ausentes (+30 dias sem agendar)'}\n\nMensagem pronta para envio via WhatsApp!`);
  };

  const insertVariable = (variable) => {
    setMessage(prev => prev + variable);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Estilo Landing Page */}
      <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-3 border"
          style={{ backgroundColor: `${themeColor || '#2563eb'}15`, borderColor: `${themeColor || '#2563eb'}30`, color: themeColor || '#2563eb' }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor || '#2563eb' }}></span>
          Disparos & Fidelização
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Campanhas & <span className="text-emerald-500">Disparos no WhatsApp</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm md:text-base max-w-2xl">
          Envie mensagens automáticas para reativar clientes antigas, divulgar horários livres e lotar sua agenda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor de Campanha */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm">
            <form onSubmit={handleSendBroadcast} className="space-y-6">
              {/* Escolha do Público */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                  1. Selecione o Público-Alvo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label 
                    className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${
                      targetAudience === 'all' 
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold shadow-xs' 
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input type="radio" name="audience" value="all" checked={targetAudience === 'all'} onChange={(e) => setTargetAudience(e.target.value)} className="sr-only" />
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold">Todos os Clientes</span>
                    <span className="text-[11px] opacity-75 text-center">Toda a base cadastrada</span>
                  </label>

                  <label 
                    className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${
                      targetAudience === 'active' 
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold shadow-xs' 
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input type="radio" name="audience" value="active" checked={targetAudience === 'active'} onChange={(e) => setTargetAudience(e.target.value)} className="sr-only" />
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold">Clientes Ativas</span>
                    <span className="text-[11px] opacity-75 text-center">Agendaram há &lt;30 dias</span>
                  </label>

                  <label 
                    className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${
                      targetAudience === 'inactive' 
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold shadow-xs' 
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input type="radio" name="audience" value="inactive" checked={targetAudience === 'inactive'} onChange={(e) => setTargetAudience(e.target.value)} className="sr-only" />
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold">Recuperar Clientes</span>
                    <span className="text-[11px] opacity-75 text-center">Sem vir há mais de 30 dias</span>
                  </label>
                </div>
              </div>

              {/* Editor de Texto */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    2. Mensagem Personalizada
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400">Variáveis:</span>
                    <button 
                      type="button" 
                      onClick={() => insertVariable(' {nome_cliente}')}
                      className="text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                    >
                      + Nome da Cliente
                    </button>
                    <button 
                      type="button" 
                      onClick={() => insertVariable(' *1*')}
                      className="text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                    >
                      + Digite 1 (Agendar)
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-600 transition-all bg-white dark:bg-slate-900">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    required
                    className="w-full p-4 text-xs md:text-sm border-none focus:outline-none resize-none text-slate-800 dark:text-slate-100 leading-relaxed font-sans bg-transparent"
                    placeholder="Escreva a mensagem que todas as clientes receberão..."
                  />
                  <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span>{message.length} caracteres digitados</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Variáveis ativas
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de Disparo */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2.5 text-white font-semibold text-sm py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all cursor-pointer"
                style={{ backgroundColor: themeColor || '#2563eb' }}
              >
                <Send className="w-4 h-4" />
                Disparar Campanha para o WhatsApp
              </button>
            </form>
          </div>
        </div>

        {/* WhatsApp Mobile Preview */}
        <div>
          <div className="sticky top-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
              Preview da Notificação no Celular
            </h3>

            {/* Simulação Celular Moderno */}
            <div className="bg-slate-900 rounded-[2.5rem] p-3 border-4 border-slate-800 shadow-2xl max-w-[320px] mx-auto overflow-hidden">
              {/* Top Notch */}
              <div className="h-5 bg-slate-950 rounded-b-xl w-28 mx-auto mb-2"></div>
              
              {/* Header WhatsApp */}
              <div className="bg-[#075E54] text-white p-3 rounded-2xl flex items-center gap-2.5 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 overflow-hidden">
                  {segmentObj?.icon || '🏪'}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-xs leading-tight truncate">{businessName || 'Meu Estabelecimento'}</p>
                  <p className="text-[10px] text-emerald-200">Mensagem Oficial</p>
                </div>
              </div>

              {/* Body */}
              <div className="bg-[#EFEAE2] min-h-[340px] p-3.5 rounded-2xl my-2 flex flex-col justify-end">
                <div className="bg-[#DCF8C6] text-slate-900 p-3.5 rounded-2xl rounded-tr-none shadow-sm text-xs leading-relaxed whitespace-pre-wrap">
                  {message
                    .replace(/{nome_cliente}/g, "Camila")
                    .replace(/{saudacao}/g, "Boa tarde")}
                  <div className="text-[9px] text-slate-500 text-right mt-1.5 font-medium">14:32 ✓✓</div>
                </div>
              </div>

              <div className="text-center py-1">
                <span className="text-[10px] text-slate-400">Simulação em tempo real</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
