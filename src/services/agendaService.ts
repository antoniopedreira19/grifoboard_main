import { supabase } from "@/integrations/supabase/client";
import { AgendaEvent, AgendaEventInsert } from "@/types/agenda";

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

  async toggleConclusao(id: string, completed: boolean) {
    const { error } = await supabase.from("agenda_events").update({ completed }).eq("id", id);

    if (error) throw error;
  },

  async atualizarEvento(id: string, updates: Partial<Pick<AgendaEvent, "title" | "description" | "start_date" | "end_date" | "category" | "participants" | "resumo" | "anexo_url">>) {
    const { error } = await supabase.from("agenda_events").update(updates).eq("id", id);
    if (error) throw error;
  },

  async deletarEvento(id: string) {
    const { error } = await supabase.from("agenda_events").delete().eq("id", id);
    if (error) throw error;
  },

  async uploadAnexo(file: File, obraId: string, eventoId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${obraId}/${eventoId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("agenda-anexos")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("agenda-anexos")
      .getPublicUrl(fileName);

    return publicUrl;
  },
};
