/**
 * @swagger
 * /api/meals:
 *   get:
 *     summary: Get user meals
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of meals
 *   post:
 *     summary: Log a meal
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [meal_type, log_date, details]
 *             properties:
 *               meal_type:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *               log_date:
 *                 type: string
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     food_id:
 *                       type: integer
 *                     numbers_of_serving:
 *                       type: number
 *     responses:
 *       201:
 *         description: Meal logged
 */
import { NextRequest } from 'next/server';
import { MealRepository } from '@/repositories/log.repository';
import { requestMealSchema } from '@/validation/log.schema';
import { successResponse, errorResponse } from '@/lib/response';
import { fromZodError } from 'zod-validation-error';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const searchParams = req.nextUrl.searchParams;
    const month = searchParams.get('month') || undefined;
    const date = searchParams.get('date') || undefined;

    const meals = await MealRepository.findByUserId(user.userId, { month, date });
    return successResponse(meals);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const validation = requestMealSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(fromZodError(validation.error).message);
    }

    const meal = await MealRepository.create(user.userId, validation.data);
    return successResponse(meal, 'Meal logged successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
