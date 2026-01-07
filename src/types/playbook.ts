export interface PlaybookItem {
  id: string;
  obra_id: string;
  descricao: string;
  unidade: string;
  qtd: number; // Mapeado para 'quantidade_orcada' no front se preferir, mas 'qtd' no banco
  codigo: string;

  // Valores de Custo (Novos)
  valor_mao_de_obra: number;
  valor_materiais: number;
  valor_equipamentos: number;
  valor_verbas: number;
  preco_total: number;

  // Controle de Nível/Hierarquia
  is_etapa: boolean; // ou is_parent
  is_parent: boolean;
  nivel: number;
  ordem: number;

  // Fase 2 - Contratação (Destinos)
  destino_mao_de_obra?: "obra_direta" | "fornecimento" | "cliente" | null;
  destino_materiais?: "obra_direta" | "fornecimento" | "cliente" | null;
  destino_equipamentos?: "obra_direta" | "fornecimento" | "cliente" | null;
  destino_verbas?: "obra_direta" | "fornecimento" | "cliente" | null;

  // Legado / Opcionais
  preco_unitario?: number;
  responsavel?: string | null;
  data_limite?: string | null;
  valor_contratado?: number | null;
  status_contratacao?: string | null;
  observacao?: string | null;
  contract_url?: string | null;

  created_at?: string;
  updated_at?: string;
}

export type PlaybookInsert = Omit<PlaybookItem, "id" | "created_at" | "updated_at">;
export type PlaybookUpdate = Partial<PlaybookInsert>;
