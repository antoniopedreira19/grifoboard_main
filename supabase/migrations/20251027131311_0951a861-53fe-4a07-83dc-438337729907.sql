-- Allow admins to access data from all obras in their company

-- Update tarefas policy
DROP POLICY IF EXISTS "Users can manage tarefas of their obras" ON public.tarefas;

CREATE POLICY "Users can manage tarefas of their obras or company obras if admin"
ON public.tarefas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.obras
    WHERE obras.id = tarefas.obra_id
    AND (
      obras.created_by = auth.uid()
      OR (obras.empresa_id = current_empresa_id() AND is_company_admin())
    )
  )
);

-- Update atividades_checklist policy
DROP POLICY IF EXISTS "Users can manage checklist activities for their obras" ON public.atividades_checklist;

CREATE POLICY "Users can manage checklist activities for their obras or company obras if admin"
ON public.atividades_checklist
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.obras
    WHERE obras.id = atividades_checklist.obra_id
    AND (
      obras.created_by = auth.uid()
      OR (obras.empresa_id = current_empresa_id() AND is_company_admin())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.obras
    WHERE obras.id = atividades_checklist.obra_id
    AND (
      obras.created_by = auth.uid()
      OR (obras.empresa_id = current_empresa_id() AND is_company_admin())
    )
  )
);

-- Update materiais_tarefa policy
DROP POLICY IF EXISTS "Users can manage materials for their obra tasks" ON public.materiais_tarefa;

CREATE POLICY "Users can manage materials for their obra tasks or company obras if admin"
ON public.materiais_tarefa
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.tarefas t
    JOIN public.obras o ON t.obra_id = o.id
    WHERE t.id = materiais_tarefa.tarefa_id
    AND (
      o.created_by = auth.uid()
      OR (o.empresa_id = current_empresa_id() AND is_company_admin())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tarefas t
    JOIN public.obras o ON t.obra_id = o.id
    WHERE t.id = materiais_tarefa.tarefa_id
    AND (
      o.created_by = auth.uid()
      OR (o.empresa_id = current_empresa_id() AND is_company_admin())
    )
  )
);

-- Update registros policy
DROP POLICY IF EXISTS "Users can manage their registros" ON public.registros;

CREATE POLICY "Users can manage registros for their obras or company obras if admin"
ON public.registros
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.obras
    WHERE obras.id = registros.obra_id
    AND (
      obras.created_by = auth.uid()
      OR (obras.empresa_id = current_empresa_id() AND is_company_admin())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.obras
    WHERE obras.id = registros.obra_id
    AND (
      obras.created_by = auth.uid()
      OR (obras.empresa_id = current_empresa_id() AND is_company_admin())
    )
  )
);