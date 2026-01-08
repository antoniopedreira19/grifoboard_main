-- Adicionar campos de resumo e anexo na tabela agenda_events
ALTER TABLE public.agenda_events 
ADD COLUMN IF NOT EXISTS resumo TEXT,
ADD COLUMN IF NOT EXISTS anexo_url TEXT;

-- Criar bucket para anexos da agenda
INSERT INTO storage.buckets (id, name, public) 
VALUES ('agenda-anexos', 'agenda-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura pública
CREATE POLICY "Anexos da agenda são públicos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'agenda-anexos');

-- Política de upload para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de anexos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'agenda-anexos' AND auth.role() = 'authenticated');

-- Política de update para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar anexos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'agenda-anexos' AND auth.role() = 'authenticated');

-- Política de delete para usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar anexos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'agenda-anexos' AND auth.role() = 'authenticated');