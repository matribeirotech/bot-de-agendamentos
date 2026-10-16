import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Paleta de tons neurais Lypsyos / Zenda para Segmentos e Serviços
 */
const TONE_STYLES = {
  brand: {
    box: 'border-[#2457f5]/25 bg-gradient-to-br from-white via-[#eaf0ff] to-[#d8e5ff]/85 text-[#2457f5] shadow-[0_10px_24px_rgb(36_87_245/0.14)] dark:from-slate-800 dark:via-blue-950/70 dark:to-slate-900 dark:border-blue-500/30 dark:text-blue-400',
    glow: 'bg-[#2457f5]/20',
    node: 'bg-[#06b6d4]',
    tag: 'bg-[#eaf0ff] text-[#2457f5] border-[#2457f5]/20 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
  },
  growth: {
    box: 'border-[#10b981]/30 bg-gradient-to-br from-white via-[#e7f8f1] to-[#d1fae5]/85 text-[#047857] shadow-[0_10px_24px_rgb(16_185_129/0.15)] dark:from-slate-800 dark:via-emerald-950/70 dark:to-slate-900 dark:border-emerald-500/30 dark:text-emerald-400',
    glow: 'bg-[#10b981]/20',
    node: 'bg-[#10b981]',
    tag: 'bg-[#e7f8f1] text-[#047857] border-[#10b981]/25 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
  },
  cyan: {
    box: 'border-[#06b6d4]/30 bg-gradient-to-br from-white via-[#ecfeff] to-[#cffafe]/85 text-[#0891b2] shadow-[0_10px_24px_rgb(6_182_212/0.15)] dark:from-slate-800 dark:via-cyan-950/70 dark:to-slate-900 dark:border-cyan-500/30 dark:text-cyan-400',
    glow: 'bg-[#06b6d4]/20',
    node: 'bg-[#2457f5]',
    tag: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800/60',
  },
  night: {
    box: 'border-[#0b1f4d]/30 bg-gradient-to-br from-[#0b1f4d] via-[#132d6b] to-[#1d3f91] text-white shadow-[0_10px_24px_rgb(11_31_77/0.24)] dark:border-blue-400/30',
    glow: 'bg-[#06b6d4]/25',
    node: 'bg-[#10b981]',
    tag: 'bg-slate-100 text-[#0b1f4d] border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  },
  rose: {
    box: 'border-pink-500/25 bg-gradient-to-br from-white via-pink-50/90 to-rose-100/80 text-pink-600 shadow-[0_10px_24px_rgb(236_72_153/0.14)] dark:from-slate-800 dark:via-pink-950/60 dark:to-slate-900 dark:border-pink-500/30 dark:text-pink-400',
    glow: 'bg-pink-500/20',
    node: 'bg-pink-500',
    tag: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800/60',
  },
  violet: {
    box: 'border-violet-500/25 bg-gradient-to-br from-white via-violet-50/90 to-purple-100/80 text-violet-600 shadow-[0_10px_24px_rgb(139_92_246/0.14)] dark:from-slate-800 dark:via-violet-950/60 dark:to-slate-900 dark:border-violet-500/30 dark:text-violet-400',
    glow: 'bg-violet-500/20',
    node: 'bg-[#06b6d4]',
    tag: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/60',
  },
  amber: {
    box: 'border-amber-500/30 bg-gradient-to-br from-white via-amber-50/90 to-orange-100/80 text-amber-600 shadow-[0_10px_24px_rgb(245_158_11/0.15)] dark:from-slate-800 dark:via-amber-950/60 dark:to-slate-900 dark:border-amber-500/30 dark:text-amber-400',
    glow: 'bg-amber-500/20',
    node: 'bg-amber-500',
    tag: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
  },
};

const SIZE_STYLES = {
  xs: { wrapper: 'h-8 w-8 rounded-lg', icon: 'h-4 w-4', dot: 'h-1.5 w-1.5 top-1 right-1' },
  sm: { wrapper: 'h-9 w-9 rounded-xl', icon: 'h-4.5 w-4.5', dot: 'h-1.5 w-1.5 top-1.5 right-1.5' },
  md: { wrapper: 'h-11 w-11 rounded-2xl', icon: 'h-5.5 w-5.5', dot: 'h-1.5 w-1.5 top-1.5 right-1.5' },
  lg: { wrapper: 'h-12 w-12 rounded-2xl', icon: 'h-6 w-6', dot: 'h-2 w-2 top-2 right-2' },
  xl: { wrapper: 'h-14 w-14 rounded-2xl', icon: 'h-7 w-7', dot: 'h-2 w-2 top-2 right-2' },
};

/* ============================================================================
 * ÍCONES VETORIAIS PROPRIETÁRIOS DE ALTA PRECISÃO (SEGMENTOS E PROCEDIMENTOS)
 * ============================================================================ */

/** 1. Barbearia: Barber Pole Clássico + Tesoura de Precisão */
const BarberPoleVector = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="7" y="4" width="6" height="16" rx="3" />
    <path d="M6 4h8" />
    <path d="M6 20h8" />
    <path d="M7 9l6-3" />
    <path d="M7 14l6-3" />
    <path d="M7 19l6-3" />
    <circle cx="17.5" cy="7.5" r="2" />
    <circle cx="17.5" cy="16.5" r="2" />
    <path d="M16 9l3.5 6" />
    <path d="M19.5 9L16 15" />
  </svg>
);

