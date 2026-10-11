-- Re-create the trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
-- Insert the missing profile for the current Google user
INSERT INTO public.profiles (user_id, name, email)
VALUES (
  '49486174-9086-4bda-8fa5-fe59fdeaaacf',
  'hanin Idriss',
  'haninidriss11@gmail.com'
)
ON CONFLICT (user_id) DO NOTHING;
-- Also ensure user_roles entry exists
INSERT INTO public.user_roles (user_id, role)
VALUES ('49486174-9086-4bda-8fa5-fe59fdeaaacf', 'admin')
ON CONFLICT DO NOTHING;