
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  workout_data jsonb NOT NULL,
  current_day_index int DEFAULT 0,
  completed_exercises jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own active sessions" ON public.active_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own active sessions" ON public.active_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own active sessions" ON public.active_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own active sessions" ON public.active_sessions
  FOR DELETE USING (auth.uid() = user_id);
