// Tipos para o módulo PMP (Planejamento Mestre da Produção)

export interface Restricao {
  id?: string;
  descricao: string;
  data_limite: string;
  resolvido?: boolean;
  atividade_id?: string;
}

export interface RestricaoComAtividade extends Restricao {
  atividadeTitulo: string;
  atividadeId: string;
  semana: string;
}

export interface PmpAtividade {
  id: string;
  obra_id: string;
  semana_referencia: string;
  titulo: string;
  cor: string;
  data_inicio?: string | null;
  data_termino?: string | null;
  responsavel?: string | null;
  concluido?: boolean;
  setor?: string | null;
  ordem?: number;
  descricao?: string | null;
  created_at?: string;
  pmp_restricoes?: Restricao[];
}

export interface PmpWeek {
  id: string;
  label: string;
  year: string;
  start: Date;
  end: Date;
  formattedRange: string;
}

export interface PmpFormData {
  titulo: string;
  cor: ColorKey;
  responsavel: string;
  data_inicio: string;
  data_termino: string;
  setor: string;
}

// Cores disponíveis para cards
export const POSTIT_COLORS = {
  yellow: { border: "border-l-yellow-400", ring: "ring-yellow-400" },
  green: { border: "border-l-emerald-500", ring: "ring-emerald-500" },
  blue: { border: "border-l-blue-500", ring: "ring-blue-500" },
  red: { border: "border-l-red-500", ring: "ring-red-500" },
  purple: { border: "border-l-purple-500", ring: "ring-purple-500" },
  orange: { border: "border-l-orange-500", ring: "ring-orange-500" },
  pink: { border: "border-l-pink-500", ring: "ring-pink-500" },
  cyan: { border: "border-l-cyan-500", ring: "ring-cyan-500" },
  lime: { border: "border-l-lime-500", ring: "ring-lime-500" },
  indigo: { border: "border-l-indigo-500", ring: "ring-indigo-500" },
  amber: { border: "border-l-amber-500", ring: "ring-amber-500" },
  teal: { border: "border-l-teal-500", ring: "ring-teal-500" },
} as const;

export type ColorKey = keyof typeof POSTIT_COLORS;

export const COLOR_BG_MAP: Record<ColorKey, string> = {
  yellow: "bg-yellow-400",
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  cyan: "bg-cyan-500",
  lime: "bg-lime-500",
  indigo: "bg-indigo-500",
  amber: "bg-amber-500",
  teal: "bg-teal-500",
};

// Interface para urgência do prazo
export interface UrgencyInfo {
  daysRemaining: number | null;
  urgencyBg: string;
  urgencyBorder: string;
  urgencyText: string;
  iconColor: string;
  statusLabel: string;
  isExploded: boolean;
}
