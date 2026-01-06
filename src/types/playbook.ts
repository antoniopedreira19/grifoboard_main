// Types for the Playbook importer feature (budget import)
export interface PlaybookImportItem {
  id: number;
  descricao: string;
  unidade: string;
  qtd: number;
  precoUnitario: number;
  precoTotal: number;
  isEtapa: boolean;
  precoUnitarioMeta: number;
  precoTotalMeta: number;
  porcentagem: number;
}

// Types for the Farol de Contratação feature
export interface PlaybookFarolItem {
  id: string;
  obra_id: string;
  etapa: string;
  proposta: string;
  responsavel: string;
  quantidade: number;
  unidade: string;
  orcamento_meta_unitario: number;
  valor_contratado: number | null;
  status: 'Negociadas' | 'Em Andamento' | 'A Negociar';
  observacao: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PlaybookStatus = 'Negociadas' | 'Em Andamento' | 'A Negociar';
