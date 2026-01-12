import { supabase } from '@/integrations/supabase/client';
import { Obra } from '@/types/supabase';

class ObraServiceError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'ObraServiceError';
  }
}

export const obrasService = {
  async listarObras(): Promise<Obra[]> {
    const { data, error } = await supabase
      .from('obras')
      .select('id, nome_obra, localizacao, status, data_inicio, data_termino, created_at, usuario_id')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new ObraServiceError('Erro ao listar obras', error);
    }
    
    return data ?? [];
  },

  async criarObra(obra: Omit<Obra, 'id' | 'created_at'> & { created_by?: string }): Promise<Obra> {
    if (!obra.nome_obra?.trim()) {
      throw new ObraServiceError('Nome da obra é obrigatório');
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new ObraServiceError('Usuário não autenticado');
    }

    // Buscar empresa_id do usuário atual
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .maybeSingle();

    if (userError) {
      throw new ObraServiceError('Erro ao buscar dados do usuário', userError);
    }
    
    const obraToCreate = {
      nome_obra: obra.nome_obra,
      localizacao: obra.localizacao || null,
      data_inicio: obra.data_inicio || null,
      data_termino: obra.data_termino || null,
      status: obra.status || 'em_andamento',
      created_by: obra.created_by || user.id,
      empresa_id: userData?.empresa_id || null,
    };
    
    const { data, error } = await supabase
      .from('obras')
      .insert([obraToCreate])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar obra:', error);
      throw new ObraServiceError('Erro ao criar obra', error);
    }

    if (!data) {
      throw new ObraServiceError('Nenhum dado retornado ao criar obra');
    }
    
    return data;
  },

  async atualizarObra(id: string, obra: Partial<Obra>): Promise<Obra> {
    if (!id) {
      throw new ObraServiceError('ID da obra é obrigatório');
    }

    if (Object.keys(obra).length === 0) {
      throw new ObraServiceError('Nenhum dado para atualizar');
    }

    const { data, error } = await supabase
      .from('obras')
      .update(obra)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new ObraServiceError('Erro ao atualizar obra', error);
    }

    if (!data) {
      throw new ObraServiceError('Obra não encontrada');
    }
    
    return data;
  },

  async excluirObra(id: string): Promise<void> {
    if (!id) {
      throw new ObraServiceError('ID da obra é obrigatório');
    }

    const { error } = await supabase
      .from('obras')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new ObraServiceError('Erro ao excluir obra', error);
    }
  },

  async listarObrasDaEmpresa(obraId: string): Promise<Obra[]> {
    if (!obraId) {
      throw new ObraServiceError('ID da obra é obrigatório');
    }

    // First get the empresa_id of the current obra
    const { data: obraAtual, error: obraError } = await supabase
      .from('obras')
      .select('empresa_id')
      .eq('id', obraId)
      .single();

    if (obraError || !obraAtual) {
      throw new ObraServiceError('Erro ao buscar obra atual', obraError);
    }

    // Then get all obras from the same empresa (excluding current obra)
    const { data, error } = await supabase
      .from('obras')
      .select('id, nome_obra, localizacao, status, data_inicio, data_termino, created_at, usuario_id, empresa_id')
      .eq('empresa_id', obraAtual.empresa_id)
      .neq('id', obraId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new ObraServiceError('Erro ao listar obras da empresa', error);
    }
    
    return data ?? [];
  }
};
