import { supabase } from '@/integrations/supabase/client';

interface Registro {
  id: string;
  obra_id: string | null;
  user_id: string | null;
  tipo: string;
  valor: string;
  created_at: string;
}

class RegistroServiceError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'RegistroServiceError';
  }
}

const VALID_TIPOS = ['sector', 'discipline', 'team', 'responsible', 'executor'] as const;
type TipoRegistro = typeof VALID_TIPOS[number];

// Helper function to update related tables
async function updateRelatedTables(
  tipo: TipoRegistro, 
  obraId: string | null, 
  oldValue: string, 
  newValue: string
): Promise<void> {
  if (!obraId) return; // Skip for user-level registries
  
  try {
    switch (tipo) {
      case 'sector':
        await Promise.all([
          supabase.from('tarefas')
            .update({ setor: newValue })
            .eq('obra_id', obraId)
            .eq('setor', oldValue),
          supabase.from('atividades_checklist')
            .update({ setor: newValue })
            .eq('obra_id', obraId)
            .eq('setor', oldValue)
        ]);
        break;

      case 'discipline':
        await supabase.from('tarefas')
          .update({ disciplina: newValue })
          .eq('obra_id', obraId)
          .eq('disciplina', oldValue);
        break;

      case 'team':
        await supabase.from('tarefas')
          .update({ encarregado: newValue })
          .eq('obra_id', obraId)
          .eq('encarregado', oldValue);
        break;

      case 'responsible':
        await Promise.all([
          supabase.from('tarefas')
            .update({ responsavel: newValue })
            .eq('obra_id', obraId)
            .eq('responsavel', oldValue),
          supabase.from('atividades_checklist')
            .update({ responsavel: newValue })
            .eq('obra_id', obraId)
            .eq('responsavel', oldValue)
        ]);

        // Update materials
        const { data: tarefasIds } = await supabase
          .from('tarefas')
          .select('id')
          .eq('obra_id', obraId);
        
        if (tarefasIds && tarefasIds.length > 0) {
          const taskIds = tarefasIds.map(t => t.id);
          await supabase.from('materiais_tarefa')
            .update({ responsavel: newValue })
            .eq('responsavel', oldValue)
            .in('tarefa_id', taskIds);
        }
        break;

      case 'executor':
        await supabase.from('tarefas')
          .update({ executante: newValue })
          .eq('obra_id', obraId)
          .eq('executante', oldValue);
        break;
    }
  } catch (error) {
    console.error('Erro ao atualizar tabelas relacionadas:', error);
    throw error;
  }
}

