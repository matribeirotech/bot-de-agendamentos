import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppStore } from '../store/useAppStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { evaluatePasswordStrength, generateStrongPassword, BotDefense } from '../lib/security';
import { SEGMENTS } from '../lib/segmentSeeds';
import { SegmentIconBadge } from '../components/ui/SegmentServiceIcon';
import {
  User,
  Lock,
  Mail,
  Phone,
  Camera,
  Sparkles,
  KeyRound,
  Check,
  Palette,
  Building2,
  QrCode,
  LogOut,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  BadgeCheck,
  Store,
  Upload,
  Trash2,
  Sun,
  Moon,
  Sliders,
} from 'lucide-react';

const THEME_PRESETS = [
  { name: 'Azul Zenda', hex: '#2457f5' },
  { name: 'Roxo', hex: '#7c3aed' },
  { name: 'Rosa', hex: '#db2777' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Dourado', hex: '#d97706' },
  { name: 'Índigo', hex: '#4f46e5' },
  { name: 'Rubi', hex: '#e11d48' },
  { name: 'Grafite', hex: '#334155' },
];

// Compacta e redimensiona a foto de perfil antes de salvar (mantém leve e rápida)
const compressImage = (file, maxWidth = 256, maxHeight = 256, quality = 0.82) => {
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
        } else if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
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
    responsibleName,
    email,
    whatsapp,
    businessName,
    segment,
    avatarUrl,
    pixKey,
    pixType,
    themeColor,
    themeMode,
    bio,
    setSegment,
    logout,
    subscription,
    saveUserProfile,
    loadUserProfile,
    setThemeMode,
    setThemeColor,
  } = useAppStore();

  const [formData, setFormData] = useState({
    responsibleName: responsibleName || '',
    email: email || '',
    whatsapp: whatsapp || '',
    businessName: businessName || '',
    segment: segment || 'manicure',
    avatarUrl: avatarUrl || '',
    pixKey: pixKey || '',
    pixType: pixType || 'TELEFONE',
    themeColor: themeColor || '#2457f5',
    themeMode: themeMode || 'light',
    bio: bio || '',
  });

  // Troca de senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Feedback visual
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingSegment, setIsSyncingSegment] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const passwordEvaluation = evaluatePasswordStrength(newPassword);

  const showFeedback = (type, text, duration = 4000) => {
    setStatusMessage({ type, text });
    if (duration > 0) {
      setTimeout(() => setStatusMessage({ type: '', text: '' }), duration);
    }
  };

  useEffect(() => {
    loadUserProfile().then((loaded) => {
      if (loaded && Object.keys(loaded).length > 0) {
        setFormData((prev) => ({
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

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user?.email) {
          setFormData((prev) => ({
            ...prev,
            email: prev.email || data.session.user.email,
          }));
        }
      });
    }
  }, [loadUserProfile]);

  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showFeedback('error', 'Selecione uma imagem válida (PNG, JPG ou WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showFeedback('error', 'A imagem deve ter no máximo 10MB.');
      return;
    }

    try {
      showFeedback('info', 'Atualizando sua foto...', 0);
      const compressedDataUrl = await compressImage(file, 256, 256, 0.82);
      const nextData = { ...formData, avatarUrl: compressedDataUrl };
      setFormData(nextData);
      await saveUserProfile(nextData);
      showFeedback('success', 'Foto de perfil atualizada!');
    } catch {
      showFeedback('error', 'Não foi possível carregar essa imagem. Tente outra foto.');
    }
  };

  const handleRemoveAvatar = async () => {
    const nextData = { ...formData, avatarUrl: '' };
    setFormData(nextData);
    await saveUserProfile(nextData);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showFeedback('success', 'Foto de perfil removida.');
  };

  const syncSegmentServices = async (targetSegment) => {
    setIsSyncingSegment(true);
    const token = btoa('admin:admin');
    try {
      await axios.post(
        'http://localhost:8000/api/v1/services/change_segment/',
        { segment: targetSegment },
        { headers: { Authorization: `Basic ${token}` } }
      );
      const selectedSeg = SEGMENTS.find((s) => s.id === targetSegment);
      showFeedback(
        'success',
        `Serviços padrão de "${selectedSeg?.title || targetSegment}" carregados!`
      );
      return true;
    } catch {
      return false;
    } finally {
      setIsSyncingSegment(false);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'segment' && value !== segment) {
      setSegment(value);
      await syncSegmentServices(value);
    }
  };

  const handleSelectThemeMode = (mode) => {
    setFormData((prev) => ({ ...prev, themeMode: mode }));
    setThemeMode(mode);
  };

  const handleSelectThemeColor = (color) => {
    setFormData((prev) => ({ ...prev, themeColor: color }));
    setThemeColor(color);
  };

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword(16);
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(generated).catch(() => {});
    }
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage({ type: '', text: '' });

    if (BotDefense.isHoneypotTriggered(honeypot)) {
      showFeedback('error', 'Não foi possível concluir o envio. Tente novamente.');
      setIsSaving(false);
      return;
    }

    try {
      const previousSegment = segment;
      const dataToSave = {
        ...formData,
        responsibleName: (formData.responsibleName || '').trim(),
        whatsapp: (formData.whatsapp || '').trim(),
        businessName: (formData.businessName || '').trim(),
        email: (formData.email || email || '').trim(),
      };

      if (!dataToSave.email && isSupabaseConfigured()) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.email) {
          dataToSave.email = sessionData.session.user.email;
        }
      }

      await saveUserProfile(dataToSave);

      // Só sincroniza o catálogo padrão se o usuário realmente trocou de ramo
      if (dataToSave.segment && dataToSave.segment !== previousSegment) {
        setSegment(dataToSave.segment);
        await syncSegmentServices(dataToSave.segment);
      }

      showFeedback('success', 'Alterações salvas com sucesso!');
    } catch {
      showFeedback('error', 'Não foi possível salvar agora. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;

    if (!passwordEvaluation.isValid) {
      showFeedback('error', 'Escolha uma senha com pelo menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showFeedback('error', 'As duas senhas precisam ser iguais.');
      return;
    }

    setIsSaving(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }

      showFeedback('success', 'Nova senha salva com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      showFeedback('error', 'Não foi possível alterar a senha no momento. Faça login novamente e tente de novo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch {
      // Continua encerramento local com segurança
    } finally {
      logout();
      navigate('/login');
    }
  };

  const selectedSegmentObj = SEGMENTS.find((s) => s.id === formData.segment) || SEGMENTS[0];
  const activeColor = formData.themeColor || '#2457f5';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 min-w-0">
      {/* Campo oculto silencioso */}
      <input
        type="text"
        name="website_url_confirm"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Toast Mobile-Safe */}
      {statusMessage.text && (
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:top-auto sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl text-white text-xs sm:text-sm font-semibold animate-in fade-in ${
            statusMessage.type === 'error'
              ? 'bg-rose-600'
              : statusMessage.type === 'info'
              ? 'bg-brand'
              : 'bg-emerald-600'
          }`}
        >
          {statusMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
        </div>
      )}

      {/* Cabeçalho Limpo */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-line dark:border-slate-800">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink dark:text-white tracking-tight">
            Meu <span style={{ color: activeColor }}>Perfil</span>
          </h1>
          <p className="text-ink-soft dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            Dados do seu espaço, chave PIX e cores do aplicativo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="min-h-10 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>

      {/* CARD COMPACTO DE FOTO E RESUMO DA CONTA (Horizontal e rápido no celular) */}
      <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative shrink-0">
            {formData.avatarUrl ? (
              <img
                src={formData.avatarUrl}
                alt="Foto de Perfil"
                className="size-18 sm:size-20 rounded-2xl object-cover border-2 border-line dark:border-slate-700 shadow-xs"
              />
            ) : (
              <div
                className="size-18 sm:size-20 rounded-2xl border-2 border-line dark:border-slate-700 flex items-center justify-center text-2xl font-bold"
                style={{
                  backgroundColor: `${activeColor}18`,
                  color: activeColor,
                }}
              >
                {formData.responsibleName
                  ? formData.responsibleName.charAt(0).toUpperCase()
                  : (formData.businessName || 'Z').charAt(0).toUpperCase()}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Trocar foto"
              style={{ backgroundColor: activeColor }}
              className="absolute -bottom-1.5 -right-1.5 text-white p-2 rounded-xl shadow-md hover:opacity-90 transition-all cursor-pointer"
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

          <div className="min-w-0">
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-ink dark:text-white truncate">
              {formData.businessName || 'Meu Estabelecimento'}
            </h2>
            <p className="text-xs text-ink-soft dark:text-slate-400 truncate mt-0.5">
              {formData.responsibleName || 'Responsável'} • {selectedSegmentObj.title.split('&')[0].trim()}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-growth-soft dark:bg-emerald-950/60 text-growth-text dark:text-emerald-300 border border-growth/25">
              <BadgeCheck className="w-3.5 h-3.5 text-growth" />
              <span>
                {subscription?.status === 'TRIAL'
                  ? `Plano Pro • ${subscription?.daysRemaining ?? 29} dias grátis`
                  : 'Plano Pro Ativo'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-initial min-h-10 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-line dark:border-slate-700 hover:bg-canvas dark:hover:bg-slate-800 text-xs font-bold text-ink dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Trocar foto</span>
          </button>
          {formData.avatarUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              title="Remover foto"
              className="min-h-10 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remover</span>
            </button>
          )}
        </div>
      </div>

      {/* SEÇÃO 1: DADOS DO NEGÓCIO E PIX */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 sm:p-6 shadow-soft space-y-5"
      >
        <div className="flex items-center gap-3 pb-3 border-b border-line/70 dark:border-slate-800">
          <div
            className="size-9 rounded-xl flex items-center justify-center border shrink-0"
            style={{
              backgroundColor: `${activeColor}15`,
              borderColor: `${activeColor}30`,
              color: activeColor,
            }}
          >
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-ink dark:text-white">
              Dados do Negócio
            </h3>
            <p className="text-xs text-ink-soft dark:text-slate-400">
              Informações exibidas para suas clientes no agendamento
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300 mb-1.5">
              Nome do Espaço
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                required
                placeholder="Ex: Studio Bella ou Barbearia Central"
                className="w-full min-h-11 pl-10 pr-3.5 py-2.5 text-base sm:text-sm bg-canvas/60 dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-ink dark:text-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300 mb-1.5">
              Seu Nome
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="responsibleName"
                value={formData.responsibleName}
                onChange={handleInputChange}
                required
                placeholder="Ex: Camila Rocha"
                className="w-full min-h-11 pl-10 pr-3.5 py-2.5 text-base sm:text-sm bg-canvas/60 dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-ink dark:text-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300 mb-1.5">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="seuemail@exemplo.com"
                className="w-full min-h-11 pl-10 pr-3.5 py-2.5 text-base sm:text-sm bg-canvas/60 dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-ink dark:text-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300 mb-1.5">
              WhatsApp com DDD
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                required
                placeholder="(11) 99999-9999"
                className="w-full min-h-11 pl-10 pr-3.5 py-2.5 text-base sm:text-sm bg-canvas/60 dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-ink dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Segmento de Atuação */}
          <div className="sm:col-span-2 bg-brand-soft/35 dark:bg-blue-950/25 p-4 rounded-2xl border border-brand/15 dark:border-blue-900/50 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-brand dark:text-blue-300">
                Ramo de Atuação
              </label>
              {isSyncingSegment && (
                <span className="text-[11px] font-bold text-brand dark:text-blue-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Atualizando serviços...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SEGMENTS.map((seg) => {
                const isSelected = formData.segment === seg.id;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => handleInputChange({ target: { name: 'segment', value: seg.id } })}
                    className={`group text-left p-2.5 rounded-xl border transition-all flex items-center gap-2.5 cursor-pointer min-w-0 ${
                      isSelected
                        ? 'bg-surface dark:bg-slate-800 border-brand ring-2 ring-brand/20 shadow-xs'
                        : 'bg-surface/70 dark:bg-slate-800/50 border-line dark:border-slate-700 hover:bg-surface dark:hover:bg-slate-800'
                    }`}
                  >
                    <SegmentIconBadge segmentId={seg.id} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-xs font-bold text-ink dark:text-white truncate">
                        {seg.title.split('&')[0].trim()}
                      </p>
                      <p className="text-[10px] text-ink-muted dark:text-slate-400 truncate">
                        {seg.description}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="size-2 rounded-full bg-growth shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300 mb-1.5">
              Tipo da Chave PIX
            </label>
            <select
              name="pixType"
              value={formData.pixType}
              onChange={handleInputChange}
              className="w-full min-h-11 px-3.5 py-2.5 text-base sm:text-sm bg-canvas/60 dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-ink dark:text-white font-medium"
            >
              <option value="TELEFONE">Celular / WhatsApp</option>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="EMAIL">E-mail</option>
              <option value="ALEATORIA">Chave Aleatória</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300 mb-1.5">
              Chave PIX (Opcional)
            </label>
            <div className="relative">
              <QrCode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="pixKey"
                value={formData.pixKey}
                onChange={handleInputChange}
                placeholder="Ex: 11999999999 ou seu CPF"
                className="w-full min-h-11 pl-10 pr-3.5 py-2.5 text-base sm:text-sm bg-canvas/60 dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-ink dark:text-white font-medium"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300 mb-1.5">
            Sobre o seu Espaço (Opcional)
          </label>
          <textarea
            name="bio"
            rows={2}
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Ex: Especialista em unhas em gel e atendimento com hora marcada."
            className="w-full p-3.5 text-base sm:text-sm bg-canvas/60 dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-ink dark:text-white resize-none font-medium"
          />
        </div>

        {/* Botão de Salvar ergonômico na base do formulário */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || isSyncingSegment}
            style={{ backgroundColor: activeColor }}
            className="w-full sm:w-auto min-h-12 inline-flex items-center justify-center gap-2 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 hover:opacity-95"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving || isSyncingSegment ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </form>

      {/* SEÇÃO 2: APARÊNCIA E COR DO APLICATIVO (Compacto e visual no mobile) */}
      <div className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 sm:p-6 shadow-soft space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-line/70 dark:border-slate-800">
          <div
            className="size-9 rounded-xl flex items-center justify-center border shrink-0"
            style={{
              backgroundColor: `${activeColor}15`,
              borderColor: `${activeColor}30`,
              color: activeColor,
            }}
          >
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-ink dark:text-white">
              Cores e Tema
            </h3>
            <p className="text-xs text-ink-soft dark:text-slate-400">
              Deixe o aplicativo com a cara da sua marca
            </p>
          </div>
        </div>

        {/* Seletor Segmentado 3 Colunas (Cabe em 1 linha no celular) */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700">
          {[
            { id: 'light', label: 'Claro', icon: Sun },
            { id: 'dark', label: 'Escuro', icon: Moon },
            { id: 'custom', label: 'Sua Cor', icon: Sparkles },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = formData.themeMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleSelectThemeMode(mode.id)}
                className={`min-h-11 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-surface dark:bg-slate-900 text-ink dark:text-white shadow-xs border border-line/80 dark:border-slate-700'
                    : 'text-ink-soft dark:text-slate-400 hover:text-ink dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Paleta de Cores Tátil */}
        <div className="space-y-3">
          <span className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300">
            Cor Principal dos Botões
          </span>

          <div className="flex flex-wrap items-center gap-3">
            {THEME_PRESETS.map((preset) => {
              const isSelected = activeColor.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => handleSelectThemeColor(preset.hex)}
                  title={preset.name}
                  style={{ backgroundColor: preset.hex }}
                  className={`size-10 rounded-full flex items-center justify-center text-white transition-transform cursor-pointer ${
                    isSelected
                      ? 'ring-4 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-105'
                      : 'hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
              );
            })}

            <label
              className="min-h-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-line dark:border-slate-700 bg-canvas dark:bg-slate-800 text-xs font-semibold text-ink-soft dark:text-slate-300 cursor-pointer"
              title="Escolher outra cor"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Outra cor</span>
              <input
                type="color"
                value={activeColor}
                onChange={(e) => handleSelectThemeColor(e.target.value)}
                className="size-6 rounded-full border-0 p-0 bg-transparent cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: ALTERAR SENHA */}
      <form
        onSubmit={handleUpdatePassword}
        className="bg-surface dark:bg-slate-900 rounded-3xl border border-line dark:border-slate-800 p-5 sm:p-6 shadow-soft space-y-5"
      >
        <div className="flex items-center gap-3 pb-3 border-b border-line/70 dark:border-slate-800">
          <div className="size-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-900 shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-ink dark:text-white">
              Alterar Senha
            </h3>
            <p className="text-xs text-ink-soft dark:text-slate-400">
              Preencha apenas se desejar trocar sua senha atual
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300">
                Nova Senha
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>{passwordCopied ? 'Copiada!' : 'Sugerir senha'}</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full min-h-11 pl-10 pr-10 py-2.5 text-base sm:text-sm bg-canvas/60 dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-ink dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft dark:text-slate-300 mb-1.5">
              Repetir Nova Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente"
                className="w-full min-h-11 pl-10 pr-4 py-2.5 text-base sm:text-sm bg-canvas/60 dark:bg-slate-800 border border-line dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-ink dark:text-white"
              />
            </div>
          </div>
        </div>

        {newPassword && (
          <div className="bg-canvas dark:bg-slate-800/60 p-3.5 rounded-2xl border border-line dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-ink-soft dark:text-slate-300">Nível da senha:</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${passwordEvaluation.color}`}>
                {passwordEvaluation.label}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${passwordEvaluation.barColor}`}
                style={{ width: passwordEvaluation.width }}
              />
            </div>
            {passwordEvaluation.feedback.length > 0 && (
              <p className="text-[11px] text-ink-muted dark:text-slate-400">
                {passwordEvaluation.feedback.join(' • ')}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || !newPassword}
            className="w-full sm:w-auto min-h-11 inline-flex items-center justify-center gap-2 bg-ink dark:bg-slate-700 hover:opacity-90 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Nova Senha</span>
          </button>
        </div>
      </form>

      {/* Modal de Confirmação de Saída */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 border border-line dark:border-slate-800 p-6 space-y-4">
            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-heading font-extrabold text-lg text-ink dark:text-white">
                Deseja sair da sua conta?
              </h3>
              <p className="text-xs text-ink-soft dark:text-slate-400 mt-1 leading-relaxed">
                Suas configurações e agendamentos de <strong>{formData.businessName}</strong> continuam salvos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="min-h-11 py-2.5 px-4 rounded-xl border border-line dark:border-slate-700 text-ink dark:text-slate-300 font-semibold text-xs hover:bg-canvas dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-11 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Sim, sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
