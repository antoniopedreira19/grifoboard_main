-- Create storage buckets for form uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('formularios-empresas', 'formularios-empresas', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('formularios-profissionais', 'formularios-profissionais', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Update existing bucket to have proper limits
UPDATE storage.buckets 
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
WHERE id = 'formularios-fornecedores';

-- Policies for formularios-empresas bucket
CREATE POLICY "Allow public upload to empresas bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'formularios-empresas');

CREATE POLICY "Allow master_admin to view empresas files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'formularios-empresas' 
  AND EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND role = 'master_admin'
  )
);

-- Policies for formularios-fornecedores bucket
CREATE POLICY "Allow public upload to fornecedores bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'formularios-fornecedores');

CREATE POLICY "Allow master_admin to view fornecedores files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'formularios-fornecedores' 
  AND EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND role = 'master_admin'
  )
);

-- Policies for formularios-profissionais bucket
CREATE POLICY "Allow public upload to profissionais bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'formularios-profissionais');

CREATE POLICY "Allow master_admin to view profissionais files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'formularios-profissionais' 
  AND EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND role = 'master_admin'
  )
);