-- Fix RLS policies on public.obras to handle NULL empresa_id using IS NOT DISTINCT FROM
ALTER POLICY "obras: insert by user into own company"
ON public.obras
WITH CHECK ((created_by = auth.uid()) AND (empresa_id IS NOT DISTINCT FROM current_empresa_id()));

ALTER POLICY "obras: update by owner or company admin"
ON public.obras
WITH CHECK (empresa_id IS NOT DISTINCT FROM current_empresa_id());