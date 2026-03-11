-- Migration: add user_id to workout_plans
-- Run this in Supabase SQL editor before deploying the updated backend.

ALTER TABLE public.workout_plans
  ADD COLUMN IF NOT EXISTS user_id integer REFERENCES public.users(user_id);

-- Optional: create an index for faster per-user lookups
CREATE INDEX IF NOT EXISTS workout_plans_user_id_idx ON public.workout_plans (user_id);
