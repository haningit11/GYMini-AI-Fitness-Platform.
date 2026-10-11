
CREATE TABLE public.site_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  rating integer NOT NULL,
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_site_review_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_site_review_rating
  BEFORE INSERT OR UPDATE ON public.site_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_site_review_rating();

ALTER TABLE public.site_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (guests on landing page)
CREATE POLICY "Anyone can view site reviews"
  ON public.site_reviews FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can insert their own review
CREATE POLICY "Users can insert own reviews"
  ON public.site_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can delete any review
CREATE POLICY "Admins can delete reviews"
  ON public.site_reviews FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can delete their own review
CREATE POLICY "Users can delete own reviews"
  ON public.site_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
