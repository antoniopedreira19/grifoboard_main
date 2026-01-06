-- Create app schema for stable helpers
CREATE SCHEMA IF NOT EXISTS app;

-- Create stable helper functions for RLS optimization
CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION app.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.role();
$$;

CREATE OR REPLACE FUNCTION app.current_claim(claim_name text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.jwt() ->> claim_name;
$$;

-- Drop and recreate all RLS policies with optimized helpers

-- usuarios table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.usuarios;
CREATE POLICY "Users can view own profile" 
ON public.usuarios 
FOR ALL 
TO authenticated
USING (app.current_user_id() = id);

-- obras table policies  
DROP POLICY IF EXISTS "Users can view own obras" ON public.obras;
CREATE POLICY "Users can view own obras"
ON public.obras
FOR ALL 
TO authenticated
USING (app.current_user_id() = usuario_id);

-- tarefas table policies
DROP POLICY IF EXISTS "Users can manage tarefas of their obras" ON public.tarefas;
CREATE POLICY "Users can manage tarefas of their obras"
ON public.tarefas
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.obras 
    WHERE id = tarefas.obra_id 
    AND usuario_id = app.current_user_id()
  )
);

-- atividades_checklist table policies
DROP POLICY IF EXISTS "Users can view checklist activities for their obras" ON public.atividades_checklist;
DROP POLICY IF EXISTS "Users can create checklist activities for their obras" ON public.atividades_checklist;
DROP POLICY IF EXISTS "Users can update checklist activities for their obras" ON public.atividades_checklist;
DROP POLICY IF EXISTS "Users can delete checklist activities for their obras" ON public.atividades_checklist;

CREATE POLICY "Users can manage checklist activities for their obras"
ON public.atividades_checklist
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.obras 
    WHERE id = atividades_checklist.obra_id 
    AND usuario_id = app.current_user_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.obras 
    WHERE id = atividades_checklist.obra_id 
    AND usuario_id = app.current_user_id()
  )
);

-- materiais_tarefa table policies
DROP POLICY IF EXISTS "Users can view materials for their obra tasks" ON public.materiais_tarefa;
DROP POLICY IF EXISTS "Users can create materials for their obra tasks" ON public.materiais_tarefa;
DROP POLICY IF EXISTS "Users can update materials for their obra tasks" ON public.materiais_tarefa;
DROP POLICY IF EXISTS "Users can delete materials for their obra tasks" ON public.materiais_tarefa;

CREATE POLICY "Users can manage materials for their obra tasks"
ON public.materiais_tarefa
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tarefas t
    JOIN public.obras o ON t.obra_id = o.id
    WHERE t.id = materiais_tarefa.tarefa_id 
    AND o.usuario_id = app.current_user_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tarefas t
    JOIN public.obras o ON t.obra_id = o.id
    WHERE t.id = materiais_tarefa.tarefa_id 
    AND o.usuario_id = app.current_user_id()
  )
);

-- registros table policies
DROP POLICY IF EXISTS "Users can view their registros" ON public.registros;
DROP POLICY IF EXISTS "Users can insert registros" ON public.registros;
DROP POLICY IF EXISTS "Users can update their registros" ON public.registros;
DROP POLICY IF EXISTS "Users can delete their registros" ON public.registros;

CREATE POLICY "Users can manage their registros"
ON public.registros
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.obras 
    WHERE id = registros.obra_id 
    AND usuario_id = app.current_user_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.obras 
    WHERE id = registros.obra_id 
    AND usuario_id = app.current_user_id()
  )
);

-- Add indexes for RLS filter optimization
CREATE INDEX IF NOT EXISTS idx_obras_usuario_id ON public.obras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_obra_id ON public.tarefas(obra_id);
CREATE INDEX IF NOT EXISTS idx_atividades_checklist_obra_id ON public.atividades_checklist(obra_id);
CREATE INDEX IF NOT EXISTS idx_materiais_tarefa_tarefa_id ON public.materiais_tarefa(tarefa_id);
CREATE INDEX IF NOT EXISTS idx_registros_obra_id ON public.registros(obra_id);