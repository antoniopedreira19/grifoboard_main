import { supabase } from "@/integrations/supabase/client";
import type { PmpAtividade, Restricao } from "@/types/pmp";

// Service layer para operações de PMP
export const pmpService = {
  // ============ ATIVIDADES ============
  
  async fetchAtividades(obraId: string): Promise<PmpAtividade[]> {
    const { data, error } = await supabase
      .from("pmp_atividades" as any)
      .select("*, pmp_restricoes(*)")
      .eq("obra_id", obraId)
      .order("ordem", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as PmpAtividade[];
  },

  async createAtividade(
    obraId: string,
    data: Omit<PmpAtividade, "id" | "obra_id" | "pmp_restricoes">,
    ordem: number
  ): Promise<PmpAtividade> {
    const { data: inserted, error } = await supabase
      .from("pmp_atividades" as any)
      .insert({ obra_id: obraId, ordem, ...data })
      .select()
      .single();

    if (error) throw error;
    return inserted as unknown as PmpAtividade;
  },

  async updateAtividade(
    id: string,
    data: Partial<PmpAtividade>
  ): Promise<void> {
    const { error } = await supabase
      .from("pmp_atividades" as any)
      .update(data)
      .eq("id", id);

    if (error) throw error;
  },

  async deleteAtividade(id: string): Promise<void> {
    const { error } = await supabase
      .from("pmp_atividades" as any)
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async moveAtividade(
    id: string,
    updates: {
      semana_referencia: string;
      data_inicio?: string | null;
      data_termino?: string | null;
      ordem?: number;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from("pmp_atividades" as any)
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  },

  async toggleConcluido(id: string, concluido: boolean): Promise<void> {
    const { error } = await supabase
      .from("pmp_atividades" as any)
      .update({ concluido })
      .eq("id", id);

    if (error) throw error;
  },

  // ============ RESTRIÇÕES ============

  async createRestricoes(
    atividadeId: string,
    restricoes: Omit<Restricao, "id" | "atividade_id">[]
  ): Promise<void> {
    if (restricoes.length === 0) return;

    const payload = restricoes.map((r) => ({
      atividade_id: atividadeId,
      descricao: r.descricao,
      data_limite: r.data_limite,
      resolvido: false,
    }));

    const { error } = await supabase
      .from("pmp_restricoes" as any)
      .insert(payload);

    if (error) throw error;
  },

  async updateRestricao(id: string, resolvido: boolean): Promise<void> {
    const { error } = await supabase
      .from("pmp_restricoes" as any)
      .update({ resolvido })
      .eq("id", id);

    if (error) throw error;
  },

  async deleteRestricao(id: string): Promise<void> {
    const { error } = await supabase
      .from("pmp_restricoes" as any)
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // ============ OBRA ============

  async fetchObra(obraId: string): Promise<any> {
    const { data, error } = await supabase
      .from("obras" as any)
      .select("*")
      .eq("id", obraId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateObraPlanta(obraId: string, plantaUrl: string | null): Promise<void> {
    const { error } = await supabase
      .from("obras" as any)
      .update({ pmp_planta_url: plantaUrl })
      .eq("id", obraId);

    if (error) throw error;
  },

  // ============ UPLOAD ============

  async uploadPlantaImage(obraId: string, file: File): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `pmp-planta-${obraId}-${Date.now()}.${fileExt}`;
    const filePath = `${obraId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("diario-obra")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("diario-obra")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  },
};
