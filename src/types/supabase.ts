export interface Obra {
  id: string;
  nome_obra: string;
  localizacao: string;
  data_inicio: string;
  data_termino?: string;
  status: string;
  usuario_id: string;
  created_at: string;
  pmp_planta_url?: string | null;
}

export interface Tarefa {
  id: string;
  obra_id: string;
  setor: string;
  item: string;
  descricao: string;
  disciplina: string;
  executante: string;
  responsavel: string;
  encarregado: string;
  semana: string;
  seg: string;
  ter: string;
  qua: string;
  qui: string;
  sex: string;
  sab: string;
  dom: string;
  percentual_executado: number;
  causa_nao_execucao?: string;
  ordem?: number;
  created_at: string;
}

// CORREÇÃO AQUI: Adicionando user_metadata
export interface UserSession {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
      [key: string]: any;
    };
  } | null;
  obraAtiva: Obra | null;
}
