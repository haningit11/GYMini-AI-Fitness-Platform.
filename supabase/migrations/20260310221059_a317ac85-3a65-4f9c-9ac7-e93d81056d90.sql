-- Allow any authenticated user to insert a gym (for onboarding "Other" option)
DROP POLICY IF EXISTS "Admins can insert gyms" ON public.gyms;
CREATE POLICY "Authenticated users can insert gyms"
ON public.gyms
FOR INSERT
TO authenticated
WITH CHECK (true);