import { supabase } from "@/integrations/supabase/client";
import { AtividadeChecklist, NovaAtividadeChecklist } from "@/types/checklist";

class ChecklistServiceError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'ChecklistServiceError';
  }
}

export const checklistService = {
  async listarAtividades(obraId: string): Promise<AtividadeChecklist[]> {
    if (!obraId) {
      throw new ChecklistServiceError('ID da obra é obrigatório');
    }

    const { data, error } = await supabase
      .from('atividades_checklist')
      .select('*')
      .eq('obra_id', obraId)
      .order('concluida', { ascending: true })
      .order('data_inicio', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw new ChecklistServiceError('Erro ao carregar atividades', error);
    }

    return data ?? [];
  },

  async criarAtividade(atividade: NovaAtividadeChecklist): Promise<AtividadeChecklist> {
    if (!atividade.obra_id) {
      throw new ChecklistServiceError('ID da obra é obrigatório');
    }

    if (!atividade.descricao?.trim()) {
      throw new ChecklistServiceError('Descrição da atividade é obrigatória');
    }

    const { data, error } = await supabase
      .from('atividades_checklist')
      .insert(atividade)
      .select()
      .single();

    if (error) {
      throw new ChecklistServiceError('Erro ao criar atividade', error);
    }

    if (!data) {
      throw new ChecklistServiceError('Nenhum dado retornado ao criar atividade');
    }

    return data;
  },

  async atualizarAtividade(id: string, updates: Partial<AtividadeChecklist>): Promise<AtividadeChecklist> {
    if (!id) {
      throw new ChecklistServiceError('ID da atividade é obrigatório');
    }

    if (Object.keys(updates).length === 0) {
      throw new ChecklistServiceError('Nenhum dado para atualizar');
    }

    const { data, error } = await supabase
      .from('atividades_checklist')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new ChecklistServiceError('Erro ao atualizar atividade', error);
    }

    if (!data) {
      throw new ChecklistServiceError('Atividade não encontrada');
    }

    return data;
  },

  async excluirAtividade(id: string): Promise<void> {
    if (!id) {
      throw new ChecklistServiceError('ID da atividade é obrigatório');
    }

    const { error } = await supabase
      .from('atividades_checklist')
      .delete()
      .eq('id', id);

    if (error) {
      throw new ChecklistServiceError('Erro ao excluir atividade', error);
    }
  }
};
