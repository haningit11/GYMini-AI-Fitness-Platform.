
CREATE TABLE public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view all logs"
  ON public.system_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- Any authenticated user can insert logs (for login tracking etc.)
CREATE POLICY "Authenticated users can insert logs"
  ON public.system_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also allow anon insert for failed login attempts
CREATE POLICY "Anon can insert logs"
  ON public.system_logs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX idx_system_logs_created_at ON public.system_logs (created_at DESC);
CREATE INDEX idx_system_logs_action ON public.system_logs (action);
