-- Create user-owned workout day plans so users can reuse planned exercises
-- when creating workout sessions.

CREATE TABLE IF NOT EXISTS public.workout_day_plans (
  plan_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  type VARCHAR(80),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_day_plan_exercises (
  plan_exercise_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES public.workout_day_plans(plan_id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES public.exercises(exercise_id),
  planned_sets INTEGER NOT NULL DEFAULT 3 CHECK (planned_sets > 0),
  planned_reps INTEGER NOT NULL DEFAULT 10 CHECK (planned_reps >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_plan_exercise UNIQUE (plan_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_workout_day_plans_user_id ON public.workout_day_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_day_plan_exercises_plan_id ON public.workout_day_plan_exercises(plan_id);

-- Keep updated_at in sync without adding app-layer complexity.
CREATE OR REPLACE FUNCTION public.set_workout_day_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_workout_day_plans_updated_at ON public.workout_day_plans;
CREATE TRIGGER trg_workout_day_plans_updated_at
BEFORE UPDATE ON public.workout_day_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_workout_day_plans_updated_at();
