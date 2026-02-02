import { supabase } from "@/integrations/supabase/client";
import { AgendaEvent, AgendaEventInsert } from "@/types/agenda";
import { addDays, addMonths, isBefore, isAfter, parseISO, format, getDay, differenceInMilliseconds } from "date-fns";

export interface RecurrenceConfig {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  weekDays: number[]; // 0 = domingo, 1 = segunda, etc.
  endDate: string;
}

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

  /**
   * Cria múltiplos eventos baseado em configuração de recorrência
   */
  async criarEventosRecorrentes(
    eventoBase: AgendaEventInsert,
    recurrence: RecurrenceConfig
  ): Promise<AgendaEvent[]> {
    if (!recurrence.enabled) {
      // Se não é recorrente, cria evento único
      const evento = await this.criarEvento(eventoBase);
      return [evento];
    }

    const eventos: AgendaEventInsert[] = [];
    const startDate = parseISO(eventoBase.start_date);
    const endDate = parseISO(eventoBase.end_date);
    const recurrenceEndDate = parseISO(recurrence.endDate);
    
    // Calcula a duração do evento
    const eventDuration = differenceInMilliseconds(endDate, startDate);

    let currentDate = startDate;

    while (isBefore(currentDate, recurrenceEndDate) || format(currentDate, "yyyy-MM-dd") === format(recurrenceEndDate, "yyyy-MM-dd")) {
      const shouldAdd = this.shouldAddEventForDate(currentDate, recurrence);

      if (shouldAdd) {
        const eventEndDate = new Date(currentDate.getTime() + eventDuration);
        eventos.push({
          ...eventoBase,
          start_date: currentDate.toISOString(),
          end_date: eventEndDate.toISOString(),
        });
      }

      // Avança para próxima data baseado na frequência
      currentDate = this.getNextDate(currentDate, recurrence);
    }

    // Insere todos os eventos de uma vez
    if (eventos.length === 0) {
      throw new Error("Nenhum evento para criar com a configuração de recorrência selecionada.");
    }

    const { data, error } = await supabase
      .from("agenda_events")
      .insert(eventos)
      .select();

    if (error) throw error;
    return data as AgendaEvent[];
  },

  /**
   * Verifica se deve adicionar evento para uma data específica
   */
  shouldAddEventForDate(date: Date, recurrence: RecurrenceConfig): boolean {
    if (recurrence.frequency === "daily") {
      return true;
    }

    if (recurrence.frequency === "weekly") {
      const dayOfWeek = getDay(date);
      return recurrence.weekDays.includes(dayOfWeek);
    }

    // Para mensal, cria no mesmo dia do mês
    return true;
  },

  /**
   * Retorna a próxima data baseado na frequência
   */
  getNextDate(currentDate: Date, recurrence: RecurrenceConfig): Date {
    switch (recurrence.frequency) {
      case "daily":
        return addDays(currentDate, 1);
      case "weekly":
        return addDays(currentDate, 1); // Verifica dia a dia para weekly
      case "monthly":
        return addMonths(currentDate, 1);
      default:
        return addDays(currentDate, 1);
    }
  },

  /**
   * Copia um evento para outra data
   */
  async copiarEvento(evento: AgendaEvent, targetDate: Date): Promise<AgendaEvent> {
    const originalStart = parseISO(evento.start_date);
    const originalEnd = parseISO(evento.end_date);
    
    // Mantém o mesmo horário, muda apenas a data
    const newStartDate = new Date(targetDate);
    newStartDate.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    
    const newEndDate = new Date(targetDate);
    newEndDate.setHours(originalEnd.getHours(), originalEnd.getMinutes(), 0, 0);

    const novoEvento: AgendaEventInsert = {
      obra_id: evento.obra_id,
      title: evento.title,
      description: evento.description,
      start_date: newStartDate.toISOString(),
      end_date: newEndDate.toISOString(),
      category: evento.category,
      participants: evento.participants,
    };

    return await this.criarEvento(novoEvento);
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

  async deletarAnexo(anexoUrl: string, eventoId: string) {
    // Extrai o path do arquivo da URL pública
    const urlParts = anexoUrl.split('/agenda-anexos/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      
      const { error: deleteError } = await supabase.storage
        .from("agenda-anexos")
        .remove([filePath]);

      if (deleteError) throw deleteError;
    }

    // Limpa a referência no evento
    const { error } = await supabase
      .from("agenda_events")
      .update({ anexo_url: null })
      .eq("id", eventoId);

    if (error) throw error;
  },
};
