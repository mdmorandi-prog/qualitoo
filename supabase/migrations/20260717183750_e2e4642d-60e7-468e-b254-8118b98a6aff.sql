
-- Table for sectors (setores) managed centrally
CREATE TABLE IF NOT EXISTS public.sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  grid_row INT,
  grid_col INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sectors TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sectors TO authenticated;
GRANT ALL ON public.sectors TO service_role;

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view sectors"
  ON public.sectors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert sectors"
  ON public.sectors FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sectors"
  ON public.sectors FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sectors"
  ON public.sectors FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sectors_updated_at
  BEFORE UPDATE ON public.sectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with default hospital sectors (idempotent)
INSERT INTO public.sectors (name, grid_row, grid_col, sort_order) VALUES
  ('UTI', 0, 0, 1),
  ('Centro Cirúrgico', 0, 1, 2),
  ('Emergência', 0, 2, 3),
  ('Farmácia', 0, 3, 4),
  ('Enfermagem', 1, 0, 5),
  ('Laboratório', 1, 1, 6),
  ('Radiologia', 1, 2, 7),
  ('Ambulatório', 1, 3, 8),
  ('CME', 2, 0, 9),
  ('Nutrição', 2, 1, 10),
  ('Manutenção', 2, 2, 11),
  ('TI', 2, 3, 12),
  ('RH', 3, 0, 13),
  ('Qualidade', 3, 1, 14),
  ('Administração', 3, 2, 15),
  ('CCIH', 3, 3, 16),
  ('Fisioterapia', NULL, NULL, 17),
  ('Psicologia', NULL, NULL, 18),
  ('Serviço Social', NULL, NULL, 19),
  ('Pronto Socorro', NULL, NULL, 20),
  ('Internação', NULL, NULL, 21),
  ('Financeiro', NULL, NULL, 22),
  ('Compras', NULL, NULL, 23),
  ('Jurídico', NULL, NULL, 24),
  ('SESMT', NULL, NULL, 25),
  ('Hotelaria', NULL, NULL, 26),
  ('Faturamento', NULL, NULL, 27),
  ('Diretoria', NULL, NULL, 28),
  ('SAME', NULL, NULL, 29),
  ('Ouvidoria', NULL, NULL, 30),
  ('Marketing', NULL, NULL, 31)
ON CONFLICT (name) DO NOTHING;
