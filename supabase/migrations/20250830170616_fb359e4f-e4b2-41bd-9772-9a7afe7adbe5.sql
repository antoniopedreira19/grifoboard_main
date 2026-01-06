-- Create table for task materials
CREATE TABLE public.materiais_tarefa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarefa_id UUID NOT NULL,
  descricao TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.materiais_tarefa ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view materials for their obra tasks" 
ON public.materiais_tarefa 
FOR SELECT 
USING (
  tarefa_id IN (
    SELECT t.id 
    FROM tarefas t 
    JOIN obras o ON t.obra_id = o.id 
    WHERE o.usuario_id = auth.uid()
  )
);

CREATE POLICY "Users can create materials for their obra tasks" 
ON public.materiais_tarefa 
FOR INSERT 
WITH CHECK (
  tarefa_id IN (
    SELECT t.id 
    FROM tarefas t 
    JOIN obras o ON t.obra_id = o.id 
    WHERE o.usuario_id = auth.uid()
  )
);

CREATE POLICY "Users can update materials for their obra tasks" 
ON public.materiais_tarefa 
FOR UPDATE 
USING (
  tarefa_id IN (
    SELECT t.id 
    FROM tarefas t 
    JOIN obras o ON t.obra_id = o.id 
    WHERE o.usuario_id = auth.uid()
  )
);

CREATE POLICY "Users can delete materials for their obra tasks" 
ON public.materiais_tarefa 
FOR DELETE 
USING (
  tarefa_id IN (
    SELECT t.id 
    FROM tarefas t 
    JOIN obras o ON t.obra_id = o.id 
    WHERE o.usuario_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_materiais_tarefa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_materiais_tarefa_updated_at
  BEFORE UPDATE ON public.materiais_tarefa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_materiais_tarefa_updated_at();