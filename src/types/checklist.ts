
export interface AtividadeChecklist {
  id: string;
  obra_id: string;
  local: string;
  setor: string;
  responsavel: string;
  data_inicio?: string;
  data_termino?: string;
  concluida: boolean;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

export interface NovaAtividadeChecklist {
  obra_id: string;
  local: string;
  setor: string;
  responsavel: string;
  data_inicio?: string;
  data_termino?: string;
  descricao?: string;
}
