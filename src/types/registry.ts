export interface Registro {
  id: string;
  obra_id: string | null;
  user_id: string | null;
  tipo: string;
  valor: string;
  created_at: string;
}
