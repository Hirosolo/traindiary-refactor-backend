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
    const goal = await NutritionRepository.upsertGoal({
      ...body,
      user_id: user.userId
    });

    return successResponse(goal, 'Nutrition goal updated', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
