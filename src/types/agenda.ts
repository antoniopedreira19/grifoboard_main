export interface AgendaEvent {
  id: string;
  obra_id: string;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  participants: string[] | null;
  category: string | null;
  created_by?: string | null;
  created_at?: string | null;
  completed: boolean | null;
  resumo?: string | null;
  anexo_url?: string | null;
  justification?: string | null;
}

export type AgendaEventInsert = Omit<
  AgendaEvent,
  "id" | "created_by" | "completed" | "created_at" | "resumo" | "anexo_url"
>;
