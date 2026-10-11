-- Delete all data for non-admin users across all tables
DELETE FROM public.workouts WHERE user_id != '49486174-9086-4bda-8fa5-fe59fdeaaacf';
DELETE FROM public.workout_templates WHERE user_id != '49486174-9086-4bda-8fa5-fe59fdeaaacf';
DELETE FROM public.chat_messages WHERE user_id != '49486174-9086-4bda-8fa5-fe59fdeaaacf';
DELETE FROM public.direct_messages WHERE sender_id != '49486174-9086-4bda-8fa5-fe59fdeaaacf' AND receiver_id != '49486174-9086-4bda-8fa5-fe59fdeaaacf';
DELETE FROM public.duels WHERE challenger_id != '49486174-9086-4bda-8fa5-fe59fdeaaacf' AND opponent_id != '49486174-9086-4bda-8fa5-fe59fdeaaacf';
DELETE FROM public.user_roles WHERE user_id != '49486174-9086-4bda-8fa5-fe59fdeaaacf';
DELETE FROM public.profiles WHERE user_id != '49486174-9086-4bda-8fa5-fe59fdeaaacf';
-- Remove non-admin users from auth.users
DELETE FROM auth.users WHERE id != '49486174-9086-4bda-8fa5-fe59fdeaaacf';