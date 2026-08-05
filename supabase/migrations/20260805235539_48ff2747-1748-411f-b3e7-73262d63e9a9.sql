
CREATE TABLE IF NOT EXISTS public.ona_compliance_evidence (
    id uuid primary key default gen_random_uuid(),
    requirement_id text not null,
    level integer not null,
    confirmed_at timestamptz default now(),
    responsible_id uuid references auth.users(id),
    responsible_name text,
    evidence_url text,
    evidence_name text,
    notes text,
    created_at timestamptz default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ona_compliance_evidence TO authenticated;
GRANT ALL ON public.ona_compliance_evidence TO service_role;

ALTER TABLE public.ona_compliance_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all evidence" 
ON public.ona_compliance_evidence FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert evidence" 
ON public.ona_compliance_evidence FOR INSERT 
TO authenticated 
WITH CHECK (true);
