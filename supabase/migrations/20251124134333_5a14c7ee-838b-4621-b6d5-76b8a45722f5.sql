-- Create table for Farol de Contratação de Fornecimentos
CREATE TABLE public.playbook_fornecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL,
  proposta TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  quantidade NUMERIC NOT NULL,
  unidade TEXT NOT NULL,
  orcamento_meta_unitario NUMERIC NOT NULL,
  valor_contratado NUMERIC,
  status TEXT NOT NULL CHECK (status IN ('Negociadas', 'Em Andamento', 'A Negociar')),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for Farol de Contratação de Obra
CREATE TABLE public.playbook_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL,
  proposta TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  quantidade NUMERIC NOT NULL,
  unidade TEXT NOT NULL,
  orcamento_meta_unitario NUMERIC NOT NULL,
  valor_contratado NUMERIC,
  status TEXT NOT NULL CHECK (status IN ('Negociadas', 'Em Andamento', 'A Negociar')),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.playbook_fornecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_obra ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playbook_fornecimentos
CREATE POLICY "Users can manage playbook_fornecimentos for their obras or company obras"
ON public.playbook_fornecimentos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.obras
    WHERE obras.id = playbook_fornecimentos.obra_id
    AND (obras.created_by = auth.uid() OR (obras.empresa_id = current_empresa_id() AND is_company_admin()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.obras
    WHERE obras.id = playbook_fornecimentos.obra_id
    AND (obras.created_by = auth.uid() OR (obras.empresa_id = current_empresa_id() AND is_company_admin()))
  )
);

-- RLS Policies for playbook_obra
CREATE POLICY "Users can manage playbook_obra for their obras or company obras"
ON public.playbook_obra
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.obras
    WHERE obras.id = playbook_obra.obra_id
    AND (obras.created_by = auth.uid() OR (obras.empresa_id = current_empresa_id() AND is_company_admin()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.obras
    WHERE obras.id = playbook_obra.obra_id
    AND (obras.created_by = auth.uid() OR (obras.empresa_id = current_empresa_id() AND is_company_admin()))
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_playbook_fornecimentos_updated_at
  BEFORE UPDATE ON public.playbook_fornecimentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tarefas_updated_at();

CREATE TRIGGER update_playbook_obra_updated_at
  BEFORE UPDATE ON public.playbook_obra
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tarefas_updated_at();