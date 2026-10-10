import { useState } from 'react';
import { Send, Users, Image as ImageIcon, Smile, MessageSquare, AlertCircle } from 'lucide-react';

export default function Marketing() {
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all'); // all, active, inactive

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      alert("Digite uma mensagem para enviar.");
      return;
    }
    alert(`Disparo em massa simulado!\nMensagem enviada para: ${targetAudience === 'all' ? 'Todos os contatos' : targetAudience === 'active' ? 'Clientes ativos' : 'Clientes inativos (há +30 dias)'}\nTexto: ${message}`);
    setMessage('');
  };

  const insertVariable = (variable) => {
    setMessage(prev => prev + variable);
  };

  return (
    <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
      {/* Editor Column */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Marketing & Disparos</h2>
          <p className="text-slate-500 text-sm mt-1">Envie promoções, cupons e avisos para sua base de clientes.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
              <MegaphoneIcon className="w-5 h-5 text-indigo-500" />
              Nova Campanha
            </h3>
          </div>

          <form onSubmit={handleSendBroadcast} className="p-6 space-y-6">
            {/* Audience Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Público-Alvo</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors ${targetAudience === 'all' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                  <input type="radio" name="audience" value="all" checked={targetAudience === 'all'} onChange={(e) => setTargetAudience(e.target.value)} className="sr-only" />
                  <Users className="w-6 h-6" />
                  <span className="font-medium text-sm">Todos os Clientes</span>
                </label>
                <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors ${targetAudience === 'active' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                  <input type="radio" name="audience" value="active" checked={targetAudience === 'active'} onChange={(e) => setTargetAudience(e.target.value)} className="sr-only" />
                  <MessageSquare className="w-6 h-6" />
                  <span className="font-medium text-sm text-center">Ativos<br/><span className="text-xs opacity-75 font-normal">(agendaram nos últimos 30 dias)</span></span>
                </label>
                <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors ${targetAudience === 'inactive' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                  <input type="radio" name="audience" value="inactive" checked={targetAudience === 'inactive'} onChange={(e) => setTargetAudience(e.target.value)} className="sr-only" />
                  <AlertCircle className="w-6 h-6" />
                  <span className="font-medium text-sm text-center">Inativos<br/><span className="text-xs opacity-75 font-normal">(sem agendar há +30 dias)</span></span>
                </label>
              </div>
            </div>

            {/* Message Editor */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-medium text-slate-700">Mensagem da Campanha</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => insertVariable('{nome_cliente}')} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded font-medium transition-colors">
                    + Nome do Cliente
                  </button>
                  <button type="button" onClick={() => insertVariable('{saudacao}')} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded font-medium transition-colors">
                    + Saudação
                  </button>
                </div>
              </div>
              <div className="border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-shadow">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Olá {nome_cliente}, temos uma promoção especial para você hoje..."
                  rows={6}
                  className="w-full px-4 py-3 border-none focus:ring-0 resize-none outline-none"
                  required
                />
                <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between">
                  <div className="flex gap-2 text-slate-500">
                    <button type="button" className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Inserir Emoji">
                      <Smile className="w-5 h-5" />
                    </button>
                    <button type="button" className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Anexar Imagem">
                      <ImageIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {message.length} caracteres
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Dica: Evite textos muito longos e envie promoções em horários comerciais para maior taxa de resposta.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm"
              >
                <Send className="w-5 h-5" />
                Disparar Campanha
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Column */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <h3 className="font-semibold text-slate-800 mb-4 px-1">Preview do WhatsApp</h3>
          
          {/* Falso Celular */}
          <div className="bg-slate-100 rounded-[2.5rem] p-3 border-4 border-slate-800 shadow-xl w-[300px] h-[600px] mx-auto flex flex-col relative overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-2xl w-32 mx-auto z-20"></div>
            
            {/* WhatsApp Header */}
            <div className="bg-[#075E54] text-white pt-10 pb-3 px-4 rounded-t-[2rem] flex items-center gap-3 z-10 shadow-md">
              <div className="w-8 h-8 bg-slate-300 rounded-full flex-shrink-0 overflow-hidden">
                <img src="https://ui-avatars.com/api/?name=Cliente+Exemplo&background=E2E8F0&color=475569" alt="Avatar" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">Cliente Exemplo</p>
                <p className="text-[10px] opacity-80">visto por último hoje às 14:00</p>
              </div>
            </div>

            {/* WhatsApp Chat Body */}
            <div className="flex-1 bg-[#E5DDD5] relative overflow-y-auto p-4 flex flex-col">
              {/* WhatsApp background pattern (simulated) */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")', backgroundSize: 'cover' }}></div>
              
              {/* Message Bubble */}
              {message ? (
                <div className="bg-[#DCF8C6] text-slate-800 p-3 rounded-lg rounded-tr-none shadow-sm max-w-[85%] self-end relative mb-2 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message
                      .replace(/{nome_cliente}/g, "Maria")
                      .replace(/{saudacao}/g, "Boa tarde")}
                  </p>
                  <span className="text-[10px] text-slate-500 float-right mt-2 ml-3">14:05</span>
                </div>
              ) : (
                <div className="text-center mt-auto mb-auto opacity-50">
                  <MegaphoneIcon className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Sua mensagem aparecerá aqui</p>
                </div>
              )}
            </div>
            
            {/* WhatsApp Input Fake */}
            <div className="bg-white p-3 rounded-b-[2rem] flex items-center gap-2 z-10">
              <div className="flex-1 bg-slate-100 rounded-full h-10 px-4 flex items-center text-slate-400 text-sm">
                Mensagem
              </div>
              <div className="w-10 h-10 bg-[#00897B] rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pequeno ícone auxiliar para o Megaphone, já que me esqueci de importar lá em cima ou caso eu precise
function MegaphoneIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
    </svg>
  );
}

