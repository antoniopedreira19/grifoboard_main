import { supabase } from '@/integrations/supabase/client';
import { Material, CreateMaterialData } from '@/types/material';

class MaterialServiceError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'MaterialServiceError';
  }
}

export const materialService = {
  async listarMateriaisPorTarefa(tarefaId: string): Promise<Material[]> {
    if (!tarefaId) {
      throw new MaterialServiceError('ID da tarefa é obrigatório');
    }

    const { data, error } = await supabase
      .from('materiais_tarefa')
      .select('id, created_at, updated_at, responsavel, descricao, tarefa_id')
      .eq('tarefa_id', tarefaId)
      .order('created_at', { ascending: true });
    
    if (error) {
      throw new MaterialServiceError('Erro ao listar materiais', error);
    }
    
    return data ?? [];
  },

  async criarMaterial(material: CreateMaterialData): Promise<Material> {
    if (!material.tarefa_id) {
      throw new MaterialServiceError('ID da tarefa é obrigatório');
    }

    if (!material.descricao?.trim()) {
      throw new MaterialServiceError('Descrição do material é obrigatória');
    }

    const { data, error } = await supabase
      .from('materiais_tarefa')
      .insert([material])
      .select()
      .single();
    
    if (error) {
      throw new MaterialServiceError('Erro ao criar material', error);
    }
    
    if (!data) {
      throw new MaterialServiceError('Nenhum dado retornado ao criar material');
    }
    
    return data;
  },

  async excluirMaterial(materialId: string): Promise<void> {
    if (!materialId) {
      throw new MaterialServiceError('ID do material é obrigatório');
    }

    const { error } = await supabase
      .from('materiais_tarefa')
      .delete()
      .eq('id', materialId);
    
    if (error) {
      throw new MaterialServiceError('Erro ao excluir material', error);
    }
  }
};