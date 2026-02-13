
-- Fix overly permissive RLS policies
DROP POLICY "Authenticated users can manage fmea" ON public.fmea_analyses;
CREATE POLICY "Users can view fmea" ON public.fmea_analyses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert fmea" ON public.fmea_analyses FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own fmea" ON public.fmea_analyses FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own fmea" ON public.fmea_analyses FOR DELETE USING (auth.uid() = created_by);

DROP POLICY "Authenticated users can manage fmea_items" ON public.fmea_items;
CREATE POLICY "Users can view fmea_items" ON public.fmea_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert fmea_items" ON public.fmea_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update fmea_items" ON public.fmea_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete fmea_items" ON public.fmea_items FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated users can manage lgpd" ON public.lgpd_data_mappings;
CREATE POLICY "Users can view lgpd" ON public.lgpd_data_mappings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert lgpd" ON public.lgpd_data_mappings FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own lgpd" ON public.lgpd_data_mappings FOR UPDATE USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lgpd" ON public.lgpd_data_mappings FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
