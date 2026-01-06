import { supabase } from "@/integrations/supabase/client";

export interface DiarioObra {
  id: string;
  obra_id: string;
  data: string;
  clima?: string;
  mao_de_obra?: string;
  equipamentos?: string;
  atividades: string;
  ocorrencias?: string;
  observacoes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Interface para criar ou atualizar
export interface DiarioObraUpsert {
  id?: string | null;
  obra_id: string;
  data_diario: string;
  clima?: string;
  mao_de_obra?: string;
  equipamentos?: string;
  atividades: string;
  ocorrencias?: string;
  observacoes?: string;
}

export const diarioService = {
  // Busca lista (existente)
  async getByObra(obraId: string, startDate?: string, endDate?: string) {
    let query = supabase.from("diarios_obra").select("*").eq("obra_id", obraId).order("data", { ascending: false });

    if (startDate) {
      query = query.gte("data", startDate);
    }
    if (endDate) {
      query = query.lte("data", endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as DiarioObra[];
  },

  // Busca por data específica (Necessário para a navegação de histórico)
  async getDiarioByDate(obraId: string, date: Date) {
    // Ajuste para fuso horário local se necessário, ou usar UTC string simples
    const dateStr = date.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("diarios_obra")
      .select("*")
      .eq("obra_id", obraId)
      .eq("data", dateStr)
      .maybeSingle();

    if (error) throw error;
    return data as DiarioObra | null;
  },

  // Cria ou Atualiza (Upsert inteligente)
  async upsertDiario(diario: DiarioObraUpsert) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const payload: any = {
      obra_id: diario.obra_id,
      data: diario.data_diario,
      clima: diario.clima,
      mao_de_obra: diario.mao_de_obra,
      equipamentos: diario.equipamentos,
      atividades: diario.atividades,
      ocorrencias: diario.ocorrencias,
      observacoes: diario.observacoes,
      created_by: user.id,
    };

    // Se tiver ID, atualiza
    if (diario.id) {
      const { data, error } = await supabase.from("diarios_obra").update(payload).eq("id", diario.id).select().single();

      if (error) throw error;
      return data as DiarioObra;
    }
    // Se não, busca por data antes de inserir para evitar duplicidade
    else {
      const existing = await this.getDiarioByDate(diario.obra_id, new Date(diario.data_diario));

      if (existing) {
        const { data, error } = await supabase
          .from("diarios_obra")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as DiarioObra;
      } else {
        const { data, error } = await supabase.from("diarios_obra").insert([payload]).select().single();

        if (error) throw error;
        return data as DiarioObra;
      }
    }
  },

  async delete(id: string) {
    const { error } = await supabase.from("diarios_obra").delete().eq("id", id);

    if (error) throw error;
  },
};
