
-- Tabela de pastas com estrutura recursiva (árvore)
CREATE TABLE public.document_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.document_folders(id) ON DELETE CASCADE,
  sector TEXT,
  icon TEXT DEFAULT 'folder',
  display_order INT DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_folders_parent ON public.document_folders(parent_id);
CREATE INDEX idx_document_folders_sector ON public.document_folders(sector);

CREATE TRIGGER update_document_folders_updated_at
  BEFORE UPDATE ON public.document_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view folders"
  ON public.document_folders FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can create folders"
  ON public.document_folders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update folders"
  ON public.document_folders FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete folders"
  ON public.document_folders FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.quality_documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.document_folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_quality_documents_folder ON public.quality_documents(folder_id);