/** 2. Navalha / Barboterapia / Toalha Quente */
const RazorBeardVector = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 17l9-9 4 4-9 9H4v-4z" />
    <path d="M14.5 6.5l3-3 3 3-3 3" />
    <path d="M8 13l3 3" />
    <path d="M18 14c1.5 0 3 1 3 2.5S19.5 19 18 19h-2" />
    <path d="M19 22h-4" />
  </svg>
);

/** 3. Máquina / Acabamento / Pézinho */
const ClipperTrimmerVector = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="7" y="6" width="10" height="15" rx="3.5" />
    <path d="M6 3h12v3H6z" />
    <path d="M8.5 3v3" />
    <path d="M12 3v3" />
    <path d="M15.5 3v3" />
    <circle cx="12" cy="13" r="2" />
    <path d="M10 17h4" />
  </svg>
);

/** 4. Combo VIP: Coroa + Tesoura */
const VipComboCrownVector = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 17l2-9 4.5 3.5L12 5l2.5 6.5L19 8l2 9H3z" />
    <path d="M4 20h16" />
    <circle cx="12" cy="13" r="1.2" fill="currentColor" />
  </svg>
);

/** 5. Manicure & Nail Designer: Esmalte + Brilho Diamante */
const NailPolishVector = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 3h4v5H9z" />
    <path d="M6 11a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8z" />
    <path d="M6 14h10" />
    <path d="M19 4l1 2.5L22.5 7.5 20 8.5 19 11l-1-2.5L15.5 7.5 18 6.5 19 4z" />
  </svg>
);

/** 6. Alongamento em Gel / Fibra: Unha Diamante + Brilho UV */
const GelDiamondNailVector = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9L9 4h6l3 5-6 11L6 9z" />
    <path d="M6 9h12" />
    <path d="M9 4l3 5 3-5" />
    <path d="M12 9v11" />
    <path d="M19 15l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8.8-1.7z" />
  </svg>
);

/** 7. Spa dos Pés & Mãos / Pedicure / Massagem: Flor de Lótus & Gotas */
const SpaLotusVector = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 4c2.5 3.5 3.5 6.8 3.5 9.5A3.5 3.5 0 0 1 12 17a3.5 3.5 0 0 1-3.5-3.5C8.5 10.8 9.5 7.5 12 4z" />
    <path d="M15.5 11.5c2.5-.8 4.8-.2 6 1.5-1.2 2.8-4 4.5-7.5 4.5" />
    <path d="M8.5 11.5c-2.5-.8-4.8-.2-6 1.5 1.2 2.8 4 4.5 7.5 4.5" />
    <path d="M5 20h14" />
  </svg>
);

/** 8. Salão de Beleza: Tesoura Estilista + Pente Fino + Brilho */
const SalonShearsVector = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <path d="M20 4L8.12 15.88" />
    <path d="M14.47 14.48L20 20" />
    <path d="M8.12 8.12L12 12" />
    <path d="M19 9l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8.8-1.8z" />
  </svg>
);

