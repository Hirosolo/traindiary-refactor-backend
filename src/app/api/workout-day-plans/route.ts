import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { supabase } from "@/lib/supabase";

type PlanExerciseInput = {
  exercise_id: number;
  planned_sets: number;
  planned_reps: number;
  sort_order?: number;
};

type PlanPayload = {
  name: string;
  type?: string | null;
  notes?: string | null;
  exercises: PlanExerciseInput[];
};

type PlanDayExerciseRow = {
  plan_day_exercise_id: number;
  exercise_id: number;
  sets: number | null;
  reps: number | null;
  exercises?: {
    exercise_id: number;
    name: string;
    category?: string | null;
    type?: string | null;
  } | null;
};

type PlanDayRow = {
  plan_day_id: number;
  day_number: number;
  day_type?: string | null;
  plan_day_exercises?: PlanDayExerciseRow[];
};

type WorkoutPlanRow = {
  plan_id: number;
  user_id?: number;
  name: string;
  description?: string | null;
  plan_days?: PlanDayRow[];
};

function normalizePlan(plan: WorkoutPlanRow, userId: number) {
  const days = Array.isArray(plan.plan_days) ? [...plan.plan_days] : [];
  days.sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0));
  const selectedDay = days[0];
  const dayExercises = Array.isArray(selectedDay?.plan_day_exercises)
    ? selectedDay.plan_day_exercises
    : [];

  return {
    plan_id: plan.plan_id,
    user_id: userId,
    name: plan.name,
    type: selectedDay?.day_type ?? null,
    notes: plan.description ?? null,
    exercises: dayExercises
      .map((item, index) => ({
        plan_exercise_id: item.plan_day_exercise_id,
        exercise_id: item.exercise_id,
        planned_sets: item.sets ?? 0,
        planned_reps: item.reps ?? 0,
        sort_order: index,
        exercise: item.exercises
          ? {
              exercise_id: item.exercises.exercise_id,
              name: item.exercises.name,
              category: item.exercises.category ?? undefined,
              type: item.exercises.type ?? undefined,
            }
          : undefined,
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}

function validatePayload(body: unknown): { value?: PlanPayload; message?: string } {
  if (!body || typeof body !== "object") {
    return { message: "Request body must be a JSON object" };
  }

  const payload = body as Partial<PlanPayload>;
  if (!payload.name || typeof payload.name !== "string") {
    return { message: "name is required" };
  }
  if (!Array.isArray(payload.exercises)) {
    return { message: "exercises must be an array" };
  }

  const exercises: PlanExerciseInput[] = [];
  for (let i = 0; i < payload.exercises.length; i += 1) {
    const item = payload.exercises[i] as Partial<PlanExerciseInput>;
    const exerciseId = Number(item?.exercise_id);
    const plannedSets = Number(item?.planned_sets);
    const plannedReps = Number(item?.planned_reps);

    if (!Number.isFinite(exerciseId) || exerciseId <= 0) {
      return { message: `exercises[${i}].exercise_id is invalid` };
    }
    if (!Number.isFinite(plannedSets) || plannedSets < 0) {
      return { message: `exercises[${i}].planned_sets is invalid` };
    }
    if (!Number.isFinite(plannedReps) || plannedReps < 0) {
      return { message: `exercises[${i}].planned_reps is invalid` };
    }

    exercises.push({
      exercise_id: exerciseId,
      planned_sets: plannedSets,
      planned_reps: plannedReps,
      sort_order: Number.isFinite(Number(item?.sort_order)) ? Number(item?.sort_order) : i,
    });
  }

  return {
    value: {
      name: payload.name.trim(),
      type: payload.type ?? null,
      notes: payload.notes ?? null,
      exercises: exercises.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    },
  };
}

async function fetchPlanById(planId: number, userId: number) {
  const { data, error } = await supabase
    .from("workout_plans")
    .select(
      `
      plan_id,
      name,
      description,
      plan_days(
        plan_day_id,
        day_number,
        day_type,
        plan_day_exercises(
          plan_day_exercise_id,
          exercise_id,
          sets,
          reps,
          exercises(
            exercise_id,
            name,
            category,
            type
          )
        )
      )
    `,
    )
    .eq("plan_id", planId)
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizePlan(data as unknown as WorkoutPlanRow, userId);
}

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { data, error } = await supabase
      .from("workout_plans")
      .select(
        `
        plan_id,
        name,
        description,
        plan_days(
          plan_day_id,
          day_number,
          day_type,
          plan_day_exercises(
            plan_day_exercise_id,
            exercise_id,
            sets,
            reps,
            exercises(
              exercise_id,
              name,
              category,
              type
            )
          )
        )
      `,
      )
      .eq("user_id", user.userId)
      .order("plan_id", { ascending: false });

    if (error) {
      return errorResponse(error.message, 500);
    }

    const plans = (data as unknown as WorkoutPlanRow[]).map((item) =>
      normalizePlan(item, user.userId),
    );

    return successResponse(plans);
  } catch (error: any) {
    return errorResponse(error?.message || "Internal Server Error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Valid JSON body is required", 400);
    }

    const parsed = validatePayload(body);
    if (!parsed.value) {
      return errorResponse(parsed.message || "Invalid payload", 400);
    }

    const payload = parsed.value;

    const { data: planData, error: planError } = await supabase
      .from("workout_plans")
      .insert({
        user_id: user.userId,
        name: payload.name,
        description: payload.notes,
      })
      .select("plan_id")
      .single();

    if (planError || !planData) {
      return errorResponse(planError?.message || "Failed to create plan", 500);
    }

    const planId = Number(planData.plan_id);

    const { data: dayData, error: dayError } = await supabase
      .from("plan_days")
      .insert({
        plan_id: planId,
        day_number: 1,
        day_type: payload.type,
      })
      .select("plan_day_id")
      .single();

    if (dayError || !dayData) {
      return errorResponse(dayError?.message || "Failed to create plan day", 500);
    }

    const planDayId = Number(dayData.plan_day_id);

    if (payload.exercises.length > 0) {
      const exerciseRows = payload.exercises.map((item) => ({
        plan_day_id: planDayId,
        exercise_id: item.exercise_id,
        sets: item.planned_sets,
        reps: item.planned_reps,
      }));

      const { error: exError } = await supabase
        .from("plan_day_exercises")
        .insert(exerciseRows);

      if (exError) {
        return errorResponse(exError.message, 500);
      }
    }

    const created = await fetchPlanById(planId, user.userId);
    return successResponse(created, "Workout day plan created", 201);
  } catch (error: any) {
    return errorResponse(error?.message || "Internal Server Error", 500);
  }
}
