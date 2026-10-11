-- 1. Add streak column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak integer NOT NULL DEFAULT 0;
-- 2. Create duels table
CREATE TABLE IF NOT EXISTS public.duels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL,
  opponent_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  winner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Add validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_duel_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'active', 'finished') THEN
    RAISE EXCEPTION 'Invalid duel status: %', NEW.status;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_duel_status_trigger
  BEFORE INSERT OR UPDATE ON public.duels
  FOR EACH ROW EXECUTE FUNCTION public.validate_duel_status();
-- Enable RLS on duels
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;
-- RLS policies
CREATE POLICY "Users can view own duels"
  ON public.duels FOR SELECT
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
CREATE POLICY "Users can create duels"
  ON public.duels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Participants can update duels"
  ON public.duels FOR UPDATE
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
CREATE POLICY "Challenger can delete pending duels"
  ON public.duels FOR DELETE
  TO authenticated
  USING (auth.uid() = challenger_id AND status = 'pending');