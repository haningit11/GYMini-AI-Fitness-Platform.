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