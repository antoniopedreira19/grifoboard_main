-- Update the function to get last_sign_in_at from auth.users instead of usuarios.last_login
CREATE OR REPLACE FUNCTION public.get_empresas_stats()
RETURNS TABLE (
  id uuid,
  nome text,
  created_at timestamp with time zone,
  total_obras bigint,
  ultimo_login timestamp with time zone,
  total_usuarios bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id,
    e.nome,
    e.created_at,
    COUNT(DISTINCT o.id) as total_obras,
    MAX(au.last_sign_in_at) as ultimo_login,
    COUNT(DISTINCT u.id) as total_usuarios
  FROM public.empresas e
  LEFT JOIN public.usuarios u ON u.empresa_id = e.id
  LEFT JOIN auth.users au ON au.id = u.id
  LEFT JOIN public.obras o ON o.empresa_id = e.id
  WHERE EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND role = 'master_admin'
  )
  GROUP BY e.id, e.nome, e.created_at
  ORDER BY e.created_at DESC;
$$;