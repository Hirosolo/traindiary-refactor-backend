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
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizePlan(data as unknown as WorkoutPlanRow, userId);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const planId = Number(id);
    if (!Number.isFinite(planId) || planId <= 0) {
      return errorResponse("Invalid plan ID", 400);
    }

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

    const { error: planUpdateError } = await supabase
      .from("workout_plans")
      .update({
        name: payload.name,
        description: payload.notes,
      })
      .eq("plan_id", planId);

    if (planUpdateError) {
      return errorResponse(planUpdateError.message, 500);
    }

    const { data: existingDays, error: daysError } = await supabase
      .from("plan_days")
      .select("plan_day_id, day_number")
      .eq("plan_id", planId)
      .order("day_number", { ascending: true });

    if (daysError) {
      return errorResponse(daysError.message, 500);
    }

    let planDayId: number;
    if (!existingDays || existingDays.length === 0) {
      const { data: newDay, error: insertDayError } = await supabase
        .from("plan_days")
        .insert({
          plan_id: planId,
          day_number: 1,
          day_type: payload.type,
        })
        .select("plan_day_id")
        .single();

      if (insertDayError || !newDay) {
        return errorResponse(insertDayError?.message || "Failed to create plan day", 500);
      }
      planDayId = Number(newDay.plan_day_id);
    } else {
      planDayId = Number(existingDays[0].plan_day_id);
      const { error: dayUpdateError } = await supabase
        .from("plan_days")
        .update({ day_type: payload.type })
        .eq("plan_day_id", planDayId);

      if (dayUpdateError) {
        return errorResponse(dayUpdateError.message, 500);
      }
    }

    const { error: deleteExercisesError } = await supabase
      .from("plan_day_exercises")
      .delete()
      .eq("plan_day_id", planDayId);

    if (deleteExercisesError) {
      return errorResponse(deleteExercisesError.message, 500);
    }

    if (payload.exercises.length > 0) {
      const exerciseRows = payload.exercises.map((item) => ({
        plan_day_id: planDayId,
        exercise_id: item.exercise_id,
        sets: item.planned_sets,
        reps: item.planned_reps,
      }));

      const { error: exInsertError } = await supabase
        .from("plan_day_exercises")
        .insert(exerciseRows);

      if (exInsertError) {
        return errorResponse(exInsertError.message, 500);
      }
    }

    const updated = await fetchPlanById(planId, user.userId);
    return successResponse(updated, "Workout day plan updated");
  } catch (error: any) {
    return errorResponse(error?.message || "Internal Server Error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const planId = Number(id);
    if (!Number.isFinite(planId) || planId <= 0) {
      return errorResponse("Invalid plan ID", 400);
    }

    const { data: dayRows, error: daysError } = await supabase
      .from("plan_days")
      .select("plan_day_id")
      .eq("plan_id", planId);

    if (daysError) {
      return errorResponse(daysError.message, 500);
    }

    const planDayIds = (dayRows || []).map((row) => Number(row.plan_day_id));

    if (planDayIds.length > 0) {
      const { error: exDeleteError } = await supabase
        .from("plan_day_exercises")
        .delete()
        .in("plan_day_id", planDayIds);

      if (exDeleteError) {
        return errorResponse(exDeleteError.message, 500);
      }
    }

    const { error: dayDeleteError } = await supabase
      .from("plan_days")
      .delete()
      .eq("plan_id", planId);

    if (dayDeleteError) {
      return errorResponse(dayDeleteError.message, 500);
    }

    const { error: planDeleteError } = await supabase
      .from("workout_plans")
      .delete()
      .eq("plan_id", planId);

    if (planDeleteError) {
      return errorResponse(planDeleteError.message, 500);
    }

    return successResponse({ plan_id: planId }, "Workout day plan deleted");
  } catch (error: any) {
    return errorResponse(error?.message || "Internal Server Error", 500);
  }
}
