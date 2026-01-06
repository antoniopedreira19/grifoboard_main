export interface Material {
  id: string;
  tarefa_id: string;
  descricao: string;
  responsavel: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMaterialData {
  tarefa_id: string;
  descricao: string;
  responsavel: string;
}