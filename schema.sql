-- ============================================================
-- FULL SQL SCHEMA EXPORT — FlexTrack
-- Generated: 2026-03-30 --old schema look at migrations for new schema
-- Roles: admin, user, gym_admin (no super_admin)
-- ============================================================

-- ========================
-- 1. CUSTOM TYPES / ENUMS
-- ========================
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'gym_admin');

-- ========================
-- 2. TABLES
-- ========================

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text,
  gender text,
  date_of_birth date,
  height numeric,
  weight numeric,
  target_weight numeric,
  body_fat_percentage numeric,
  level text,
  goal text,
  primary_muscle text,
  gym_id uuid,
  gym_name text,
  rank text NOT NULL DEFAULT 'Rookie',
  xp integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  last_activity_date date DEFAULT CURRENT_DATE,
  daily_quiz_done boolean DEFAULT false,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- GYMS
CREATE TABLE public.gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  access_password text NOT NULL,
  admin_id uuid,
  description text,
  location_city text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add FK from profiles to gyms
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_gym_id_fkey FOREIGN KEY (gym_id) REFERENCES public.gyms(id);

-- WORKOUTS
CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  duration integer NOT NULL DEFAULT 0,
  calories integer NOT NULL DEFAULT 0,
  workout_date date NOT NULL DEFAULT CURRENT_DATE,
  exercises jsonb DEFAULT '[]'::jsonb,
  ai_analysis text,
  raw_input_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- EXERCISE LOGS
CREATE TABLE public.exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workout_id uuid NOT NULL REFERENCES public.workouts(id),
  exercise_name text NOT NULL,
  muscle_group text,
  set_number integer NOT NULL,
  reps integer,
  weight_kg numeric,
  duration_seconds integer,
  logged_at timestamptz DEFAULT now()
);

-- WORKOUT TEMPLATES
CREATE TABLE public.workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  days jsonb NOT NULL DEFAULT '[]'::jsonb,
  level text,
  goal text,
  source text NOT NULL DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ACTIVE SESSIONS
CREATE TABLE public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid REFERENCES public.workout_templates(id),
  workout_data jsonb NOT NULL,
  current_day_index integer DEFAULT 0,
  completed_exercises jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- BODY MEASUREMENTS
CREATE TABLE public.body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  measured_at date NOT NULL DEFAULT CURRENT_DATE,
  weight numeric,
  height numeric,
  body_fat_percentage numeric,
  muscle_mass numeric,
  waist_cm numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, measured_at)
);

-- SITE REVIEWS
CREATE TABLE public.site_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id),
  rating integer NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- CHAT MESSAGES
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  room text NOT NULL,
  content text NOT NULL,
  user_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- DIRECT MESSAGES
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- FOLLOWERS
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SYSTEM LOGS
CREATE TABLE public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================
-- 3. FUNCTIONS
-- ========================

-- Handle new user (trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Increment XP
CREATE OR REPLACE FUNCTION public.increment_xp(user_id uuid, xp_to_add integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles
  SET xp = xp + xp_to_add
  WHERE profiles.user_id = $1;
END;
$$;

-- Sync vitals from body_measurements to profiles
CREATE OR REPLACE FUNCTION public.sync_user_vitals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET
    weight = NEW.weight,
    height = NEW.height,
    body_fat_percentage = NEW.body_fat_percentage
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Validate site review rating
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

-- Validate duel status
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

-- Weekly leaderboard
CREATE OR REPLACE FUNCTION public.weekly_leaderboard(week_start date DEFAULT (date_trunc('week', now()))::date)
RETURNS TABLE(user_id uuid, name text, rank text, streak integer, level text, weekly_xp bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.user_id,
    p.name,
    p.rank,
    p.streak,
    p.level,
    COALESCE(SUM(w.calories), 0)::bigint AS weekly_xp
  FROM profiles p
  LEFT JOIN workouts w
    ON w.user_id = p.user_id
    AND w.workout_date >= week_start
    AND w.workout_date < week_start + 7
  GROUP BY p.user_id, p.name, p.rank, p.streak, p.level
  ORDER BY weekly_xp DESC
  LIMIT 10;
$$;

-- ========================
-- 4. TRIGGERS
-- ========================

-- Bootstrap profile + role on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync vitals when body_measurements inserted/updated
CREATE TRIGGER sync_vitals_on_measurement
  AFTER INSERT OR UPDATE ON public.body_measurements
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_vitals();

-- Auto-update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on active_sessions
CREATE TRIGGER update_active_sessions_updated_at
  BEFORE UPDATE ON public.active_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validate review rating
CREATE TRIGGER validate_review_rating
  BEFORE INSERT OR UPDATE ON public.site_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_site_review_rating();

-- ========================
-- 5. ROW LEVEL SECURITY
-- ========================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT TO public USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO public USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE TO public USING (has_role(auth.uid(), 'admin'));

-- USER ROLES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO public USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR INSERT TO public WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO public USING (has_role(auth.uid(), 'admin'));

-- GYMS
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see verified gyms" ON public.gyms
  FOR SELECT TO authenticated USING (is_verified = true OR admin_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert gyms" ON public.gyms
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Super admins can update gyms" ON public.gyms
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update their own gym password" ON public.gyms
  FOR UPDATE TO authenticated USING (auth.uid() = admin_id);

CREATE POLICY "Admins can delete gyms" ON public.gyms
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- WORKOUTS
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts" ON public.workouts
  FOR SELECT TO public USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own workouts" ON public.workouts
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON public.workouts
  FOR UPDATE TO public USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own workouts" ON public.workouts
  FOR DELETE TO public USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- EXERCISE LOGS
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own exercise logs" ON public.exercise_logs
  FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- WORKOUT TEMPLATES
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates" ON public.workout_templates
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.workout_templates
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.workout_templates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.workout_templates
  FOR DELETE TO public USING (auth.uid() = user_id);

-- ACTIVE SESSIONS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own active sessions" ON public.active_sessions
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own active sessions" ON public.active_sessions
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own active sessions" ON public.active_sessions
  FOR UPDATE TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own active sessions" ON public.active_sessions
  FOR DELETE TO public USING (auth.uid() = user_id);

-- BODY MEASUREMENTS
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own measurements" ON public.body_measurements
  FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SITE REVIEWS
ALTER TABLE public.site_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site reviews" ON public.site_reviews
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can insert own reviews" ON public.site_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.site_reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete reviews" ON public.site_reviews
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read chat messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" ON public.chat_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Gym admins can delete chat messages" ON public.chat_messages
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'gym_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Gym admins can moderate own gym chat" ON public.chat_messages
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM gyms WHERE gyms.id::text = chat_messages.room AND gyms.admin_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- DIRECT MESSAGES
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own DMs" ON public.direct_messages
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send DMs" ON public.direct_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete own sent DMs" ON public.direct_messages
  FOR DELETE TO authenticated USING (auth.uid() = sender_id);

CREATE POLICY "Receivers can mark DMs as read" ON public.direct_messages
  FOR UPDATE TO public USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

-- FOLLOWERS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all follow relationships" ON public.followers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can follow others" ON public.followers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.followers
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- SYSTEM LOGS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert logs" ON public.system_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anon can insert logs" ON public.system_logs
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admins can view all logs" ON public.system_logs
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ========================
-- 6. REALTIME (optional)
-- ========================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
