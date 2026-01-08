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
    const { data, error } = await supabase
      .from("agenda_events")
      .insert([evento])
      .select()
      .single();

    if (error) throw error;
    return data as AgendaEvent;
  },

  async deletarEvento(id: string) {
    const { error } = await supabase.from("agenda_events").delete().eq("id", id);
    if (error) throw error;
  }
};
