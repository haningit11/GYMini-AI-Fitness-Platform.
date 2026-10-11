
-- Update the system_logs SELECT policy to only check for 'admin' role (remove super_admin)
DROP POLICY IF EXISTS "Admins can view all logs" ON public.system_logs;
CREATE POLICY "Admins can view all logs"
  ON public.system_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Also update gyms UPDATE policy that references super_admin
DROP POLICY IF EXISTS "Super admins can update gyms" ON public.system_logs;
