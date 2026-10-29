import { useState } from 'react';
import { Check, X, Sparkles, ArrowRight, Star, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Pricing() {
  const { themeColor, subscription } = useAppStore();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [toastText, setToastText] = useState('');

  const activeColor = themeColor || '#2457f5';

  const handleSubscribeClick = () => {
    setToastText(
      `Seu período gratuito do Plano Profissional já está liberado (${
        subscription?.daysRemaining ?? 29
      } dias restantes). Aproveite todos os recursos!`
    );
    setTimeout(() => setToastText(''), 4500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-8 min-w-0">
      {/* Toast Mobile-Safe */}
      {toastText && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:top-auto sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="flex-1">{toastText}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border"
          style={{
            backgroundColor: `${activeColor}15`,
            borderColor: `${activeColor}30`,
            color: activeColor,
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Planos Simples e Sem Comissões
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight leading-tight">
          Comece com 30 dias grátis.{' '}
          <span className="text-growth">Cresça no seu ritmo.</span>
        </h1>

        <p className="text-ink-soft dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
          Você já está aproveitando <strong>30 dias completos do Plano Profissional</strong> sem cartão de crédito.
        </p>

        {/* Seletor Mensal / Anual */}
        <div className="pt-2 inline-flex items-center gap-2 p-1 rounded-2xl bg-surface dark:bg-slate-900 border border-line dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`min-h-9 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-brand text-white shadow-xs'
                : 'text-ink-soft dark:text-slate-400'
            }`}
            style={billingCycle === 'monthly' ? { backgroundColor: activeColor } : undefined}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`min-h-9 px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              billingCycle === 'yearly'
                ? 'bg-brand text-white shadow-xs'
                : 'text-ink-soft dark:text-slate-400'
            }`}
            style={billingCycle === 'yearly' ? { backgroundColor: activeColor } : undefined}
          >
            <span>Anual</span>
            <span className="text-[10px] bg-growth-soft text-growth-text font-extrabold px-2 py-0.5 rounded-full">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Cards de Planos (Plano Profissional aparece primeiro no celular!) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-4xl mx-auto">
        {/* PLANO GRATUITO */}
        <div className="order-2 md:order-1 bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between shadow-soft">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-heading text-xl font-bold text-ink dark:text-white">
                  Plano Gratuito
                </h3>
                <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                  Para quem está começando agora
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-canvas dark:bg-slate-800 text-ink-soft dark:text-slate-400 rounded-full border border-line dark:border-slate-700">
                Após os 30 dias
              </span>
            </div>

            <div className="my-5">
              <span className="font-heading text-4xl font-extrabold text-ink dark:text-white">
                R$ 0
              </span>
              <span className="text-ink-muted text-xs font-medium ml-1.5">/ mês</span>
            </div>

            <div className="space-y-3 my-5 pt-5 border-t border-line/70 dark:border-slate-800 text-xs text-ink-soft dark:text-slate-300">
              <div className="flex items-center gap-2.5 font-medium">
                <Check className="w-4 h-4 text-growth shrink-0" />
                <span>1 atendimento automático por dia no WhatsApp</span>
              </div>
              <div className="flex items-center gap-2.5 font-medium">
                <Check className="w-4 h-4 text-growth shrink-0" />
                <span>Até 3 serviços cadastrados</span>
              </div>
              <div className="flex items-center gap-2.5 font-medium">
                <Check className="w-4 h-4 text-growth shrink-0" />
                <span>Agenda básica de clientes</span>
              </div>
              <div className="flex items-center gap-2.5 text-ink-muted line-through">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Disparos de campanhas e promoções</span>
              </div>
              <div className="flex items-center gap-2.5 text-ink-muted line-through">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Integração com Google Agenda</span>
              </div>
              <div className="flex items-center gap-2.5 text-ink-muted line-through">
                <X className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Lembretes automáticos contra faltas</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled
            className="w-full min-h-11 py-3 rounded-xl font-semibold text-xs border border-line dark:border-slate-800 text-ink-muted bg-canvas dark:bg-slate-800/50 cursor-not-allowed"
          >
            Disponível após o período grátis
          </button>
        </div>

        {/* PLANO PROFISSIONAL (Destaque Primeiro no Mobile) */}
        <div
          className="order-1 md:order-2 bg-gradient-to-b from-night to-[#071330] text-white rounded-3xl border-2 p-6 sm:p-8 flex flex-col justify-between shadow-2xl"
          style={{ borderColor: activeColor }}
        >
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-xl font-bold text-white">
                  Plano Profissional
                </h3>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              </div>
              <span
                className="text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${activeColor}, #10b981)`,
                }}
              >
                30 Dias Grátis
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Agenda cheia 24h por dia e zero preocupação com mensagens
            </p>

            <div className="my-5">
              <span className="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                {billingCycle === 'monthly' ? 'R$ 59,90' : 'R$ 47,90'}
              </span>
              <span className="text-slate-300 text-xs font-medium ml-1.5">/ mês</span>
              {billingCycle === 'yearly' && (
                <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                  Economia no plano anual (R$ 574,80/ano)
                </p>
              )}
            </div>

            <div className="space-y-3 my-5 pt-5 border-t border-white/10 text-xs text-slate-200">
              {[
                'Atendimentos ilimitados 24h no WhatsApp',
                'Serviços e preços ilimitados no cardápio',
                'Disparos de promoções para clientes no WhatsApp',
                'Lembretes automáticos 2h antes para evitar faltas',
                'Lembretes integrados ao Google Agenda',
                'Mensagens personalizadas com o nome do seu espaço',
                'Suporte rápido pelo WhatsApp com nossa equipe',
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2.5">
                  <div className="size-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubscribeClick}
            className="w-full min-h-12 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: activeColor }}
          >
            <span>Aproveitar Meus 30 Dias Grátis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dúvidas Rápidas */}
      <div className="max-w-3xl mx-auto pt-4 border-t border-line dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="bg-surface dark:bg-slate-900 p-5 rounded-2xl border border-line dark:border-slate-800">
          <h4 className="font-bold text-ink dark:text-white mb-1">
            Preciso cadastrar cartão agora?
          </h4>
          <p className="text-ink-soft dark:text-slate-400 leading-relaxed">
            Não! Você usa o Plano Profissional por 30 dias sem compromisso. Se decidir não assinar, sua conta segue no Plano Gratuito.
          </p>
        </div>
        <div className="bg-surface dark:bg-slate-900 p-5 rounded-2xl border border-line dark:border-slate-800">
          <h4 className="font-bold text-ink dark:text-white mb-1">
            Cobram comissão por agendamento?
          </h4>
          <p className="text-ink-soft dark:text-slate-400 leading-relaxed">
            Zero comissão! 100% do valor dos seus atendimentos fica direto com você.
          </p>
        </div>
      </div>
    </div>
  );
}
