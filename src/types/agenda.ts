export interface AgendaEvent {
  id: string;
  obra_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  participants: string[];
  category: "geral" | "reuniao" | "visita" | "entrega" | "milestone";
  created_by?: string;
  completed: boolean; // Novo campo
}

export type AgendaEventInsert = Omit<AgendaEvent, "id" | "created_by" | "completed">;
