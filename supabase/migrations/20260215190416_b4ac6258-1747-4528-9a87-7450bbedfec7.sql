
-- Permission level enum
CREATE TYPE public.permission_level AS ENUM ('read', 'write', 'admin');

-- Access groups table
CREATE TABLE public.access_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sectors belonging to each group
CREATE TABLE public.access_group_sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.access_groups(id) ON DELETE CASCADE,
  sector TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, sector)
);

-- User membership in groups with permission level
CREATE TABLE public.user_group_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.access_groups(id) ON DELETE CASCADE,
  permission_level permission_level NOT NULL DEFAULT 'read',
  granted_by UUID NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Enable RLS
ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_group_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_access ENABLE ROW LEVEL SECURITY;

-- RLS for access_groups
CREATE POLICY "Authenticated users can view active groups"
  ON public.access_groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert groups"
  ON public.access_groups FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update groups"
  ON public.access_groups FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete groups"
  ON public.access_groups FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS for access_group_sectors
CREATE POLICY "Authenticated users can view group sectors"
  ON public.access_group_sectors FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage group sectors"
  ON public.access_group_sectors FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS for user_group_access
CREATE POLICY "Users can view own group access"
  ON public.user_group_access FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user group access"
  ON public.user_group_access FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Security definer function to check sector access
CREATE OR REPLACE FUNCTION public.has_sector_access(_user_id UUID, _sector TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Admins have access to everything
    has_role(_user_id, 'admin')
    OR
    -- User has group membership that includes this sector
    EXISTS (
      SELECT 1
      FROM user_group_access uga
      JOIN access_group_sectors ags ON ags.group_id = uga.group_id
      JOIN access_groups ag ON ag.id = uga.group_id
      WHERE uga.user_id = _user_id
        AND ags.sector = _sector
        AND ag.is_active = true
        AND (uga.expires_at IS NULL OR uga.expires_at > now())
    )
$$;

-- Function to check sector access with specific permission level
CREATE OR REPLACE FUNCTION public.has_sector_permission(_user_id UUID, _sector TEXT, _level permission_level)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    has_role(_user_id, 'admin')
    OR
    EXISTS (
      SELECT 1
      FROM user_group_access uga
      JOIN access_group_sectors ags ON ags.group_id = uga.group_id
      JOIN access_groups ag ON ag.id = uga.group_id
      WHERE uga.user_id = _user_id
        AND ags.sector = _sector
        AND ag.is_active = true
        AND (uga.expires_at IS NULL OR uga.expires_at > now())
        AND (
          uga.permission_level = _level
          OR uga.permission_level = 'admin'
          OR (uga.permission_level = 'write' AND _level = 'read')
        )
    )
$$;

-- Function to get all sectors a user can access
CREATE OR REPLACE FUNCTION public.get_user_sectors(_user_id UUID)
RETURNS TABLE(sector TEXT, permission_level permission_level, group_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ags.sector, uga.permission_level, ag.name as group_name
  FROM user_group_access uga
  JOIN access_group_sectors ags ON ags.group_id = uga.group_id
  JOIN access_groups ag ON ag.id = uga.group_id
  WHERE uga.user_id = _user_id
    AND ag.is_active = true
    AND (uga.expires_at IS NULL OR uga.expires_at > now())
$$;

-- Trigger for updated_at
CREATE TRIGGER update_access_groups_updated_at
  BEFORE UPDATE ON public.access_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_group_access_updated_at
  BEFORE UPDATE ON public.user_group_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