export const registrosService = {
  // List all registros for a specific obra
  async listarRegistros(obra_id: string): Promise<Registro[]> {
    if (!obra_id) {
      throw new RegistroServiceError('ID da obra é obrigatório');
    }

    const { data, error } = await supabase
      .from('registros')
      .select('id, obra_id, user_id, tipo, valor, created_at')
      .eq('obra_id', obra_id)
      .order('tipo', { ascending: true })
      .order('valor', { ascending: true });
    
    if (error) {
      throw new RegistroServiceError('Erro ao listar registros', error);
    }
    
    return data ?? [];
  },

  // List user's personal registros (not tied to any obra)
  async listarRegistrosUsuario(): Promise<Registro[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new RegistroServiceError('Usuário não autenticado', authError);

      const { data, error } = await supabase
        .from('registros')
        .select('id, obra_id, user_id, tipo, valor, created_at')
        .eq('user_id', user.id)
        .is('obra_id', null)
        .order('tipo', { ascending: true })
        .order('valor', { ascending: true });

      if (error) throw new RegistroServiceError('Erro ao listar registros do usuário', error);
      return data || [];
    } catch (error) {
      console.error('Error in listarRegistrosUsuario:', error);
      throw error instanceof RegistroServiceError 
        ? error 
        : new RegistroServiceError('Erro inesperado ao listar registros do usuário', error as Error);
    }
  },

  // Create a new registro (obra-specific or user-level)
  async criarRegistro(registro: { obra_id?: string | null; tipo: string; valor: string }): Promise<Registro> {
    if (!registro.tipo || !registro.valor?.trim()) {
      throw new RegistroServiceError('Tipo e valor são obrigatórios');
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new RegistroServiceError('Usuário não autenticado', authError);

      const insertData = registro.obra_id 
        ? { obra_id: registro.obra_id, tipo: registro.tipo, valor: registro.valor }
        : { user_id: user.id, tipo: registro.tipo, valor: registro.valor };

      const { data, error } = await supabase
        .from('registros')
        .insert([insertData])
        .select()
        .single();
      
      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
          const query = registro.obra_id
            ? supabase.from('registros').select('*').eq('obra_id', registro.obra_id)
            : supabase.from('registros').select('*').eq('user_id', user.id).is('obra_id', null);
          
          const { data: existingData } = await query
            .eq('tipo', registro.tipo)
            .eq('valor', registro.valor)
            .single();
            
          if (existingData) return existingData;
        }
        
        throw new RegistroServiceError('Erro ao criar registro', error);
      }

      if (!data) {
        throw new RegistroServiceError('Nenhum dado retornado ao criar registro');
      }
      
      return data;
    } catch (error) {
      console.error('Error in criarRegistro:', error);
      throw error instanceof RegistroServiceError 
        ? error 
        : new RegistroServiceError('Erro inesperado ao criar registro', error as Error);
    }
  },

  // Copy registros from another obra to current obra (must be same empresa)
  async copiarRegistrosDeOutraObra(obraDestinoId: string, obraOrigemId: string): Promise<void> {
    if (!obraDestinoId || !obraOrigemId) {
      throw new RegistroServiceError('IDs das obras são obrigatórios');
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new RegistroServiceError('Usuário não autenticado', authError);

      // Verify both obras belong to same empresa
      const { data: obras, error: obrasError } = await supabase
        .from('obras')
        .select('id, empresa_id')
        .in('id', [obraDestinoId, obraOrigemId]);

      if (obrasError) {
        throw new RegistroServiceError('Erro ao verificar obras', obrasError);
      }

      if (!obras || obras.length !== 2) {
        throw new RegistroServiceError('Uma ou mais obras não encontradas');
      }

      const empresaIds = obras.map(o => o.empresa_id);
      if (empresaIds[0] !== empresaIds[1]) {
        throw new RegistroServiceError('As obras devem pertencer à mesma empresa');
      }

      // Get registros from source obra
      const { data: registrosOrigem, error: fetchError } = await supabase
        .from('registros')
        .select('tipo, valor')
        .eq('obra_id', obraOrigemId);

      if (fetchError) {
        throw new RegistroServiceError('Erro ao buscar registros da obra origem', fetchError);
      }

      if (!registrosOrigem || registrosOrigem.length === 0) {
        throw new RegistroServiceError('Nenhum registro encontrado na obra selecionada');
      }

      // Insert into destination obra (empresa_id will be auto-set by trigger)
      const insertData = registrosOrigem.map(r => ({
        obra_id: obraDestinoId,
        tipo: r.tipo,
        valor: r.valor
      }));

      const { error } = await supabase
        .from('registros')
        .insert(insertData);

      if (error) {
        if (error.code === '23505') {
          // Some registros already exist, that's ok
          console.log('Alguns cadastros já existem nesta obra');
        } else {
          throw new RegistroServiceError('Erro ao copiar registros para obra', error);
        }
      }
    } catch (error) {
      console.error('Error in copiarRegistrosDeOutraObra:', error);
      throw error instanceof RegistroServiceError 
        ? error 
        : new RegistroServiceError('Erro inesperado ao copiar registros', error as Error);
    }
  },

  async editarRegistro(id: string, novoValor: string): Promise<Registro> {
    if (!id) {
      throw new RegistroServiceError('ID do registro é obrigatório');
    }

    if (!novoValor?.trim()) {
      throw new RegistroServiceError('Novo valor é obrigatório');
    }

    // Fetch current registro
    const { data: currentRegistro, error: fetchError } = await supabase
      .from('registros')
      .select('id, obra_id, user_id, tipo, valor, created_at')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      throw new RegistroServiceError('Erro ao buscar registro', fetchError);
    }

    if (!currentRegistro) {
      throw new RegistroServiceError('Registro não encontrado');
    }
    
    const oldValue = currentRegistro.valor;
    const tipo = currentRegistro.tipo as TipoRegistro;
    const obraId = currentRegistro.obra_id;
    
    // If value hasn't changed, return early
    if (oldValue === novoValor) {
      return currentRegistro;
    }

    // Update the registro
    const { data, error } = await supabase
      .from('registros')
      .update({ valor: novoValor })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new RegistroServiceError('Erro ao atualizar registro', error);
    }

    if (!data) {
      throw new RegistroServiceError('Nenhum dado retornado ao atualizar registro');
    }
    
    // Update related tables - await to ensure consistency
    try {
      await updateRelatedTables(tipo, obraId, oldValue, novoValor);
    } catch (relatedError) {
      console.error('Erro ao atualizar tabelas relacionadas:', relatedError);
      // Continue even if related updates fail - the main registro was updated
    }
    
    return data;
  },

  // Delete a registro (obra-specific or user-level)
  async excluirRegistro(obra_id: string | null, tipo: string, valor: string): Promise<void> {
    if (!tipo || !valor) {
      throw new RegistroServiceError('Tipo e valor são obrigatórios');
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new RegistroServiceError('Usuário não autenticado', authError);

      let query = supabase.from('registros').delete();
      
      if (obra_id) {
        query = query.eq('obra_id', obra_id);
      } else {
        query = query.eq('user_id', user.id).is('obra_id', null);
      }
      
      const { error } = await query.eq('tipo', tipo).eq('valor', valor);

      if (error) throw new RegistroServiceError('Erro ao excluir registro', error);
    } catch (error) {
      console.error('Error in excluirRegistro:', error);
      throw error instanceof RegistroServiceError 
        ? error 
        : new RegistroServiceError('Erro inesperado ao excluir registro', error as Error);
    }
  }
};
