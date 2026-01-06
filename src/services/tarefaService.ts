import { supabase } from '@/integrations/supabase/client';
import { Tarefa } from '@/types/supabase';

export class TarefaServiceError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'TarefaServiceError';
  }
}

export const tarefasService = {
  async listarTarefas(obra_id: string): Promise<Tarefa[]> {
    if (!obra_id) {
      throw new TarefaServiceError('ID da obra é obrigatório');
    }

    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('obra_id', obra_id)
      .order('semana', { ascending: false })
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new TarefaServiceError('Erro ao listar tarefas', error);
    }
    
    return data ?? [];
  },

  async criarTarefa(tarefa: Omit<Tarefa, 'id' | 'created_at'>): Promise<Tarefa> {
    if (!tarefa.obra_id) {
      throw new TarefaServiceError('ID da obra é obrigatório');
    }
    
    if (!tarefa.semana) {
      throw new TarefaServiceError('Semana é obrigatória');
    }

    if (!tarefa.descricao?.trim()) {
      throw new TarefaServiceError('Descrição da tarefa é obrigatória');
    }

    const { data, error } = await supabase
      .from('tarefas')
      .insert([tarefa])
      .select()
      .single();
    
    if (error) {
      throw new TarefaServiceError('Erro ao criar tarefa', error);
    }

    if (!data) {
      throw new TarefaServiceError('Nenhum dado retornado ao criar tarefa');
    }
    
    return data;
  },

  async atualizarTarefa(id: string, tarefa: Partial<Tarefa>): Promise<Tarefa> {
    if (!id) {
      throw new TarefaServiceError('ID da tarefa é obrigatório');
    }

    if (Object.keys(tarefa).length === 0) {
      throw new TarefaServiceError('Nenhum dado para atualizar');
    }

    const { data, error } = await supabase
      .from('tarefas')
      .update(tarefa)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new TarefaServiceError('Erro ao atualizar tarefa', error);
    }

    if (!data) {
      throw new TarefaServiceError('Tarefa não encontrada');
    }
    
    return data;
  },

  async excluirTarefa(id: string): Promise<void> {
    if (!id) {
      throw new TarefaServiceError('ID da tarefa é obrigatório');
    }

    const { error } = await supabase
      .from('tarefas')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new TarefaServiceError('Erro ao excluir tarefa', error);
    }
  },

  async atualizarOrdens(tarefas: { id: string; ordem: number }[]): Promise<void> {
    if (!tarefas || tarefas.length === 0) {
      return;
    }

    // Update each task's order individually
    const updates = tarefas.map(({ id, ordem }) => 
      supabase
        .from('tarefas')
        .update({ ordem })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new TarefaServiceError('Erro ao atualizar ordens das tarefas', errors[0].error);
    }
  }
};
