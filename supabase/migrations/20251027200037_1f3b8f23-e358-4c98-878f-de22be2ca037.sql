-- Create table for diarios de obra
CREATE TABLE public.diarios_obra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  clima TEXT,
  mao_de_obra TEXT,
  equipamentos TEXT,
  atividades TEXT NOT NULL,
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_diarios_obra_obra_id ON public.diarios_obra(obra_id);
CREATE INDEX idx_diarios_obra_data ON public.diarios_obra(data);

-- Enable RLS
ALTER TABLE public.diarios_obra ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage diarios for their obras or company obras if admin
CREATE POLICY "Users can manage diarios for their obras or company obras if admin"
ON public.diarios_obra
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.obras
    WHERE obras.id = diarios_obra.obra_id
    AND (
      obras.created_by = auth.uid()
      OR (obras.empresa_id = current_empresa_id() AND is_company_admin())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.obras
    WHERE obras.id = diarios_obra.obra_id
    AND (
      obras.created_by = auth.uid()
      OR (obras.empresa_id = current_empresa_id() AND is_company_admin())
    )
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_diarios_obra_updated_at
BEFORE UPDATE ON public.diarios_obra
FOR EACH ROW
EXECUTE FUNCTION public.update_tarefas_updated_at();