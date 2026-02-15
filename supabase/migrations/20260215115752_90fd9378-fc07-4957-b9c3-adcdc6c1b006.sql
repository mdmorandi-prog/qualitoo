
-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  sector TEXT,
  responsible TEXT,
  status TEXT NOT NULL DEFAULT 'planejamento',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  progress INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_tasks table
CREATE TABLE public.project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  responsible TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  progress INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  depends_on UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
  is_milestone BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
CREATE POLICY "Authenticated users can view projects" ON public.projects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update projects" ON public.projects FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete projects" ON public.projects FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS policies for project_tasks
CREATE POLICY "Authenticated users can view project tasks" ON public.project_tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create project tasks" ON public.project_tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update project tasks" ON public.project_tasks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete project tasks" ON public.project_tasks FOR DELETE USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
