
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- RLS policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Add file_url column to quality_documents
ALTER TABLE public.quality_documents ADD COLUMN file_url TEXT;
