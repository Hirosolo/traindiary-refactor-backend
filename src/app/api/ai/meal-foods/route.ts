import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticate, errorResponse, successResponse } from '../utils';

/**
 * @swagger
 * /api/ai/meal-foods:
 *   post:
 *     summary: Add food to meal
 *     description: Add a food item to a meal with serving quantity. Verifies meal ownership.
 *     tags: [AI - Nutrition Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [meal_id, food_id, numbers_of_serving]
 *             properties:
 *               meal_id:
 *                 type: integer
 *                 example: 300
 *               food_id:
 *                 type: integer
 *                 example: 55
 *               numbers_of_serving:
 *                 type: number
 *                 format: float
 *                 example: 1.5
 *     responses:
 *       201:
 *         description: Food added to meal successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     meal_detail_id:
 *                       type: integer
 *                       example: 901
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: meal_id, food_id, numbers_of_serving"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "UNAUTHORIZED"
 *                 message:
 *                   type: string
 *                   example: "Missing or invalid authorization token"
 *       403:
 *         description: Access denied - Meal does not belong to user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "ACCESS_DENIED"
 *                 message:
 *                   type: string
 *                   example: "Meal does not belong to user"
 */
async function handlePOST(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { meal_id, food_id, numbers_of_serving } = body;

    if (!meal_id || !food_id || numbers_of_serving === undefined) {
      return errorResponse(
        'VALIDATION_ERROR',                                                     
        'Missing required fields: meal_id, food_id, numbers_of_serving',
        400
      );
    }

    // Security Check: Verify meal ownership
    const { data: meal, error: mealError } = await supabase
      .from('user_meals')
      .select('user_id')
      .eq('meal_id', meal_id)
      .single();

    if (mealError || !meal || meal.user_id !== user!.userId) {
      return errorResponse('ACCESS_DENIED', 'Meal does not belong to user', 403);
    }

    // Insert meal food
    const { data, error: insertError } = await supabase
      .from('user_meal_details')
      .insert({
        meal_id,
        food_id,
        numbers_of_serving,
      })
      .select('meal_detail_id')
      .single();

    if (insertError || !data) {
      return errorResponse('DATABASE_ERROR', 'Failed to add food to meal', 400);
    }

    return successResponse(data, 201);
  } catch (error) {
    console.error('[POST /meal-foods] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}

/**
 * @swagger
 * /api/ai/meal-foods:
 *   put:
 *     summary: Update food servings
 *     description: Update the number of servings for a food item in a meal. Verifies ownership.
 *     tags: [AI - Nutrition Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [meal_detail_id, numbers_of_serving]
 *             properties:
 *               meal_detail_id:
 *                 type: integer
 *                 example: 901
 *               numbers_of_serving:
 *                 type: number
 *                 format: float
 *                 example: 2.0
 *     responses:
 *       200:
 *         description: Food servings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     meal_detail_id:
 *                       type: integer
 *                       example: 901
 *                     numbers_of_serving:
 *                       type: number
 *                       example: 2.0
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: meal_detail_id, numbers_of_serving"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "UNAUTHORIZED"
 *                 message:
 *                   type: string
 *                   example: "Missing or invalid authorization token"
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "ACCESS_DENIED"
 *                 message:
 *                   type: string
 *                   example: "Insufficient permissions"
 *       404:
 *         description: Meal detail not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "ENTITY_NOT_FOUND"
 *                 message:
 *                   type: string
 *                   example: "Meal detail not found"
 */
async function handlePUT(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { meal_detail_id, numbers_of_serving } = body;

    if (!meal_detail_id || numbers_of_serving === undefined) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Missing required fields: meal_detail_id, numbers_of_serving',
        400
      );
    }

    // Verify ownership: meal_detail_id -> meal_id -> user_id
    const { data: mealDetail, error: fetchError } = await supabase
      .from('user_meal_details')
      .select('meal_id')
      .eq('meal_detail_id', meal_detail_id)
      .single();

    if (fetchError || !mealDetail) {
      return errorResponse('ENTITY_NOT_FOUND', 'Meal detail not found', 404);
    }

    const { data: meal, error: mealError } = await supabase
      .from('user_meals')
      .select('user_id')
      .eq('meal_id', mealDetail.meal_id)
      .single();

    if (mealError || !meal || meal.user_id !== user!.userId) {
      return errorResponse('ACCESS_DENIED', 'Insufficient permissions', 403);
    }

    // Update meal food
    const { error: updateError } = await supabase
      .from('user_meal_details')
      .update({ numbers_of_serving })
      .eq('meal_detail_id', meal_detail_id);

    if (updateError) {
      return errorResponse('DATABASE_ERROR', 'Failed to update meal food', 400);
    }

    return successResponse({ meal_detail_id, numbers_of_serving });
  } catch (error) {
    console.error('[PUT /meal-foods] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}

/**
 * @swagger
 * /api/ai/meal-foods:
 *   delete:
 *     summary: Delete foods from meal
 *     description: Remove one or more food items from a meal. Verifies ownership.
 *     tags: [AI - Nutrition Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [901, 902]
 *     responses:
 *       200:
 *         description: Foods deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted:
 *                       type: integer
 *                       example: 2
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 *                 message:
 *                   type: string
 *                   example: "Missing or invalid ids array"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "UNAUTHORIZED"
 *                 message:
 *                   type: string
 *                   example: "Missing or invalid authorization token"
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "ACCESS_DENIED"
 *                 message:
 *                   type: string
 *                   example: "Insufficient permissions"
 */
async function handleDELETE(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Missing or invalid ids array', 400);
    }

    // Verify ownership: All meal_detail_ids must belong to user's meals
    const { data: mealDetails, error: fetchError } = await supabase
      .from('user_meal_details')
      .select('meal_id')
      .in('meal_detail_id', ids);

    if (fetchError || !mealDetails) {
      return errorResponse('DATABASE_ERROR', 'Failed to verify ownership', 400);
    }

    const mealIds = mealDetails.map((md: any) => md.meal_id);

    const { data: meals, error: mealsError } = await supabase
      .from('user_meals')
      .select('user_id')
      .in('meal_id', mealIds);

    if (mealsError || !meals || !meals.every((m: any) => m.user_id === user!.userId)) {
      return errorResponse('ACCESS_DENIED', 'Insufficient permissions', 403);
    }

    // Delete meal foods
    const { error: deleteError } = await supabase
      .from('user_meal_details')
      .delete()
      .in('meal_detail_id', ids);

    if (deleteError) {
      return errorResponse('DATABASE_ERROR', 'Failed to delete meal foods', 400);
    }

    return successResponse({ deleted: ids.length });
  } catch (error) {
    console.error('[DELETE /meal-foods] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}

/**
 * Main handlers for /api/ai/meal-foods
 */
export async function POST(req: NextRequest) {
  return handlePOST(req);
}

export async function PUT(req: NextRequest) {
  return handlePUT(req);
}

export async function DELETE(req: NextRequest) {
  return handleDELETE(req);
}
