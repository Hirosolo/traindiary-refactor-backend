import { z } from 'zod';

export const mealDetailSchema = z.object({
  food_id: z.number().int(),
  numbers_of_serving: z.number().min(0).default(1),
});

export const requestMealSchema = z.object({
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout']),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  details: z.array(mealDetailSchema).min(1, 'At least one food detail is required'),
});

export type RequestMealInput = z.infer<typeof requestMealSchema>;

export const exerciseLogSchema = z.object({
  exercise_id: z.number().int(),
  actual_sets: z.number().int().min(1),
  actual_reps: z.number().int().min(0).optional(),
  weight_kg: z.number().optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
  duration_seconds: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const requestWorkoutSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  userID: z.string().optional(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  type: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'UNFINISHED', 'MISSED']).default('PENDING'),
  exercises: z.array(exerciseLogSchema).optional(),
});

export type RequestWorkoutInput = z.infer<typeof requestWorkoutSchema>;
