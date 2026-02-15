
-- Fix the ALL policy on access_group_sectors - replace with specific policies
DROP POLICY "Admins can manage group sectors" ON public.access_group_sectors;

CREATE POLICY "Admins can insert group sectors"
  ON public.access_group_sectors FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update group sectors"
  ON public.access_group_sectors FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete group sectors"
  ON public.access_group_sectors FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Fix ALL policy on user_group_access
DROP POLICY "Admins can manage user group access" ON public.user_group_access;

CREATE POLICY "Admins can insert user group access"
  ON public.user_group_access FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user group access"
  ON public.user_group_access FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user group access"
  ON public.user_group_access FOR DELETE
  USING (has_role(auth.uid(), 'admin'));
