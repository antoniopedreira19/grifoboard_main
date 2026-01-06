
-- Create a table for checklist activities
CREATE TABLE public.atividades_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL,
  local TEXT NOT NULL,
  setor TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  data_inicio DATE,
  data_termino DATE,
  concluida BOOLEAN NOT NULL DEFAULT false,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.atividades_checklist ENABLE ROW LEVEL SECURITY;

-- Create policies for checklist activities
CREATE POLICY "Users can view checklist activities for their obras" 
  ON public.atividades_checklist 
  FOR SELECT 
  USING (obra_id IN (SELECT id FROM public.obras WHERE usuario_id = auth.uid()));

CREATE POLICY "Users can create checklist activities for their obras" 
  ON public.atividades_checklist 
  FOR INSERT 
  WITH CHECK (obra_id IN (SELECT id FROM public.obras WHERE usuario_id = auth.uid()));

CREATE POLICY "Users can update checklist activities for their obras" 
  ON public.atividades_checklist 
  FOR UPDATE 
  USING (obra_id IN (SELECT id FROM public.obras WHERE usuario_id = auth.uid()));

CREATE POLICY "Users can delete checklist activities for their obras" 
  ON public.atividades_checklist 
  FOR DELETE 
  USING (obra_id IN (SELECT id FROM public.obras WHERE usuario_id = auth.uid()));
