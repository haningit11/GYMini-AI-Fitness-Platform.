-- Allow super_admin and admin roles to update any gym (for verification and admin assignment)
CREATE POLICY "Super admins can update gyms"
ON public.gyms
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
-- Allow admins to insert gyms
CREATE POLICY "Admins can insert gyms"
ON public.gyms
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));