/** 9. Escova Modelada / Secador / Hidratação */
const HairStylingWaveVector = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 8c3-3 6-3 9 0s6 3 7 0" />
    <path d="M4 13c3-3 6-3 9 0s6 3 7 0" />
    <path d="M4 18c3-3 6-3 9 0s6 3 7 0" />
    <circle cx="18" cy="4.5" r="1.5" />
  </svg>
);

/** 10. Estética & Sobrancelhas: Olhar / Design de Sobrancelha & Brilho */
const BrowAestheticsVector = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9c4-3.8 10.5-4.2 18-1" strokeWidth="2.2" />
    <path d="M4 14c3.5-3 10.5-3 14 0-3.5 3-10.5 3-14 0z" />
    <circle cx="11" cy="14" r="2" />
    <path d="M19 16l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8.8-1.8z" />
  </svg>
);

/** 11. Consultoria & Serviços Gerais: Maleta Executiva + Estrela */
const ConsultingBriefcaseVector = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="7" width="18" height="13" rx="2.5" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 12h18" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

/**
 * Mapeamento Oficial de Segmentos -> Ícone Vetorial + Tom Visual
 */
export function getSegmentVisualMeta(segmentId = 'manicure') {
  switch (segmentId) {
    case 'barbearia':
      return {
        Vector: BarberPoleVector,
        tone: 'brand',
        badgeLabel: 'Barbearia & Barber Shop',
        shortLabel: 'Barbearia',
      };
    case 'manicure':
      return {
        Vector: NailPolishVector,
        tone: 'rose',
        badgeLabel: 'Manicure & Nail Designer',
        shortLabel: 'Manicure & Nails',
      };
    case 'salao':
      return {
        Vector: SalonShearsVector,
        tone: 'violet',
        badgeLabel: 'Salão de Beleza & Cabelos',
        shortLabel: 'Salão & Cabelos',
      };
    case 'estetica':
      return {
        Vector: BrowAestheticsVector,
        tone: 'growth',
        badgeLabel: 'Estética & Sobrancelhas',
        shortLabel: 'Estética & Spa',
      };
    case 'outro':
    default:
      return {
        Vector: ConsultingBriefcaseVector,
        tone: 'cyan',
        badgeLabel: 'Consultoria & Serviços',
        shortLabel: 'Consultoria',
      };
  }
}

/**
 * Motor Inteligente de Identificação Visual de Serviços (por nome + segmento)
 */
export function getServiceVisualMeta(serviceName = '', segmentId = 'manicure') {
  const lower = (serviceName || '').toLowerCase();

  // 1. Regras para Barbearia & Cortes Masculinos
  if (lower.includes('combo') || (lower.includes('cabelo') && lower.includes('barba'))) {
    return { Vector: VipComboCrownVector, tone: 'growth', category: 'Combo VIP' };
  }
  if (lower.includes('barba') || lower.includes('barboterapia') || lower.includes('toalha') || lower.includes('navalha')) {
    return { Vector: RazorBeardVector, tone: 'night', category: 'Barboterapia' };
  }
  if (lower.includes('pézinho') || lower.includes('pezinho') || lower.includes('acabamento') || lower.includes('máquina') || lower.includes('maquina')) {
    return { Vector: ClipperTrimmerVector, tone: 'cyan', category: 'Acabamento' };
  }
  if (lower.includes('degradê') || lower.includes('degrade') || lower.includes('social') || lower.includes('masculino')) {
    return { Vector: BarberPoleVector, tone: 'brand', category: 'Corte & Estilo' };
  }

  // 2. Regras para Manicure, Unhas, Gel & Spa
  if (lower.includes('alongamento') || lower.includes('gel') || lower.includes('fibra') || lower.includes('acrílico') || lower.includes('blindagem')) {
    return { Vector: GelDiamondNailVector, tone: 'violet', category: 'Gel & Fibra' };
  }
  if (lower.includes('spa') || lower.includes('drenagem') || lower.includes('massagem') || lower.includes('relaxante') || lower.includes('pés') || lower.includes('pes')) {
    return { Vector: SpaLotusVector, tone: 'growth', category: 'Spa & Bem-Estar' };
  }
  if (lower.includes('manicure') || lower.includes('pedicure') || lower.includes('unha') || lower.includes('esmalta')) {
    return { Vector: NailPolishVector, tone: 'rose', category: 'Unhas & Beleza' };
  }

  // 3. Regras para Salão de Beleza & Cabelos
  if (lower.includes('escova') || lower.includes('hidrata') || lower.includes('nutri') || lower.includes('progressiva') || lower.includes('botox')) {
    return { Vector: HairStylingWaveVector, tone: 'cyan', category: 'Tratamento Capilar' };
  }
  if (lower.includes('colora') || lower.includes('mecha') || lower.includes('luzes') || lower.includes('tintura')) {
    return { Vector: GelDiamondNailVector, tone: 'amber', category: 'Coloração & Mechas' };
  }
  if (lower.includes('corte') || lower.includes('visagismo')) {
    return { Vector: SalonShearsVector, tone: 'brand', category: 'Corte & Visagismo' };
  }

  // 4. Regras para Estética, Sobrancelhas e Pele
  if (lower.includes('sobrancelha') || lower.includes('henna') || lower.includes('cílios') || lower.includes('cilios') || lower.includes('limpeza de pele') || lower.includes('facial')) {
    return { Vector: BrowAestheticsVector, tone: 'rose', category: 'Estética Facial' };
  }

  // 5. Fallback para o ícone do Segmento Ativo
  const segMeta = getSegmentVisualMeta(segmentId);
  return {
    Vector: segMeta.Vector,
    tone: segMeta.tone,
    category: segMeta.shortLabel,
  };
}

