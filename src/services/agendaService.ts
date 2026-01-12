import { supabase } from "@/integrations/supabase/client";
import { AgendaEvent, AgendaEventInsert } from "@/types/agenda";
import { gamificationService } from "@/services/gamificationService";

export const agendaService = {
  async listarEventos(obraId: string, monthStart: Date, monthEnd: Date) {
    const { data, error } = await supabase
      .from("agenda_events")
      .select("*")
      .eq("obra_id", obraId)
      .gte("start_date", monthStart.toISOString())
      .lte("start_date", monthEnd.toISOString())
      .order("start_date", { ascending: true });

    if (error) throw error;
    return data as AgendaEvent[];
  },

  async criarEvento(evento: AgendaEventInsert) {
    const { data, error } = await supabase.from("agenda_events").insert([evento]).select().single();

    if (error) throw error;
    return data as AgendaEvent;
  },

  // --- NOVA LÓGICA DE STATUS ---

  // 1. Concluir: Marca como feito, limpa justificativa e dá XP
  async concluirEvento(id: string, userId: string) {
    const { error } = await supabase
      .from("agenda_events")
      .update({
        completed: true,
        justification: null,
      } as any)
      .eq("id", id);

    if (error) throw error;

    // Tenta adicionar XP
    try {
      // CORREÇÃO: Usando awardXP (userId, action, amount, referenceId)
      await gamificationService.awardXP(userId, "AGENDA_EVENTO_CONCLUIDO", 50, id);
    } catch (xpError) {
      console.error("Erro ao computar XP:", xpError);
    }
  },

  // 2. Justificar: Marca como não feito (false), salva o motivo e NÃO dá XP
  async justificarNaoConclusao(id: string, justificativa: string) {
    const { error } = await supabase
      .from("agenda_events")
      .update({
        completed: false,
        justification: justificativa,
      } as any)
      .eq("id", id);

    if (error) throw error;
  },

  // 3. Resetar: Volta para o estado inicial (pendente)
  async resetarStatus(id: string) {
    const { error } = await supabase
      .from("agenda_events")
      .update({
        completed: false,
        justification: null,
      } as any)
      .eq("id", id);

    if (error) throw error;
  },

  // -----------------------------

  async atualizarEvento(
    id: string,
    updates: Partial<
      Pick<
        AgendaEvent,
        "title" | "description" | "start_date" | "end_date" | "category" | "participants" | "resumo" | "anexo_url"
      >
    >,
  ) {
    const { error } = await supabase.from("agenda_events").update(updates).eq("id", id);
    if (error) throw error;
  },

  async deletarEvento(id: string) {
    const { error } = await supabase.from("agenda_events").delete().eq("id", id);
    if (error) throw error;
  },

  async uploadAnexo(file: File, obraId: string, eventoId: string) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${obraId}/${eventoId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("agenda-anexos").upload(fileName, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("agenda-anexos").getPublicUrl(fileName);

    return publicUrl;
  },

  async deletarAnexo(anexoUrl: string, eventoId: string) {
    // Extrai o path do arquivo da URL pública
    const urlParts = anexoUrl.split("/agenda-anexos/");
    if (urlParts.length > 1) {
      const filePath = urlParts[1];

      const { error: deleteError } = await supabase.storage.from("agenda-anexos").remove([filePath]);

      if (deleteError) throw deleteError;
    }

    // Limpa a referência no evento
    const { error } = await supabase.from("agenda_events").update({ anexo_url: null }).eq("id", eventoId);

    if (error) throw error;
  },
};
