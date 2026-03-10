-- Adds user ownership to workout plans so API filters by authenticated user can work.
-- Run this against your Supabase/Postgres database before deploying backend changes.

ALTER TABLE public.workout_plans
ADD COLUMN IF NOT EXISTS user_id integer;

-- Backfill existing plans to a valid user before enforcing NOT NULL.
-- Update this statement if you have a specific ownership mapping.
WITH fallback_user AS (
  SELECT user_id
  FROM public.users
  ORDER BY user_id ASC
  LIMIT 1
)
UPDATE public.workout_plans wp
SET user_id = fu.user_id
FROM fallback_user fu
WHERE wp.user_id IS NULL;

ALTER TABLE public.workout_plans
ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workout_plans_user_id_fkey'
  ) THEN
    ALTER TABLE public.workout_plans
    ADD CONSTRAINT workout_plans_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(user_id)
    ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id
ON public.workout_plans(user_id);
