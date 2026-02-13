
-- User dashboard configurations
CREATE TABLE public.user_dashboard_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  config_name TEXT NOT NULL DEFAULT 'Padrão',
  layouts JSONB NOT NULL DEFAULT '[]'::jsonb,
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, config_name)
);

ALTER TABLE public.user_dashboard_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dashboard configs" ON public.user_dashboard_configs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own dashboard configs" ON public.user_dashboard_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dashboard configs" ON public.user_dashboard_configs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dashboard configs" ON public.user_dashboard_configs
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_dashboard_configs_updated_at
  BEFORE UPDATE ON public.user_dashboard_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
