import { supabase } from '@/integrations/supabase/client';
import { Obra } from '@/types/supabase';

class ObraServiceError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'ObraServiceError';
  }
}

export const obrasService = {
  async listarObras(): Promise<(Obra & { responsavel_nome?: string })[]> {
    // Primeiro busca as obras
    const { data: obras, error } = await supabase
      .from('obras')
      .select('id, nome_obra, localizacao, status, data_inicio, data_termino, created_at, usuario_id, created_by, empresa_id')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao listar obras:', error);
      throw new ObraServiceError('Erro ao listar obras', error);
    }

    if (!obras || obras.length === 0) {
      return [];
    }

    // Buscar os nomes dos responsáveis
    const usuarioIds = [...new Set(obras.map(o => o.usuario_id).filter(Boolean))];
    
    let usuariosMap: Record<string, { nome: string | null; email: string | null }> = {};
    
    if (usuarioIds.length > 0) {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .in('id', usuarioIds);
      
      if (usuarios) {
        usuariosMap = usuarios.reduce((acc, u) => {
          acc[u.id] = { nome: u.nome, email: u.email };
          return acc;
        }, {} as Record<string, { nome: string | null; email: string | null }>);
      }
    }
    
    // Mapear para incluir nome do responsável
    return obras.map(obra => ({
      ...obra,
      responsavel_nome: obra.usuario_id 
        ? (usuariosMap[obra.usuario_id]?.nome || usuariosMap[obra.usuario_id]?.email || null)
        : null
    }));
  },

  async criarObra(obra: Omit<Obra, 'id' | 'created_at'> & { usuario_id?: string }): Promise<Obra> {
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
      usuario_id: obra.usuario_id || user.id,
      created_by: user.id,
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
