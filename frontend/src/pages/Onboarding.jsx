import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { SEGMENTS } from '../lib/segmentSeeds';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import axios from 'axios';
import { 
  Sparkles, ArrowRight, ArrowLeft, Check, Building2, User, 
  Mail, Lock, Phone, CheckCircle2, ShieldCheck, Store, ChevronRight 
} from 'lucide-react';
import { evaluatePasswordStrength, generateStrongPassword, BotDefense } from '../lib/security';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  // Form State
  const [formData, setFormData] = useState({
    responsibleName: '',
    email: '',
    password: '',
    businessName: '',
    whatsapp: '',
    segment: 'manicure'
  });

  const selectedSegmentObj = SEGMENTS.find(s => s.id === formData.segment) || SEGMENTS[0];

  const handleNext = (e) => {
    e.preventDefault();
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleFinish = async () => {
    setLoading(true);

    try {
      // 1. Tenta cadastrar no Supabase se as chaves estiverem configuradas
      if (isSupabaseConfigured()) {
        try {
          await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                nome_completo: formData.responsibleName,
                nome_salao: formData.businessName,
                whatsapp: formData.whatsapp,
                segmento: formData.segment
              }
            }
          });
        } catch (authErr) {
          console.warn("Supabase auth skip:", authErr);
        }
      }

      // 2. Semeia os serviços padrão do segmento no Backend do Django (Local ou Docker)
      const token = btoa('admin:admin');
      const seedServices = selectedSegmentObj.defaultServices;
      
      for (const svc of seedServices) {
        try {
          await axios.post('http://localhost:8000/api/v1/services/', {
            name: svc.name,
            price: svc.price,
            duration_minutes: svc.duration_minutes,
            is_active: true
          }, {
            headers: { 'Authorization': `Basic ${token}` }
          });
        } catch (svcErr) {
          console.warn("Service seed warn:", svcErr);
        }
      }

      // 3. Atualiza o estado global no Zustand
      completeOnboarding({
        businessName: formData.businessName || 'Meu Estabelecimento',
        responsibleName: formData.responsibleName || 'Gestor(a)',
        whatsapp: formData.whatsapp,
        segment: formData.segment
      });

      // 4. Redireciona para o Dashboard com o nome personalizado
      navigate('/');
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header com Progresso */}
      <div className="max-w-xl mx-auto w-full text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-wide uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Configuração Guiada em 3 Passos
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Personalize sua experiência
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Configuraremos o robô do WhatsApp e seus serviços sob medida para seu nicho.
        </p>

        {/* Progress Bar Indicators */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-200 text-slate-500'
            }`}>
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className={`text-xs font-semibold ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
              Credenciais
            </span>
          </div>

          <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>

          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-200 text-slate-500'
            }`}>
              {step > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <span className={`text-xs font-semibold ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
              Seu Negócio
            </span>
          </div>

          <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>

          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 3 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-200 text-slate-500'
            }`}>
              3
            </div>
            <span className={`text-xs font-semibold ${step >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
              Segmento
            </span>
          </div>
        </div>
      </div>

      {/* Card do Formulário */}
      <div className="max-w-xl mx-auto w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
        {/* PASSO 1: CREDENCIAIS */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Passo 1: Seus Dados de Acesso</h2>
              <p className="text-xs text-slate-500 mt-0.5">Identifique quem é o administrador do sistema</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nome do Responsável
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Matheus Augusto"
                  value={formData.responsibleName}
                  onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                E-mail Profissional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Campo Honeypot invisível contra bots */}
            <input 
              type="text" 
              name="bot_security_honeypot" 
              value={formData.honeypot || ''} 
              onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })} 
              tabIndex={-1} 
              autoComplete="off" 
              className="hidden" 
              style={{ display: 'none' }} 
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Senha Segura
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const pass = generateStrongPassword(16);
                    setFormData({ ...formData, password: pass });
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Sugerir Senha Forte
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
                />
              </div>

              {formData.password && (
                <div className="mt-2 space-y-1">
                  {(() => {
                    const evalRes = evaluatePasswordStrength(formData.password);
                    return (
                      <>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Força da Senha:</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${evalRes.color}`}>
                            {evalRes.label}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${evalRes.barColor}`} 
                            style={{ width: evalRes.width }}
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3.5 rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Avançar para Identidade</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* PASSO 2: IDENTIDADE DO NEGÓCIO */}
        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-4 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Passo 2: Seu Estabelecimento</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Este nome aparecerá com destaque principal no topo do seu painel e nas mensagens do WhatsApp.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nome do Estabelecimento / Empresa
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Studio Bella Unhas ou Barbearia Central"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                WhatsApp do Estabelecimento (DDD + Número)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="(11) 99999-9999"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-4 py-3 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3.5 rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Avançar para Segmento</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* PASSO 3: SEGMENTO DE ATUAÇÃO COM SEED AUTOMÁTICO */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Passo 3: Qual é o seu segmento?</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Vamos pré-carregar serviços e preços comuns da sua área para você não começar do zero!
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {SEGMENTS.map((seg) => {
                const isSelected = formData.segment === seg.id;
                return (
                  <div
                    key={seg.id}
                    onClick={() => setFormData({ ...formData, segment: seg.id })}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{seg.icon}</span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{seg.title}</h4>
                        <p className="text-[11px] text-slate-500">{seg.description}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Prévia dos Serviços Pré-preenchidos */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-2">
                ✨ Procedimentos que vamos carregar para você:
              </span>
              <div className="space-y-1.5">
                {selectedSegmentObj.defaultServices.map((svc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-medium">• {svc.name}</span>
                    <span className="font-bold text-slate-900">R$ {svc.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                * Você poderá editar valores, nomes ou adicionar novos a qualquer momento.
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 px-4 py-3 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="flex-2 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Concluir e Abrir Painel</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Informação sobre 30 dias de teste */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>30 dias grátis no Plano Pro liberados imediatamente</span>
        </div>
      </div>
    </div>
  );
}

