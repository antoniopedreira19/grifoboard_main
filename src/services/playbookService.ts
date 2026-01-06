import { supabase } from "@/integrations/supabase/client";

// Tipos alinhados com o Banco de Dados
export interface PlaybookConfig {
  obra_id: string;
  coeficiente_1: number;
  coeficiente_2: number;
  coeficiente_selecionado: string;
}

export interface PlaybookItemInsert {
  obra_id: string;
  descricao: string;
  unidade: string;
  qtd: number;
  preco_unitario: number;
  preco_total: number;
  is_etapa: boolean;
  nivel: number;
  ordem: number;
  // Campos da Fase 2 (opcionais no insert)
  destino?: string | null;
  responsavel?: string | null;
  data_limite?: string | null;
  valor_contratado?: number | null;
  status_contratacao?: string | null;
  observacao?: string | null;
  contract_url?: string | null; // <--- ADICIONADO
}

export interface PlaybookItemUpdate {
  destino?: string | null;
  responsavel?: string | null;
  data_limite?: string | null;
  valor_contratado?: number | null;
  status_contratacao?: string | null;
  observacao?: string | null;
  contract_url?: string | null; // <--- CORREÇÃO: ADICIONADO AQUI PARA RESOLVER O ERRO
}

export const playbookService = {
  async getPlaybook(obraId: string) {
    const { data: config } = await supabase.from("playbook_config").select("*").eq("obra_id", obraId).single();

    const { data: items, error } = await supabase
      .from("playbook_items")
      .select("*")
      .eq("obra_id", obraId)
      .order("ordem", { ascending: true });

    if (error) throw error;

    return { config, items };
  },

  async savePlaybook(obraId: string, config: PlaybookConfig, items: PlaybookItemInsert[]) {
    // 1. Salvar/Atualizar Configuração
    const { error: configError } = await supabase
      .from("playbook_config")
      .upsert({ ...config, obra_id: obraId }, { onConflict: "obra_id" });

    if (configError) throw configError;

    // 2. Substituir Itens
    if (items.length > 0) {
      const { error: deleteError } = await supabase.from("playbook_items").delete().eq("obra_id", obraId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase.from("playbook_items").insert(items);

      if (insertError) throw insertError;
    } else {
      const { error: deleteError } = await supabase.from("playbook_items").delete().eq("obra_id", obraId);

      if (deleteError) throw deleteError;
    }
  },

  async updateItem(id: string, updates: PlaybookItemUpdate) {
    const { error } = await supabase.from("playbook_items").update(updates).eq("id", id);

    if (error) throw error;
  },

  async deleteItem(id: string) {
    const { error } = await supabase.from("playbook_items").delete().eq("id", id);

    if (error) throw error;
  },
};
