
-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  contract_number TEXT,
  counterparty TEXT,
  category TEXT DEFAULT 'geral',
  file_url TEXT,
  file_name TEXT,
  start_date DATE NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 12,
  end_date DATE,
  alert_days_before INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'vigente',
  sector TEXT,
  notes TEXT,
  ai_analysis TEXT,
  ai_analyzed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to auto-calculate end_date
CREATE OR REPLACE FUNCTION public.calculate_contract_end_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.end_date := NEW.start_date + (NEW.duration_months || ' months')::interval;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_contract_end_date
  BEFORE INSERT OR UPDATE OF start_date, duration_months ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_contract_end_date();

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contracts"
  ON public.contracts FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert contracts"
  ON public.contracts FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update contracts"
  ON public.contracts FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete contracts"
  ON public.contracts FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false);

CREATE POLICY "Auth users upload contracts"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contracts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth users view contracts"
  ON storage.objects FOR SELECT USING (bucket_id = 'contracts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth users delete contracts"
  ON storage.objects FOR DELETE USING (bucket_id = 'contracts' AND auth.uid() IS NOT NULL);
