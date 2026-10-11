import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppStore } from '../store/useAppStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { evaluatePasswordStrength, generateStrongPassword, BotDefense } from '../lib/security';
import { SEGMENTS } from '../lib/segmentSeeds';
import { 
  User, Lock, Mail, Phone, Camera, Sparkles, ShieldCheck, 
  KeyRound, Copy, Check, Palette, Building2, QrCode, LogOut, 
  RefreshCw, AlertCircle, Eye, EyeOff, Save, CheckCircle2, 
  ShieldAlert, BadgeCheck, Store, Upload, Trash2, ArrowRight
} from 'lucide-react';

const THEME_COLORS = [
  { name: 'Azul Lypsyos', hex: '#2563eb', bg: 'bg-blue-600' },
  { name: 'Roxo Royal', hex: '#7c3aed', bg: 'bg-purple-600' },
  { name: 'Rosa Quartz', hex: '#db2777', bg: 'bg-pink-600' },
  { name: 'Esmeralda', hex: '#059669', bg: 'bg-emerald-600' },
  { name: 'Âmbar Dourado', hex: '#d97706', bg: 'bg-amber-600' },
  { name: 'Grafite Elegance', hex: '#334155', bg: 'bg-slate-700' },
];

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { 
    responsibleName, email, whatsapp, businessName, segment, 
    avatarUrl, pixKey, pixType, themeColor, bio, 
    updateProfile, setSegment, logout, subscription 
  } = useAppStore();

  // Estados locais de edição
  const [formData, setFormData] = useState({
    responsibleName: responsibleName || '',
    email: email || '',
    whatsapp: whatsapp || '',
    businessName: businessName || '',
    segment: segment || 'manicure',
    avatarUrl: avatarUrl || '',
    pixKey: pixKey || '',
    pixType: pixType || 'TELEFONE',
    themeColor: themeColor || '#2563eb',
    bio: bio || '',
  });

  // Estados para troca de senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Estados de feedback
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingSegment, setIsSyncingSegment] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Honeypot para proteção contra bots e scrapers
  const [honeypot, setHoneypot] = useState('');

  // Avaliação da força da senha
  const passwordEvaluation = evaluatePasswordStrength(newPassword);

  // Upload Real da Foto de Perfil
  const handleAvatarFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result;
      if (typeof base64Url === 'string') {
        setFormData(prev => ({ ...prev, avatarUrl: base64Url }));
        updateProfile({ avatarUrl: base64Url });

        // Sincroniza com Supabase se disponível
        if (isSupabaseConfigured()) {
          try {
            await supabase.auth.updateUser({
              data: { avatar_url: base64Url }
            });
          } catch (err) {
            console.warn("Supabase avatar sync error:", err);
          }
        }

        setStatusMessage({ type: 'success', text: 'Foto de perfil atualizada com sucesso!' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remover Foto de Perfil
  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatarUrl: '' }));
    updateProfile({ avatarUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStatusMessage({ type: 'success', text: 'Foto de perfil removida.' });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
  };

  // Sincronizar Serviços do Segmento no Backend
  const syncSegmentServices = async (targetSegment) => {
    setIsSyncingSegment(true);
    const token = btoa('admin:admin');
    try {
      const res = await axios.post('http://localhost:8000/api/v1/services/change_segment/', {
        segment: targetSegment
      }, {
        headers: { 'Authorization': `Basic ${token}` }
      });

      const selectedSeg = SEGMENTS.find(s => s.id === targetSegment);
      setStatusMessage({ 
        type: 'success', 
        text: `Catálogo atualizado! Os serviços padrão de "${selectedSeg?.title || targetSegment}" foram carregados com sucesso.` 
      });
      return true;
    } catch (err) {
      console.error("Erro ao sincronizar serviços do segmento:", err);
      return false;
    } finally {
      setIsSyncingSegment(false);
    }
  };

  // Manipulador de inputs
  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Se mudou o segmento no dropdown, dispara imediatamente a sincronização dos serviços do nicho
    if (name === 'segment' && value !== segment) {
      setSegment(value);
      await syncSegmentServices(value);
    }
  };

  // Gerador de senha forte com 1 clique
  const handleGeneratePassword = () => {
    const generated = generateStrongPassword(16);
    setNewPassword(generated);
    setConfirmPassword(generated);
    navigator.clipboard.writeText(generated);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 3000);
  };

  // Salvar Informações do Perfil
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage({ type: '', text: '' });

    // Trava de segurança Anti-Bot
    if (BotDefense.isHoneypotTriggered(honeypot)) {
      setStatusMessage({ type: 'error', text: 'Tentativa de submissão automatizada bloqueada.' });
      setIsSaving(false);
      return;
    }

    try {
      // 1. Atualiza no Zustand Store local
      updateProfile(formData);
      setSegment(formData.segment);

      // 2. Garante sincronização dos serviços do segmento no Backend
      await syncSegmentServices(formData.segment);

      // 3. Se o Supabase estiver configurado e o usuário logado, atualiza metadados ou tabela pública
      if (isSupabaseConfigured()) {
        try {
          const { error: authError } = await supabase.auth.updateUser({
            data: {
              nome_completo: formData.responsibleName,
              nome_salao: formData.businessName,
              whatsapp: formData.whatsapp,
              avatar_url: formData.avatarUrl,
              chave_pix: formData.pixKey,
              tipo_chave_pix: formData.pixType,
              cor_primaria: formData.themeColor,
              bio: formData.bio,
              segmento: formData.segment
            }
          });

          if (authError) console.warn("Supabase auth metadata update warn:", authError);

          // Atualiza também na tabela 'usuarios' se existir
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('usuarios').upsert({
              id: user.id,
              nome_completo: formData.responsibleName,
              nome_salao: formData.businessName,
              whatsapp: formData.whatsapp,
              avatar_url: formData.avatarUrl,
              chave_pix: formData.pixKey,
              tipo_chave_pix: formData.pixType,
              cor_primaria: formData.themeColor,
              bio: formData.bio,
              segmento: formData.segment,
              atualizado_em: new Date().toISOString()
            });
          }
        } catch (supaErr) {
          console.warn("Supabase sync warning:", supaErr);
        }
      }

      setStatusMessage({ 
        type: 'success', 
        text: 'Perfil e catálogo de serviços atualizados com sucesso!' 
      });
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setStatusMessage({ 
        type: 'error', 
        text: 'Ocorreu um erro ao salvar as alterações. Tente novamente.' 
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    }
  };

  // Alterar Senha da Conta
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;

    if (!passwordEvaluation.isValid) {
      setStatusMessage({ 
        type: 'error', 
        text: 'A nova senha não atende aos requisitos de segurança recomendados.' 
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ 
        type: 'error', 
        text: 'A confirmação de senha não confere.' 
      });
      return;
    }

    setIsSaving(true);
    setStatusMessage({ type: '', text: '' });

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (error) throw error;
      }

      setStatusMessage({ 
        type: 'success', 
        text: 'Senha alterada com sucesso! Guarde-a em local seguro.' 
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error("Erro ao alterar senha:", err);
      setStatusMessage({ 
        type: 'error', 
        text: err.message || 'Falha ao alterar senha no Supabase Auth.' 
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    }
  };

  // Sair da Conta (Logout)
  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      logout();
      navigate('/login');
    }
  };

  const selectedSegmentObj = SEGMENTS.find(s => s.id === formData.segment) || SEGMENTS[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase mb-2">
            <User className="w-3.5 h-3.5" />
            Configurações da Conta
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Meu Perfil & Personalização
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Gerencie suas credenciais de acesso, segurança da conta e a identidade visual do seu negócio.
          </p>
        </div>

        {/* Botão Sair da Conta em Destaque */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all shadow-2xs self-start md:self-auto cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>

      {/* Banner de Mensagens de Status */}
      {statusMessage.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: Avatar com Upload Real e Card de Segurança */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 right-0 h-24 opacity-80"
              style={{ backgroundColor: formData.themeColor }}
            />

            {/* Input Invisível para Upload de Arquivo */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/png, image/jpeg, image/jpg, image/webp" 
              onChange={handleAvatarFileUpload} 
              className="hidden" 
              id="avatar-file-upload-input" 
            />

            {/* Foto de Perfil com Ação de Clique Direto */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative mt-8 mb-4 group cursor-pointer"
              title="Clique para carregar uma foto do seu computador"
            >
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md group-hover:brightness-90 transition-all"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-all">
                  <User className="w-10 h-10" />
                </div>
              )}
              
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs border-2 border-white group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
            </div>

            <h3 className="font-extrabold text-slate-900 text-lg">{formData.businessName}</h3>
            <p className="text-xs text-slate-500 font-medium">{formData.responsibleName}</p>
            <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
              Plano {subscription?.plan || 'PRO'} • {subscription?.status === 'TRIAL' ? '30 Dias Grátis' : 'Ativo'}
            </span>

            {/* BOTÕES DE UPLOAD DE FOTO (SEM NENHUM PLACEHOLDER) */}
            <div className="w-full mt-6 pt-5 border-t border-slate-100 space-y-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-blue-200 transition-colors shadow-2xs cursor-pointer active:scale-98"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>{formData.avatarUrl ? "Alterar Foto de Perfil" : "Fazer Upload da Foto"}</span>
              </button>

              {formData.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-slate-500 hover:text-rose-600 font-medium text-xs py-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover foto</span>
                </button>
              )}

              <p className="text-[10px] text-slate-400">
                Suporta PNG, JPG ou WebP de até 5MB
              </p>
            </div>
          </div>

          {/* Card de Defesa e Segurança Ativa */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-md border border-slate-800">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Lypsyos Security Guard</h4>
                <p className="text-[11px] text-slate-400">Proteção perimetral ativa</p>
              </div>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 mt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Travas anti-scraping e armadilhas honeypot</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Rate-limiting contra robôs de força bruta</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Criptografia de ponta a ponta (Supabase Auth)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bloqueio contra abuso infinito de trial</span>
              </li>
            </ul>
          </div>
        </div>

        {/* COLUNA DIREITA: Formulários de Edição */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Seção 1: Dados do Estabelecimento e Personalização */}
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            
            {/* Campo Honeypot invisível para enganar bots maliciosos */}
            <input 
              type="text" 
              name="company_tax_confirm_id" 
              value={honeypot} 
              onChange={(e) => setHoneypot(e.target.value)} 
              tabIndex={-1} 
              autoComplete="off" 
              className="hidden" 
              style={{ display: 'none' }} 
            />

            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Identidade do Negócio</h3>
                  <p className="text-xs text-slate-500">Como seu negócio se apresenta para as clientes</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving || isSyncingSegment}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving || isSyncingSegment ? "Salvando..." : "Salvar Dados"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome do Estabelecimento
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Barbearia Central ou Studio Bella"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nome do(a) Responsável
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    name="responsibleName"
                    value={formData.responsibleName}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Matheus Augusto"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  E-mail da Conta
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  WhatsApp com DDD (Usado pelo Robô)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    required
                    placeholder="(11) 99999-9999"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                  />
                </div>
              </div>

              {/* SELEÇÃO DO SEGMENTO COM SINCRONIZAÇÃO AUTOMÁTICA DOS SERVIÇOS */}
              <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-blue-900">
                    Segmento de Atuação
                  </label>
                  {isSyncingSegment && (
                    <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Atualizando catálogo de serviços...
                    </span>
                  )}
                </div>
                
                <select
                  name="segment"
                  value={formData.segment}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white transition-all font-semibold text-slate-800"
                >
                  {SEGMENTS.map(seg => (
                    <option key={seg.id} value={seg.id}>
                      {seg.icon} {seg.title}
                    </option>
                  ))}
                </select>

                <div className="mt-2.5 flex items-start gap-2 text-xs text-blue-700 bg-white/80 p-2.5 rounded-xl border border-blue-100">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Atualização Automática:</strong> Ao mudar para <strong>{selectedSegmentObj.title}</strong>, os serviços da aba <em>Serviços</em> são substituídos pelos procedimentos padrão desta área (ex: {selectedSegmentObj.defaultServices.map(s => s.name).slice(0, 2).join(', ')}...).
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Tipo da Chave PIX
                </label>
                <select
                  name="pixType"
                  value={formData.pixType}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white transition-all font-medium"
                >
                  <option value="TELEFONE">Celular / WhatsApp</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="ALEATORIA">Chave Aleatória</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Chave PIX do Negócio
                </label>
                <div className="relative">
                  <QrCode className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    name="pixKey"
                    value={formData.pixKey}
                    onChange={handleInputChange}
                    placeholder="Ex: 11999999999 ou seu CPF/E-mail"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Seletor de Tema / Cor Primária do Negócio */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Cor Tema do Painel & Identidade Visual
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {THEME_COLORS.map(color => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, themeColor: color.hex }))}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      formData.themeColor === color.hex 
                        ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-400/20' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${color.bg}`} />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Bio / Mensagem de Boas-Vindas do Robô
              </label>
              <textarea
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Conte brevemente sobre o seu negócio. Essa mensagem será utilizada nas saudações do robô."
                className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none font-medium"
              />
            </div>
          </form>

          {/* Seção 2: Alteração de Senha & Segurança */}
          <form onSubmit={handleUpdatePassword} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Segurança da Senha</h3>
                  <p className="text-xs text-slate-500">Crie senhas robustas para proteger seus clientes</p>
                </div>
              </div>

              {/* Botão de Sugerir Senha Forte */}
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Gera uma senha com letras, números e símbolos sem repetições"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>{passwordCopied ? "Copiada!" : "Sugerir Senha Forte"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Medidor Visual de Força da Senha */}
            {newPassword && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Força da Senha:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${passwordEvaluation.color}`}>
                    {passwordEvaluation.label}
                  </span>
                </div>
                {/* Barra animada */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${passwordEvaluation.barColor}`} 
                    style={{ width: passwordEvaluation.width }}
                  />
                </div>
                {passwordEvaluation.feedback.length > 0 && (
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {passwordEvaluation.feedback.join(' • ')}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving || !newPassword}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Atualizar Senha</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Confirmação de Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 border border-slate-100 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <LogOut className="w-6 h-6" />
            </div>
            
            <div className="text-center">
              <h3 className="font-extrabold text-lg text-slate-900">Deseja realmente sair?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sua sessão no <strong>{formData.businessName}</strong> será encerrada. Você precisará fazer login novamente para acessar o painel.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleLogout}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-sm shadow-rose-500/20 cursor-pointer"
              >
                Sim, Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
