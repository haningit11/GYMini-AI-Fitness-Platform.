
-- Clean orphaned user_roles
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT user_id FROM public.profiles);
-- Re-create profiles for existing auth users that are missing them
INSERT INTO public.profiles (user_id, name, email)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'name', ''), COALESCE(u.email, '')
FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT DO NOTHING;
-- Re-create user_roles for users missing them
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'user'
FROM public.profiles p
WHERE p.user_id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT DO NOTHING;
-- Ensure trigger exists
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();