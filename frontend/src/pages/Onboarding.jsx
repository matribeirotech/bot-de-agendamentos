import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { SEGMENTS } from '../lib/segmentSeeds';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import axios from 'axios';
import {
  Sparkles,
  ArrowRight,
  Check,
  User,
  Mail,
  Lock,
  Phone,
  CheckCircle2,
  ShieldCheck,
  Store,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { evaluatePasswordStrength, generateStrongPassword, BotDefense } from '../lib/security';
import { SegmentIconBadge, ServiceIconBadge } from '../components/ui/SegmentServiceIcon';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const saveUserProfile = useAppStore((state) => state.saveUserProfile);

  const [formData, setFormData] = useState({
    responsibleName: '',
    email: '',
    password: '',
    businessName: '',
    whatsapp: '',
    segment: 'manicure',
    honeypot: '',
  });

  const selectedSegmentObj = SEGMENTS.find((s) => s.id === formData.segment) || SEGMENTS[0];
  const passwordEvaluation = evaluatePasswordStrength(formData.password);

  const handleNext = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (BotDefense.isHoneypotTriggered(formData.honeypot)) {
      setErrorMsg('Não foi possível avançar agora. Tente novamente.');
      return;
    }

    if (step === 1 && formData.password.length < 8) {
      setErrorMsg('Sua senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinish = async () => {
    if (BotDefense.isHoneypotTriggered(formData.honeypot)) {
      setErrorMsg('Não foi possível concluir o cadastro agora. Tente novamente.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanBusiness = formData.businessName.trim() || 'Meu Estabelecimento';
    const cleanResponsible = formData.responsibleName.trim() || 'Gestor(a)';
    const cleanWhatsapp = formData.whatsapp.trim();

    try {
      // 1. Cria conta no Supabase caso esteja configurado
      if (isSupabaseConfigured()) {
        try {
          await supabase.auth.signUp({
            email: cleanEmail,
            password: formData.password,
            options: {
              data: {
                nome_completo: cleanResponsible,
                nome_salao: cleanBusiness,
                whatsapp: cleanWhatsapp,
                segmento: formData.segment,
              },
            },
          });
        } catch (authErr) {
          if (import.meta.env.DEV) {
            console.warn('Supabase signup skip:', authErr);
          }
        }
      }

      // 2. Carrega serviços iniciais do ramo escolhido no backend
      const token = btoa('admin:admin');
      try {
        await axios.post(
          'http://localhost:8000/api/v1/services/change_segment/',
          { segment: formData.segment },
          { headers: { Authorization: `Basic ${token}` } }
        );
      } catch {
        for (const svc of selectedSegmentObj.defaultServices) {
          try {
            await axios.post(
              'http://localhost:8000/api/v1/services/',
              {
                name: svc.name,
                price: svc.price,
                duration_minutes: svc.duration_minutes,
                is_active: true,
              },
              { headers: { Authorization: `Basic ${token}` } }
            );
          } catch {}
        }
      }

      // 3. Salva perfil completo em todas as camadas (local + nuvem + bot)
      const profilePayload = {
        email: cleanEmail,
        businessName: cleanBusiness,
        responsibleName: cleanResponsible,
        whatsapp: cleanWhatsapp,
        segment: formData.segment,
      };

      completeOnboarding(profilePayload);
      await saveUserProfile(profilePayload);

      navigate('/');
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(err);
      }
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const stepsMeta = [
    { num: 1, label: 'Conta' },
    { num: 2, label: 'Negócio' },
    { num: 3, label: 'Ramo' },
  ];

  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Cabeçalho Compacto */}
      <div className="max-w-lg mx-auto w-full text-center mb-6">
        <div className="flex items-center justify-between mb-5">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img
              src="/logo-lypsyos-zenda-r1.svg"
              alt="Zenda"
              className="w-9 h-9 rounded-xl object-contain bg-surface dark:bg-slate-900 p-1 border border-line dark:border-slate-800 shadow-2xs"
            />
            <span className="font-heading text-lg font-extrabold text-ink dark:text-white tracking-tight">
              Zenda
            </span>
          </Link>

          <Link
            to="/login"
            className="text-xs font-semibold text-brand dark:text-blue-400 hover:underline py-1.5 px-2.5 rounded-lg"
          >
            Já tenho conta →
          </Link>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft dark:bg-blue-950/50 border border-brand/20 text-brand dark:text-blue-300 text-[11px] font-bold mb-2.5">
          <Sparkles className="w-3.5 h-3.5" />
          Pronto em menos de 2 minutos
        </span>

        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink dark:text-white tracking-tight">
          Configure seu espaço
        </h1>
        <p className="text-ink-soft dark:text-slate-400 text-xs sm:text-sm mt-1">
          Deixamos sua agenda e seu atendimento no WhatsApp prontos para uso.
        </p>

        {/* Indicador de Passos Responsivo (360px safe) */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mt-5">
          {stepsMeta.map((item, idx) => {
            const active = step >= item.num;
            const done = step > item.num;
            return (
              <div key={item.num} className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      active
                        ? 'bg-brand text-white shadow-sm shadow-brand/25'
                        : 'bg-slate-200 dark:bg-slate-800 text-ink-muted'
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : item.num}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      active ? 'text-ink dark:text-white' : 'text-ink-muted dark:text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {idx < stepsMeta.length - 1 && (
                  <div
                    className={`w-6 sm:w-10 h-0.5 rounded-full ${
                      step > item.num ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Card do Formulário */}
      <div className="max-w-lg mx-auto w-full bg-surface dark:bg-slate-900 p-5 sm:p-8 rounded-3xl border border-line dark:border-slate-800 shadow-soft">
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PASSO 1: CONTA */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-ink dark:text-white">
                Seus dados de acesso
              </h2>
              <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                Use seu melhor e-mail para acessar sua agenda de qualquer lugar.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink dark:text-slate-200 mb-1.5">
                Seu nome
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Ex: Camila Rocha"
                  value={formData.responsibleName}
                  onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                  className="w-full min-h-11 pl-10 pr-4 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-950 text-ink dark:text-white border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink dark:text-slate-200 mb-1.5">
                Seu e-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full min-h-11 pl-10 pr-4 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-950 text-ink dark:text-white border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
            </div>

            <input
              type="text"
              name="company_fax_check"
              value={formData.honeypot}
              onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              style={{ display: 'none' }}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-ink dark:text-slate-200">
                  Crie uma senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const pass = generateStrongPassword(14);
                    setFormData({ ...formData, password: pass });
                    setShowPassword(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Sugerir senha
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full min-h-11 pl-10 pr-11 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-950 text-ink dark:text-white border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink-soft dark:text-slate-400 font-medium">Nível da senha:</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${passwordEvaluation.color}`}>
                      {passwordEvaluation.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordEvaluation.barColor}`}
                      style={{ width: passwordEvaluation.width }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full min-h-12 flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-semibold text-sm py-3.5 rounded-xl shadow-md shadow-brand/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* PASSO 2: NEGÓCIO */}
        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-ink dark:text-white">
                Sobre o seu negócio
              </h2>
              <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                Esse nome aparecerá para seus clientes nas mensagens automáticas.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink dark:text-slate-200 mb-1.5">
                Nome do espaço ou estúdio
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Studio Bela Unha ou Barbearia Central"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full min-h-11 pl-10 pr-4 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-950 text-ink dark:text-white border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink dark:text-slate-200 mb-1.5">
                WhatsApp de atendimento (DDD + número)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full min-h-11 pl-10 pr-4 py-2.5 text-base sm:text-sm bg-canvas dark:bg-slate-950 text-ink dark:text-white border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="min-h-12 px-5 py-3 text-xs font-semibold text-ink-soft dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 min-h-12 flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-semibold text-sm py-3.5 rounded-xl shadow-md shadow-brand/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Escolher meu ramo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* PASSO 3: RAMO DE ATUAÇÃO */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-ink dark:text-white">
                Qual é o seu ramo?
              </h2>
              <p className="text-xs text-ink-soft dark:text-slate-400 mt-0.5">
                Já deixamos sugestões de serviços prontas para você começar rápido.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[270px] overflow-y-auto pr-1">
              {SEGMENTS.map((seg) => {
                const isSelected = formData.segment === seg.id;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, segment: seg.id })}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-brand bg-brand-soft/60 dark:bg-blue-950/40 shadow-2xs'
                        : 'border-line dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <SegmentIconBadge segmentId={seg.id} size="sm" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-ink dark:text-white truncate">
                          {seg.title}
                        </h4>
                        <p className="text-[11px] text-ink-soft dark:text-slate-400 truncate">
                          {seg.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-brand text-white'
                          : 'border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Prévia dos Serviços */}
            <div className="bg-canvas dark:bg-slate-950/70 p-3.5 rounded-2xl border border-line dark:border-slate-800">
              <span className="text-[11px] font-bold text-brand dark:text-blue-400 block mb-2">
                Serviços iniciais incluídos (você pode editar depois):
              </span>
              <div className="space-y-1.5">
                {selectedSegmentObj.defaultServices.map((svc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 text-xs text-ink-soft dark:text-slate-300"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <ServiceIconBadge serviceName={svc.name} segmentId={formData.segment} size="xs" />
                      <span className="font-medium text-ink dark:text-white truncate">{svc.name}</span>
                    </span>
                    <span className="font-bold text-growth-text dark:text-emerald-400 shrink-0">
                      R$ {svc.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-1 flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="min-h-12 px-5 py-3 text-xs font-semibold text-ink-soft dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 min-h-12 flex items-center justify-center gap-2 bg-growth hover:bg-emerald-600 text-white font-semibold text-sm py-3.5 rounded-xl shadow-md shadow-growth/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Concluir e abrir agenda</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-5 pt-4 border-t border-line dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-ink-muted dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-growth shrink-0" />
          <span>30 dias grátis liberados na hora, sem compromisso</span>
        </div>
      </div>
    </div>
  );
}
