import { z } from 'zod';

export const foodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  calories_per_serving: z.number().min(0),
  protein_per_serving: z.number().min(0),
  carbs_per_serving: z.number().min(0),
  fat_per_serving: z.number().min(0),
  serving_type: z.string().min(1, 'Serving type is required'),
  image: z.string().optional().nullable(),
  fibers_per_serving: z.number().min(0).optional().nullable(),
  sugars_per_serving: z.number().min(0).optional().nullable(),
  zincs_per_serving: z.number().min(0).optional().nullable(),
  magnesiums_per_serving: z.number().min(0).optional().nullable(),
  calciums_per_serving: z.number().min(0).optional().nullable(),
  irons_per_serving: z.number().min(0).optional().nullable(),
  vitamin_a_per_serving: z.number().min(0).optional().nullable(),
  vitamin_c_per_serving: z.number().min(0).optional().nullable(),
  vitamin_b12_per_serving: z.number().min(0).optional().nullable(),
  vitamin_d_per_serving: z.number().min(0).optional().nullable(),
});

export type FoodInput = z.infer<typeof foodSchema>;

export const exerciseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().optional().nullable(),
  default_sets: z.number().int().min(0).optional().nullable(),
  default_reps: z.number().int().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  difficulty_factor: z.number().optional().nullable(),
  type: z.enum(['strength', 'cardio', 'flexibility', 'balance']).optional().default('strength'),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;
