import { cn } from "../../utils/cn";

const toneStyles = {
  brand: {
    wrapper:
      "border-brand/25 dark:border-brand/40 bg-gradient-to-br from-white via-brand-soft/90 to-cyan-50/80 dark:from-slate-900 dark:via-blue-950/60 dark:to-cyan-950/40 shadow-[0_8px_20px_-4px_rgba(36,87,245,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_8px_20px_-4px_rgba(36,87,245,0.3)] group-hover:border-brand/50",
    innerGlow: "from-brand/15 via-cyan-400/10 to-transparent",
    iconColor: "text-brand dark:text-blue-400",
    nodeColor: "bg-cyan-400 shadow-[0_0_6px_#22d3ee]",
    circuitStroke: "#2457f5",
  },
  growth: {
    wrapper:
      "border-growth/30 dark:border-growth/40 bg-gradient-to-br from-white via-growth-soft/90 to-teal-50/80 dark:from-slate-900 dark:via-emerald-950/60 dark:to-teal-950/40 shadow-[0_8px_20px_-4px_rgba(16,185,129,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_8px_20px_-4px_rgba(16,185,129,0.28)] group-hover:border-growth/55",
    innerGlow: "from-growth/18 via-teal-400/10 to-transparent",
    iconColor: "text-growth-text dark:text-emerald-400",
    nodeColor: "bg-growth shadow-[0_0_6px_#10b981]",
    circuitStroke: "#047857",
  },
  cyan: {
    wrapper:
      "border-cyan-400/30 dark:border-cyan-500/40 bg-gradient-to-br from-white via-cyan-50/90 to-brand-soft/70 dark:from-slate-900 dark:via-cyan-950/60 dark:to-blue-950/40 shadow-[0_8px_20px_-4px_rgba(6,182,212,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] group-hover:border-cyan-500/50",
    innerGlow: "from-cyan-400/18 via-brand/10 to-transparent",
    iconColor: "text-cyan-700 dark:text-cyan-300",
    nodeColor: "bg-brand shadow-[0_0_6px_#2457f5]",
    circuitStroke: "#0891b2",
  },
  night: {
    wrapper:
      "border-white/15 bg-gradient-to-br from-night via-[#122b66] to-[#09173a] shadow-[0_10px_24px_-4px_rgba(11,31,77,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]",
    innerGlow: "from-cyan-400/20 via-brand/15 to-transparent",
    iconColor: "text-cyan-300",
    nodeColor: "bg-cyan-400 shadow-[0_0_6px_#22d3ee]",
    circuitStroke: "#38bdf8",
  },
  danger: {
    wrapper:
      "border-danger/25 dark:border-danger/40 bg-gradient-to-br from-white via-danger-soft/80 to-rose-50/70 dark:from-slate-900 dark:via-rose-950/60 dark:to-red-950/40 shadow-[0_8px_18px_-4px_rgba(239,68,68,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]",
    innerGlow: "from-danger/12 via-rose-400/8 to-transparent",
    iconColor: "text-danger dark:text-rose-400",
    nodeColor: "bg-danger shadow-[0_0_6px_#ef4444]",
    circuitStroke: "#ef4444",
  },
};

const sizeStyles = {
  sm: {
    box: "size-9 rounded-xl",
    icon: "size-4.5",
    node: "size-1.5 right-1.5 top-1.5",
  },
  md: {
    box: "size-11 rounded-2xl",
    icon: "size-5",
    node: "size-1.5 right-2 top-2",
  },
  lg: {
    box: "size-13 rounded-2xl",
    icon: "size-6",
    node: "size-2 right-2 top-2",
  },
  xl: {
    box: "size-15 rounded-[1.15rem]",
    icon: "size-7",
    node: "size-2 right-2.5 top-2.5",
  },
};

export function LypsyosIconBadge({
  icon: Icon,
  tone = "brand",
  size = "lg",
  className,
  iconClassName,
}) {
  const palette = toneStyles[tone] || toneStyles.brand;
  const dimensions = sizeStyles[size] || sizeStyles.lg;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "group relative inline-flex shrink-0 items-center justify-center overflow-hidden border transition-all duration-300",
        dimensions.box,
        palette.wrapper,
        className
      )}
    >
      {/* Aura interna translúcida */}
      <span
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
          palette.innerGlow
        )}
      />

      {/* Geometria neural proprietária de fundo */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="pointer-events-none absolute inset-0 size-full opacity-[0.16] transition-transform duration-300 group-hover:scale-110"
      >
        <path
          d="M6 36 L16 26 L26 26 M28 12 L38 24 L28 36"
          stroke={palette.circuitStroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6" cy="36" r="2" fill={palette.circuitStroke} />
        <circle cx="16" cy="26" r="1.5" fill={palette.circuitStroke} />
      </svg>

      {/* Ponto neural luminoso ativo */}
      <span
        className={cn(
          "pointer-events-none absolute rounded-full transition-transform duration-300 group-hover:scale-125",
          dimensions.node,
          palette.nodeColor
        )}
      />

      {/* Ícone */}
      {Icon && (
        <Icon
          strokeWidth={2.1}
          className={cn(
            "relative z-10 transition-transform duration-300 group-hover:scale-105",
            dimensions.icon,
            palette.iconColor,
            iconClassName
          )}
        />
      )}
    </span>
  );
}

