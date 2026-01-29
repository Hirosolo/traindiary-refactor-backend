/**
 * @swagger
 * /api/meals/{id}:
 *   get:
 *     summary: Get meal details
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Meal details
 *   delete:
 *     summary: Delete meal
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Meal deleted
 */
import { NextRequest } from 'next/server';
import { MealRepository } from '@/repositories/log.repository';
import { successResponse, errorResponse } from '@/lib/response';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const mealId = parseInt(params.id);
    if (isNaN(mealId)) {
      return errorResponse('Invalid meal ID', 400);
    }

    // Fetch the specific meal with all details
    const { data, error } = await (await import('@/lib/supabase')).supabase
      .from('user_meals')
      .select(`
        *,
        details:user_meal_details(
          *,
          food:foods(*)
        )
      `)
      .eq('meal_id', mealId)
      .eq('user_id', user.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Meal not found', 404);
      }
      throw new Error(error.message);
    }

    return successResponse(data);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const mealId = parseInt(params.id);
    if (isNaN(mealId)) {
      return errorResponse('Invalid meal ID', 400);
    }

    await MealRepository.delete(mealId, user.userId);
    return successResponse({ message: 'Meal deleted' });
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
