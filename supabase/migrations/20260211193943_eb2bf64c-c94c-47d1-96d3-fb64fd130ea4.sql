
-- 1. Fix action_plans SELECT: restrict to authenticated users only
DROP POLICY IF EXISTS "Users can view action plans" ON public.action_plans;
CREATE POLICY "Authenticated users can view action plans"
ON public.action_plans FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. Fix profiles SELECT: ensure only own profile or admin can see
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix risks SELECT: restrict to authenticated users
DROP POLICY IF EXISTS "Users can view risks" ON public.risks;
CREATE POLICY "Authenticated users can view risks"
ON public.risks FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 4. Fix trainings SELECT: restrict to authenticated users
DROP POLICY IF EXISTS "Users can view trainings" ON public.trainings;
CREATE POLICY "Authenticated users can view trainings"
ON public.trainings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 5. Fix meeting_minutes SELECT: restrict to authenticated users
DROP POLICY IF EXISTS "Users can view meeting minutes" ON public.meeting_minutes;
CREATE POLICY "Authenticated users can view meeting minutes"
ON public.meeting_minutes FOR SELECT
USING (auth.uid() IS NOT NULL);
