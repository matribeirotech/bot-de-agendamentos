import { useState } from 'react';
import { 
  Check, X, Sparkles, ShieldCheck, Zap, ArrowRight, 
  Clock, HelpCircle, Star, MessageCircle, Calendar, Bot 
} from 'lucide-react';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-4">
      {/* Header Estilo Landing Page */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Planos Transparentes & Sem Pegadinhas
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Comece com 30 dias grátis. <br/>
          Depois, escolha como <span className="text-emerald-500 underline decoration-emerald-200 underline-offset-4">crescer.</span>
        </h1>
        
        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
          Todo novo usuário ganha <strong>30 dias de acesso completo ao Plano Pro</strong> sem precisar cadastrar cartão de crédito.
        </p>

        {/* Toggle Mensal / Anual */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>
            Mensal
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-12 h-6 bg-blue-600 rounded-full p-1 transition-colors cursor-pointer flex items-center"
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
              billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
          <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
            Anual
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
              Economize 20%
            </span>
          </span>
        </div>
      </div>

      {/* Cards de Preço */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
        {/* PLANO FREE (Pós-Trial) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Plano Básico (Free)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Para quem está apenas começando</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                Pós-Trial
              </span>
            </div>

            <div className="my-6">
              <span className="text-4xl font-extrabold text-slate-900">R$ 0</span>
              <span className="text-slate-400 text-xs font-medium ml-1.5">/ para sempre</span>
            </div>

            <p className="text-xs text-slate-500 pb-6 border-b border-slate-100 leading-relaxed">
              Disponível automaticamente após o término dos seus 30 dias de teste grátis caso opte por não assinar.
            </p>

            {/* Lista de Recursos */}
            <div className="space-y-3.5 my-6 text-xs text-slate-600">
              <div className="flex items-center gap-2.5 font-medium">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>1 resposta automática</strong> do robô por dia</span>
              </div>
              <div className="flex items-center gap-2.5 font-medium">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Até 3 serviços cadastrados no catálogo</span>
              </div>
              <div className="flex items-center gap-2.5 font-medium">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Visualização básica de agendamentos</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400 line-through">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Disparos em massa de promoções (Marketing)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400 line-through">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Sincronização com Google Calendar</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400 line-through">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Sem marca d'água no WhatsApp</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400 line-through">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Lembretes automáticos 2h antes</span>
              </div>
            </div>
          </div>

          <button 
            disabled
            className="w-full py-3.5 rounded-xl font-semibold text-xs border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed text-center"
          >
            Plano Padrão Atual
          </button>
        </div>

        {/* PLANO PRO (Recomendado / Com Trial de 30 Dias) */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl border-2 border-blue-500 p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Badge de Destaque */}
          <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
            30 Dias Grátis
          </div>

          <div>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">Plano Profissional (Pro)</h3>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Automação completa para salões que querem faturar mais</p>
            </div>

            <div className="my-6">
              <span className="text-5xl font-extrabold text-white tracking-tight">
                {billingCycle === 'monthly' ? 'R$ 59,90' : 'R$ 47,90'}
              </span>
              <span className="text-slate-400 text-xs font-medium ml-2">/ mês</span>
              {billingCycle === 'yearly' && (
                <p className="text-[11px] text-emerald-400 font-semibold mt-1">Cobrado anualmente (R$ 574,80/ano)</p>
              )}
            </div>

            <p className="text-xs text-blue-200 pb-6 border-b border-slate-800 leading-relaxed">
              Liberado gratuitamente para você durante os primeiros 30 dias. Cancele quando quiser com 1 clique.
            </p>

            {/* Lista de Benefícios Ilimitados */}
            <div className="space-y-3.5 my-6 text-xs text-slate-200">
              <div className="flex items-center gap-2.5 font-semibold text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Respostas ilimitadas 24h</strong> no WhatsApp (sem pausas)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Catálogo ilimitado</strong> de serviços e valores</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Lembretes automáticos 2h antes</strong> (reduz faltas em 80%)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Sincronização 2 vias</strong> com Google Calendar</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Disparos em massa</strong> de cupons e promoções (Marketing)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Zero marcas d'água</strong> (mensagens com o nome do seu salão)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Suporte prioritário via WhatsApp com nossa equipe</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => alert("Você já está aproveitando os 30 dias de teste grátis do Plano Pro! Aproveite todos os recursos.")}
            className="w-full py-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Assinar Plano Pro</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FAQ Rápido sobre o Paywall */}
      <div className="max-w-3xl mx-auto pt-8 border-t border-slate-200/80">
        <h3 className="text-xl font-bold text-slate-900 text-center mb-6">Perguntas Frequentes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
            <h4 className="font-bold text-slate-900 mb-1">Como funciona o teste de 30 dias?</h4>
            <p className="text-slate-500 leading-relaxed">
              Você cria sua conta e ganha 30 dias completos do Plano Pro sem pagar nada. Se não assinar após esse prazo, sua conta continua ativa no plano Free.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
            <h4 className="font-bold text-slate-900 mb-1">O que acontece no plano Free?</h4>
            <p className="text-slate-500 leading-relaxed">
              No plano gratuito, o robô atende até 1 cliente por dia. Para ter atendimentos e agendamentos ilimitados, basta assinar o Pro a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