/**
 * Cápsula Neural para Segmento (Manicure, Barbearia, Salão, Estética, Consultoria)
 */
export function SegmentIconBadge({ segmentId = 'manicure', size = 'md', className }) {
  const { Vector, tone } = getSegmentVisualMeta(segmentId);
  const currentTone = TONE_STYLES[tone] || TONE_STYLES.brand;
  const currentSize = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center border shrink-0 overflow-hidden transition-transform duration-300 group-hover:scale-[1.04]',
        currentSize.wrapper,
        currentTone.box,
        className
      )}
    >
      <span className={cn('pointer-events-none absolute -top-3 -right-3 h-7 w-7 rounded-full blur-md', currentTone.glow)} />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 h-5 w-5 opacity-25 text-current"
      >
        <path d="M15 2v4l3 3h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="15" cy="2" r="1.2" fill="currentColor" />
      </svg>
      <span className={cn('pointer-events-none absolute rounded-full opacity-85 animate-pulse', currentSize.dot, currentTone.node)} />
      <Vector className={cn('relative z-10', currentSize.icon)} />
    </div>
  );
}

/**
 * Cápsula Neural Inteligente para Cada Serviço / Procedimento
 */
export function ServiceIconBadge({ serviceName = '', segmentId = 'manicure', size = 'md', className }) {
  const { Vector, tone } = getServiceVisualMeta(serviceName, segmentId);
  const currentTone = TONE_STYLES[tone] || TONE_STYLES.brand;
  const currentSize = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center border shrink-0 overflow-hidden transition-transform duration-300 group-hover:scale-[1.04]',
        currentSize.wrapper,
        currentTone.box,
        className
      )}
    >
      <span className={cn('pointer-events-none absolute -top-3 -right-3 h-7 w-7 rounded-full blur-md', currentTone.glow)} />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 h-5 w-5 opacity-25 text-current"
      >
        <path d="M15 2v4l3 3h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="15" cy="2" r="1.2" fill="currentColor" />
      </svg>
      <span className={cn('pointer-events-none absolute rounded-full opacity-85 animate-pulse', currentSize.dot, currentTone.node)} />
      <Vector className={cn('relative z-10', currentSize.icon)} />
    </div>
  );
}

/**
 * Pill / Tag de Categoria do Serviço
 */
export function ServiceCategoryPill({ serviceName = '', segmentId = 'manicure', className }) {
  const { tone, category } = getServiceVisualMeta(serviceName, segmentId);
  const currentTone = TONE_STYLES[tone] || TONE_STYLES.brand;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
        currentTone.tag,
        className
      )}
    >
      {category}
    </span>
  );
}

