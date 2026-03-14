/**
 * @swagger
 * /api/nutrition/goals:
 *   get:
 *     summary: Get user nutrition goals
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nutrition goals
 *   post:
 *     summary: Set user nutrition goals
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Goals updated
 */
import { NextRequest } from 'next/server';
import { NutritionRepository } from '@/repositories/nutrition.repository';
import { MetricRepository } from '@/repositories/metric.repository';
import { successResponse, errorResponse } from '@/lib/response';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const goal = await NutritionRepository.getActiveGoal(user.userId, date);
    
    return successResponse(goal);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { 
      age, sex, height_cm, weight_kg, activity_level, 
      body_fat_percentage, is_body_fat_estimated,
      goal_type, goal_speed, bmr, tdee,
      calories_target, protein_target_g, carbs_target_g, fat_target_g,
      start_date
    } = body;

    // 1. Save Metrics
    if (age && sex && height_cm && weight_kg && activity_level) {
      await MetricRepository.addMetric({
        user_id: user.userId,
        age,
        sex,
        height_cm,
        weight_kg,
        activity_level,
        body_fat_percentage,
        is_body_fat_estimated
      });
    }

    // 2. Save Goal
    const goal = await NutritionRepository.upsertGoal({
      user_id: user.userId,
      calories_target,
      protein_target_g,
      carbs_target_g,
      fat_target_g,
      fiber_target_g: body.fiber_target_g || Math.round(calories_target / 1000 * 14), // Default fiber logic if not provided
      start_date: start_date || new Date().toISOString().split('T')[0],
      goal_type,
      goal_speed,
      bmr,
      tdee,
      target_weight_kg: body.target_weight_kg,
      workout_days_per_week: body.workout_days_per_week
    });

    return successResponse(goal, 'Nutrition goal and metrics updated', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
