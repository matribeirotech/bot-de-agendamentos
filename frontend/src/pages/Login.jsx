import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { 
  Sparkles, CheckCircle2, Lock, Mail, User, Phone, 
  Building2, ArrowRight, ShieldCheck, AlertCircle, KeyRound
} from 'lucide-react';
import { evaluatePasswordStrength, generateStrongPassword, BotDefense } from '../lib/security';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [salonName, setSalonName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const passwordEvaluation = evaluatePasswordStrength(password);

  const handleSuggestPassword = () => {
    const generated = generateStrongPassword(16);
    setPassword(generated);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Trava de Segurança Anti-Bot
    if (BotDefense.isHoneypotTriggered(honeypot)) {
      setErrorMsg("Tentativa de submissão automatizada bloqueada pelo sistema de segurança.");
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setErrorMsg("⚠️ Chave do Supabase ausente! Abra o arquivo 'frontend/.env', cole a sua 'anon public key' e reinicie o Vite com 'npm run dev'.");
      setLoading(false);
      return;
    }

    if (isSignUp && !passwordEvaluation.isValid) {
      setErrorMsg("Por favor, escolha uma senha mais forte com pelo menos 8 caracteres.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Cadastro no Supabase Auth com metadados para popular a tabela 'usuarios' e criar o Trial de 30 dias
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome_completo: fullName,
              nome_salao: salonName,
              whatsapp: whatsapp
            }
          }
        });

        if (error) throw error;

        if (data?.user) {
          await useAppStore.getState().saveUserProfile({
            email,
            responsibleName: fullName,
            businessName: salonName,
            whatsapp: whatsapp
          });
        }

        setSuccessMsg("Conta criada com sucesso! Você ganhou 30 dias de acesso Pro grátis. Redirecionando...");
        setTimeout(() => navigate('/'), 2000);
      } else {
        // Login com e-mail e senha
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        // Sincroniza imediatamente o perfil do usuário logado
        await useAppStore.getState().loadUserProfile(email);

        navigate('/');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || "Falha na autenticação. Verifique os dados inseridos.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      setErrorMsg("Erro ao conectar com o Google: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Container Centralizado */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo Oficial Lypsyos */}
        <Link to="/" className="inline-flex items-center gap-3 group mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/>
              <line x1="8.2" y1="13.2" x2="15.8" y2="17.8"/><line x1="8.2" y1="10.8" x2="15.8" y2="6.2"/>
            </svg>
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">Lypsyos</span>
        </Link>

        {/* Badge de Trial */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            30 Dias de Teste Grátis no Plano Pro
          </span>
        </div>

        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          {isSignUp ? "Crie sua conta profissional" : "Acesse seu painel de gestão"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isSignUp 
            ? "Configure seu robô de manicure em menos de 2 minutos" 
            : "Gerencie seus horários, robô e clientes no WhatsApp"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          {/* Alerta de Configuração Inicial do Supabase */}
          {!isSupabaseConfigured() && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Conexão Supabase Pendente</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Cole a sua <strong>anon public key</strong> no arquivo <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-[11px]">frontend/.env</code> e reinicie o terminal do Vite (<code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-[11px]">npm run dev</code>).
              </p>
            </div>
          )}

          {/* Mensagens de Feedback */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-700 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-800 font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Social Login (Google) */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
          >
            {/* Google Icon SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            Continuar com o Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
              <span className="bg-white px-4 text-slate-400">ou com e-mail</span>
            </div>
          </div>

          {/* Formulário Principal */}
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Seu Nome Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Amanda Silva"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nome do Salão ou Espaço
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Studio Bella Unhas"
                      value={salonName}
                      onChange={(e) => setSalonName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    WhatsApp Comercial (DDD + Número)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="(11) 99999-9999"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Campo Honeypot invisível para travar bots */}
            <input 
              type="text" 
              name="anti_bot_tax_id" 
              value={honeypot} 
              onChange={(e) => setHoneypot(e.target.value)} 
              tabIndex={-1} 
              autoComplete="off" 
              className="hidden" 
              style={{ display: 'none' }} 
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Senha
                </label>
                {isSignUp && (
                  <button
                    type="button"
                    onClick={handleSuggestPassword}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Sugerir Senha Forte
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
                />
              </div>

              {isSignUp && password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Segurança da senha:</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${passwordEvaluation.color}`}>
                      {passwordEvaluation.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordEvaluation.barColor}`} 
                      style={{ width: passwordEvaluation.width }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botão de Envio */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3.5 rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{isSignUp ? "Iniciar 30 Dias Grátis" : "Entrar no Sistema"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Alternar entre Login e Cadastro */}
          <div className="mt-6 text-center pt-4 border-t border-slate-100">
            <Link
              to="/onboarding"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              Ainda não tem conta? Faça o cadastro guiado (30 dias grátis) →
            </Link>
          </div>
        </div>

        {/* Garantias / Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Sem cartão de crédito
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Cancele a qualquer momento
          </span>
        </div>
      </div>
    </div>
  );
}

