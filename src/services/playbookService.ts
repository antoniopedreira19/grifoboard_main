import { supabase } from "@/integrations/supabase/client";
import { PlaybookItem, PlaybookInsert, PlaybookUpdate } from "@/types/playbook";

export interface PlaybookConfig {
  obra_id: string;
  coeficiente_1: number;
  coeficiente_2: number;
  coeficiente_selecionado: string;
}

export const playbookService = {
  // Busca completa com Configuração (Usado no Importador/Resumo)
  async getPlaybook(obraId: string) {
    const { data: config } = await supabase.from("playbook_config").select("*").eq("obra_id", obraId).maybeSingle();

    const { data: items, error } = await supabase
      .from("playbook_items")
      .select("*")
      .eq("obra_id", obraId)
      .order("ordem", { ascending: true });

    if (error) throw error;

    return { config, items: items as unknown as PlaybookItem[] };
  },

  // Busca simples de lista de itens (Usado no ContractingManagement)
  async listarItens(obraId: string): Promise<PlaybookItem[]> {
    const { data, error } = await supabase
      .from("playbook_items")
      .select("*")
      .eq("obra_id", obraId)
      .order("ordem", { ascending: true });

    if (error) throw error;
    return data as unknown as PlaybookItem[];
  },

  // Salvar em lote (Importação)
  async savePlaybook(obraId: string, config: PlaybookConfig, items: Partial<PlaybookItem>[]) {
    // 1. Configuração
    const { error: configError } = await supabase
      .from("playbook_config")
      .upsert({ ...config, obra_id: obraId }, { onConflict: "obra_id" });

    if (configError) throw configError;

    // 2. Substituir Itens (Transação implícita via delete+insert)
    // Nota: Em produção idealmente usaria RPC, mas delete/insert funciona para este volume
    const { error: deleteError } = await supabase.from("playbook_items").delete().eq("obra_id", obraId);
    if (deleteError) throw deleteError;

    if (items.length > 0) {
      // Garantir que campos obrigatórios tenham defaults se vierem parciais
      const itemsToInsert = items.map((item) => ({
        obra_id: obraId,
        descricao: item.descricao || "",
        unidade: item.unidade || "",
        qtd: item.qtd || 0,
        preco_unitario: item.preco_unitario || 0,
        preco_total: item.preco_total || 0,
        is_etapa: item.is_etapa || false,
        is_parent: item.is_parent || false,
        nivel: item.nivel || 2,
        ordem: item.ordem || 0,
        codigo: item.codigo || "",
        // Novos campos
        valor_mao_de_obra: item.valor_mao_de_obra || 0,
        valor_materiais: item.valor_materiais || 0,
        valor_equipamentos: item.valor_equipamentos || 0,
        valor_verbas: item.valor_verbas || 0,
      }));

      const { error: insertError } = await supabase.from("playbook_items").insert(itemsToInsert);
      if (insertError) throw insertError;
    }
  },

  // Atualização granular (Alias para updateItem para compatibilidade com ContractingManagement)
  async atualizarItem(id: string, updates: PlaybookUpdate) {
    const { error } = await supabase.from("playbook_items").update(updates).eq("id", id);
    if (error) throw error;
  },

  async updateItem(id: string, updates: PlaybookUpdate) {
    return this.atualizarItem(id, updates);
  },

  async deleteItem(id: string) {
    const { error } = await supabase.from("playbook_items").delete().eq("id", id);
    if (error) throw error;
  },
};
