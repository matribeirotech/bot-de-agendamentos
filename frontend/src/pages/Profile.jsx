import { useState, useRef, useEffect } from 'react';
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
  ShieldAlert, BadgeCheck, Store, Upload, Trash2, ArrowRight,
  Sun, Moon, Sliders, CheckCheck
} from 'lucide-react';

const THEME_PRESETS = [
  { name: 'Azul Lypsyos', hex: '#2563eb', bg: 'bg-blue-600' },
  { name: 'Roxo Royal', hex: '#7c3aed', bg: 'bg-purple-600' },
  { name: 'Rosa Quartz', hex: '#db2777', bg: 'bg-pink-600' },
  { name: 'Esmeralda', hex: '#059669', bg: 'bg-emerald-600' },
  { name: 'Âmbar Dourado', hex: '#d97706', bg: 'bg-amber-600' },
  { name: 'Índigo Moderno', hex: '#4f46e5', bg: 'bg-indigo-600' },
  { name: 'Carmim Ruby', hex: '#e11d48', bg: 'bg-rose-600' },
  { name: 'Grafite Elegance', hex: '#334155', bg: 'bg-slate-700' },
];

// Utilitário para compactar e redimensionar imagens antes de salvar (mantém avatar leve < 15KB)
const compressImage = (file, maxWidth = 256, maxHeight = 256, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { 
    responsibleName, email, whatsapp, businessName, segment, 
    avatarUrl, pixKey, pixType, themeColor, themeMode, bio, 
    setSegment, logout, subscription,
    saveUserProfile, loadUserProfile, setThemeMode, setThemeColor
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
    themeMode: themeMode || 'light',
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

  // Honeypot para proteção contra bots
  const [honeypot, setHoneypot] = useState('');

  // Avaliação da força da senha
  const passwordEvaluation = evaluatePasswordStrength(newPassword);

  // Carrega os dados mais recentes do perfil na montagem
  useEffect(() => {
    loadUserProfile().then((loaded) => {
      if (loaded && Object.keys(loaded).length > 0) {
        setFormData(prev => ({
          ...prev,
          responsibleName: loaded.responsibleName || prev.responsibleName,
          email: loaded.email || prev.email,
          whatsapp: loaded.whatsapp || prev.whatsapp,
          businessName: loaded.businessName || prev.businessName,
          segment: loaded.segment || prev.segment,
          avatarUrl: loaded.avatarUrl || prev.avatarUrl,
          pixKey: loaded.pixKey || prev.pixKey,
          pixType: loaded.pixType || prev.pixType,
          themeColor: loaded.themeColor || prev.themeColor,
          themeMode: loaded.themeMode || prev.themeMode,
          bio: loaded.bio || prev.bio,
        }));
      }
    });

    // Se o email local estiver vazio, busca do usuário autenticado no Supabase
    if (isSupabaseConfigured()) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          setFormData(prev => ({
            ...prev,
            email: prev.email || user.email
          }));
        }
      });
    }
  }, [loadUserProfile]);

  // Upload Otimizado da Foto de Perfil com Redimensionamento Automático
  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'A imagem deve ter no máximo 10MB.' });
      return;
    }

    try {
      setStatusMessage({ type: 'info', text: 'Otimizando foto de perfil...' });
      // Redimensiona para max 256x256 mantendo proporção (~10KB em JPEG)
      const compressedDataUrl = await compressImage(file, 256, 256, 0.82);
      const nextData = { ...formData, avatarUrl: compressedDataUrl };
      setFormData(nextData);
      await saveUserProfile(nextData);

      setStatusMessage({ type: 'success', text: 'Foto de perfil salva com sucesso!' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      setStatusMessage({ type: 'error', text: 'Não foi possível processar a imagem. Tente outro arquivo.' });
    }
  };

  // Remover Foto de Perfil
  const handleRemoveAvatar = async () => {
    const nextData = { ...formData, avatarUrl: '' };
    setFormData(nextData);
    await saveUserProfile(nextData);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStatusMessage({ type: 'success', text: 'Foto de perfil removida.' });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
  };

  // Sincronizar Serviços do Segmento no Backend
  const syncSegmentServices = async (targetSegment) => {
    setIsSyncingSegment(true);
    const token = btoa('admin:admin');
    try {
      await axios.post('http://localhost:8000/api/v1/services/change_segment/', {
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

  // Troca de Modo de Tema (Claro, Escuro, Personalizado)
  const handleSelectThemeMode = (mode) => {
    setFormData(prev => ({ ...prev, themeMode: mode }));
    setThemeMode(mode);
  };

  // Troca de Cor do Tema
  const handleSelectThemeColor = (color) => {
    setFormData(prev => ({ ...prev, themeColor: color }));
    setThemeColor(color);
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

  // Salvar Informações do Perfil Completo
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
      const dataToSave = {
        ...formData,
        responsibleName: (formData.responsibleName || '').trim(),
        whatsapp: (formData.whatsapp || '').trim(),
        businessName: (formData.businessName || '').trim(),
        email: (formData.email || email || '').trim(),
      };
      if (!dataToSave.email && isSupabaseConfigured()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          dataToSave.email = user.email;
        }
      }

      // Salva em todas as camadas (Store, LocalStorage global e por e-mail, Supabase e Backend Django)
      await saveUserProfile(dataToSave);
      setSegment(dataToSave.segment);

      // Sincroniza serviços do segmento no Backend
      await syncSegmentServices(dataToSave.segment);

      setStatusMessage({ 
        type: 'success', 
        text: '✅ Perfil, tema e catálogo de serviços salvos com sucesso!' 
      });
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
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
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (error) throw error;
      }

      setStatusMessage({ 
        type: 'success', 
        text: 'Senha alterada com sucesso! Utilize a nova senha no próximo acesso.' 
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setStatusMessage({ 
        type: 'error', 
        text: err.message || 'Falha ao atualizar a senha.' 
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    }
  };

  // Executar Logout
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12 transition-colors duration-200">
      {/* Campo Honeypot Oculto (Anti-Bot) */}
      <input
        type="text"
        name="honeypot"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Toast de Feedback */}
      {statusMessage.text && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-semibold transition-all transform animate-bounce ${
          statusMessage.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {statusMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Header do Perfil */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold tracking-wide uppercase mb-3">
            <User className="w-3.5 h-3.5" />
            Minha Conta & Identidade
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Meu <span style={{ color: formData.themeColor || '#2563eb' }}>Perfil</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm md:text-base max-w-2xl">
            Gerencie suas credenciais de acesso, temas visuais, dados do seu negócio e foto de perfil.
          </p>
        </div>

        {/* Botão de Logout */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: CARD DO PERFIL & UPLOAD REAL DA FOTO */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs text-center space-y-4">
            
            {/* Header Visual com Cor do Tema */}
            <div 
              className="h-24 -mx-6 -mt-6 rounded-t-3xl relative transition-colors duration-200"
              style={{ 
                background: `linear-gradient(135deg, ${formData.themeColor || '#2563eb'} 0%, #1e1b4b 100%)` 
              }}
            >
              <span className="absolute top-3 right-3 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                {formData.themeMode === 'dark' ? 'Modo Escuro' : formData.themeMode === 'custom' ? 'Personalizado' : 'Modo Claro'}
              </span>
            </div>

            {/* Avatar Real com Botão de Foto */}
            <div className="relative inline-block -mt-16">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Foto de Perfil"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-md mx-auto"
                />
              ) : (
                <div 
                  className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center text-3xl font-bold mx-auto transition-colors"
                  style={{ 
                    backgroundColor: `${formData.themeColor || '#2563eb'}20`, 
                    color: formData.themeColor || '#2563eb' 
                  }}
                >
                  {formData.responsibleName ? formData.responsibleName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              {/* Botão de Câmera para troca rápida */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Alterar foto"
                style={{ backgroundColor: formData.themeColor || '#2563eb' }}
                className="absolute bottom-0 right-0 text-white p-2 rounded-full shadow-lg hover:opacity-90 transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleAvatarFileUpload}
              className="hidden"
            />

            <div>
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
                {formData.businessName || 'Meu Estabelecimento'}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {formData.responsibleName || 'Responsável'}
              </p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                <BadgeCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Plano PRO • 30 Dias Grátis</span>
              </div>
            </div>

            {/* Ações de Foto */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Fazer Upload da Foto</span>
              </button>
              {formData.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover Foto</span>
                </button>
              )}
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Suporta PNG, JPG ou WebP de até 5MB
              </p>
            </div>
          </div>

          {/* Card de Proteção & Segurança */}
          <div className="bg-slate-900 dark:bg-slate-900 text-white rounded-3xl p-5 shadow-sm space-y-3 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Lypsyos Security Guard</h4>
                <p className="text-[10px] text-slate-400">Proteção perimetral ativa</p>
              </div>
            </div>
            <ul className="text-xs space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Travas anti-scraping e armadilhas honeypot</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rate-limiting contra robôs de força bruta</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Criptografia de ponta a ponta (Supabase Auth)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bloqueio contra abuso infinito de trial</span>
              </li>
            </ul>
          </div>
        </div>

        {/* COLUNA DIREITA: DADOS DO NEGÓCIO, APARÊNCIA & SEGURANÇA */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Seção 1: Identidade do Negócio */}
          <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center border"
                  style={{ 
                    backgroundColor: `${formData.themeColor || '#2563eb'}18`,
                    borderColor: `${formData.themeColor || '#2563eb'}30`,
                    color: formData.themeColor || '#2563eb'
                  }}
                >
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Identidade do Negócio</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Como seu negócio se apresenta para as clientes</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving || isSyncingSegment}
                style={{ backgroundColor: formData.themeColor || '#2563eb' }}
                className="inline-flex items-center gap-2 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50 hover:opacity-90"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving || isSyncingSegment ? "Salvando..." : "Salvar Dados"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white transition-all font-medium"
                  />
                </div>
              </div>

              {/* SELEÇÃO DO SEGMENTO COM SINCRONIZAÇÃO AUTOMÁTICA DOS SERVIÇOS */}
              <div className="md:col-span-2 bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100/80 dark:border-blue-900/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                    Segmento de Atuação
                  </label>
                  {isSyncingSegment && (
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Atualizando catálogo de serviços...
                    </span>
                  )}
                </div>
                
                <select
                  name="segment"
                  value={formData.segment}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-blue-200 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white dark:bg-slate-800 transition-all font-semibold text-slate-800 dark:text-white"
                >
                  {SEGMENTS.map(seg => (
                    <option key={seg.id} value={seg.id}>
                      {seg.icon} {seg.title}
                    </option>
                  ))}
                </select>

                <div className="mt-2.5 flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300 bg-white/80 dark:bg-slate-850 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Atualização Automática:</strong> Ao mudar para <strong>{selectedSegmentObj.title}</strong>, os serviços da aba <em>Serviços</em> são substituídos pelos procedimentos padrão desta área (ex: {selectedSegmentObj.defaultServices.map(s => s.name).slice(0, 2).join(', ')}...).
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Tipo da Chave PIX
                </label>
                <select
                  name="pixType"
                  value={formData.pixType}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white transition-all font-medium"
                >
                  <option value="TELEFONE">Celular / WhatsApp</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="ALEATORIA">Chave Aleatória</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Bio / Mensagem de Boas-Vindas do Robô
              </label>
              <textarea
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Conte brevemente sobre o seu negócio. Essa mensagem será utilizada nas saudações do robô."
                className="w-full p-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white transition-all resize-none font-medium"
              />
            </div>
          </form>

          {/* Seção 2: Aparência & Tema (Dark Mode, Light Mode e Custom Brand) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center border"
                  style={{ 
                    backgroundColor: `${formData.themeColor || '#2563eb'}18`,
                    borderColor: `${formData.themeColor || '#2563eb'}30`,
                    color: formData.themeColor || '#2563eb'
                  }}
                >
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Aparência & Modo Visual</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Escolha entre Modo Claro, Escuro ou Personalize as cores do app</p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {formData.themeMode === 'dark' ? '🌙 Escuro Ativo' : formData.themeMode === 'custom' ? '🎨 Personalizado' : '☀️ Claro Ativo'}
              </span>
            </div>

            {/* 3 Modos: Claro, Escuro e Personalizado */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3">
                Modo de Exibição da Interface
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* 1. Modo Claro */}
                <button
                  type="button"
                  onClick={() => handleSelectThemeMode('light')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    formData.themeMode === 'light'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                      <Sun className="w-5 h-5" />
                    </div>
                    {formData.themeMode === 'light' && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Modo Claro</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Fundo claro, alto contraste e visual limpo para o dia a dia.
                    </p>
                  </div>
                </button>

                {/* 2. Modo Escuro */}
                <button
                  type="button"
                  onClick={() => handleSelectThemeMode('dark')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    formData.themeMode === 'dark'
                      ? 'border-indigo-500 bg-slate-900 text-white ring-2 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center border border-slate-700">
                      <Moon className="w-5 h-5" />
                    </div>
                    {formData.themeMode === 'dark' && (
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Modo Escuro</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Visual escuro moderno, conforto visual e economia de bateria.
                    </p>
                  </div>
                </button>

                {/* 3. Modo Personalizado */}
                <button
                  type="button"
                  onClick={() => handleSelectThemeMode('custom')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    formData.themeMode === 'custom'
                      ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 ring-2 ring-pink-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center border"
                      style={{ 
                        backgroundColor: `${formData.themeColor || '#2563eb'}20`,
                        color: formData.themeColor || '#2563eb',
                        borderColor: `${formData.themeColor || '#2563eb'}40`
                      }}
                    >
                      <Palette className="w-5 h-5" />
                    </div>
                    {formData.themeMode === 'custom' && (
                      <span className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Personalizado</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Destaque sua marca com sua cor própria e exclusiva.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Cores Pré-definidas e Seletor HEX Nativo */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Cor Primária de Destaque
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cor Selecionada:</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    {formData.themeColor || '#2563eb'}
                  </span>
                </div>
              </div>

              {/* Grid de Cores Rápidas */}
              <div className="flex flex-wrap items-center gap-2.5">
                {THEME_PRESETS.map(color => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => handleSelectThemeColor(color.hex)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      formData.themeColor.toLowerCase() === color.hex.toLowerCase()
                        ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-400/20 text-slate-900 dark:text-white' 
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${color.bg}`} />
                    <span>{color.name}</span>
                  </button>
                ))}

                {/* Seletor Customizado com Color Picker Nativo */}
                <div className="flex items-center gap-2 ml-auto">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Outra Cor:</span>
                  </label>
                  <input
                    type="color"
                    value={formData.themeColor || '#2563eb'}
                    onChange={(e) => handleSelectThemeColor(e.target.value)}
                    className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 cursor-pointer bg-white dark:bg-slate-800"
                    title="Escolha qualquer cor personalizada da sua marca"
                  />
                </div>
              </div>

              {/* Mini Preview do Tema */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs font-bold"
                    style={{ backgroundColor: formData.themeColor || '#2563eb' }}
                  >
                    {formData.businessName ? formData.businessName.charAt(0) : 'L'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">Prévia em Tempo Real</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Botões, ícones ativos e destaques adotam este padrão automaticamente.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span 
                    style={{ backgroundColor: `${formData.themeColor || '#2563eb'}20`, color: formData.themeColor || '#2563eb' }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                  >
                    Badge Ativa
                  </span>
                  <button
                    type="button"
                    style={{ backgroundColor: formData.themeColor || '#2563eb' }}
                    className="text-white text-xs font-bold px-3 py-1 rounded-lg shadow-xs"
                  >
                    Botão de Ação
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Alteração de Senha & Segurança */}
          <form onSubmit={handleUpdatePassword} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Segurança da Senha</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Crie senhas robustas para proteger seus clientes</p>
                </div>
              </div>

              {/* Botão de Sugerir Senha Forte */}
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Gera uma senha com letras, números e símbolos sem repetições"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{passwordCopied ? "Copiada!" : "Sugerir Senha Forte"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Medidor Visual de Força da Senha */}
            {newPassword && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-300">Força da Senha:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${passwordEvaluation.color}`}>
                    {passwordEvaluation.label}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${passwordEvaluation.barColor}`} 
                    style={{ width: passwordEvaluation.width }}
                  />
                </div>
                {passwordEvaluation.feedback.length > 0 && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {passwordEvaluation.feedback.join(' • ')}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving || !newPassword}
                className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 border border-slate-100 dark:border-slate-800 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900">
              <LogOut className="w-6 h-6" />
            </div>
            
            <div className="text-center">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Deseja realmente sair?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sua sessão no <strong>{formData.businessName}</strong> será encerrada. Todos os seus dados permanecem salvos com segurança.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
