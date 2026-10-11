-- 1. Alter gyms table: add new columns
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS description text;
-- Copy existing city data to location_city, then drop city
UPDATE public.gyms SET location_city = city WHERE location_city IS NULL;
ALTER TABLE public.gyms DROP COLUMN IF EXISTS city;
-- 2. Add gym_id to profiles referencing gyms
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gym_id uuid REFERENCES public.gyms(id);
-- 3. Add 'gym_admin' and 'super_admin' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gym_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';