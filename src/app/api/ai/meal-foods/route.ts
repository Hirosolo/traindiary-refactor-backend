import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { authenticate, errorResponse, successResponse } from "../utils";

/**
 * @swagger
 * /api/ai/meal-foods:
 *   post:
 *     summary: Add multiple foods to meal
 *     description: |
 *       Bulk add multiple food items to a meal with serving quantities.
 *       Verifies meal ownership and returns ALL foods currently in the meal after insertion.
 *     tags: [AI - Nutrition Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [meal_id, foods]
 *             properties:
 *               meal_id:
 *                 type: integer
 *                 example: 300
 *               foods:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [food_id, numbers_of_serving]
 *                   properties:
 *                     food_id:
 *                       type: integer
 *                       example: 55
 *                     numbers_of_serving:
 *                       type: number
 *                       format: float
 *                       example: 1.5
 *
 *     responses:
 *       201:
 *         description: Foods added successfully. Returns all foods in the meal.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: List of all meal details for this meal
 *                   items:
 *                     type: object
 *                     properties:
 *                       meal_detail_id:
 *                         type: integer
 *                         example: 901
 *                       meal_id:
 *                         type: integer
 *                         example: 300
 *                       food_id:
 *                         type: integer
 *                         example: 55
 *                       numbers_of_serving:
 *                         type: number
 *                         format: float
 *                         example: 1.5
 *
 *       400:
 *         description: Validation or database error
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
 *                   example: "meal_id and foods[] are required"
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Meal does not belong to user
 *
 *       500:
 *         description: Internal server error
 */

async function handlePOST(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { meal_id, foods } = body;

    // Validate input
    if (!meal_id || !Array.isArray(foods) || foods.length === 0) {
      return errorResponse(
        "VALIDATION_ERROR",
        "meal_id and foods[] are required",
        400,
      );
    }

    // Security check: verify meal ownership
    const { data: meal, error: mealError } = await supabase
      .from("user_meals")
      .select("user_id")
      .eq("meal_id", meal_id)
      .single();

    if (mealError || !meal || meal.user_id !== user!.userId) {
      return errorResponse(
        "ACCESS_DENIED",
        "Meal does not belong to user",
        403,
      );
    }

    // Validate each food item
    for (const item of foods) {
      if (!item.food_id || item.numbers_of_serving === undefined) {
        return errorResponse(
          "VALIDATION_ERROR",
          "Each food must have food_id and numbers_of_serving",
          400,
        );
      }
    }

    // Prepare rows for bulk insert
    const rows = foods.map((item: any) => ({
      meal_id,
      food_id: item.food_id,
      numbers_of_serving: item.numbers_of_serving,
    }));

    // Bulk insert
    const { error: insertError } = await supabase
      .from("user_meal_details")
      .insert(rows);

    if (insertError) {
      return errorResponse(
        "DATABASE_ERROR",
        "Failed to add foods to meal",
        400,
      );
    }

    const data = await supabase
  .from('user_meal_details')
  .select('*')
  .eq('meal_id', meal_id);

    return successResponse(data, 201);
  } catch (err) {
    console.error("[POST /meal-foods] Error:", err);
    return errorResponse("INTERNAL_ERROR", "Internal server error", 500);
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
        "VALIDATION_ERROR",
        "Missing required fields: meal_detail_id, numbers_of_serving",
        400,
      );
    }

    // Verify ownership: meal_detail_id -> meal_id -> user_id
    const { data: mealDetail, error: fetchError } = await supabase
      .from("user_meal_details")
      .select("meal_id")
      .eq("meal_detail_id", meal_detail_id)
      .single();

    if (fetchError || !mealDetail) {
      return errorResponse("ENTITY_NOT_FOUND", "Meal detail not found", 404);
    }

    const { data: meal, error: mealError } = await supabase
      .from("user_meals")
      .select("user_id")
      .eq("meal_id", mealDetail.meal_id)
      .single();

    if (mealError || !meal || meal.user_id !== user!.userId) {
      return errorResponse("ACCESS_DENIED", "Insufficient permissions", 403);
    }

    // Update meal food
    const { error: updateError } = await supabase
      .from("user_meal_details")
      .update({ numbers_of_serving })
      .eq("meal_detail_id", meal_detail_id);

    if (updateError) {
      return errorResponse("DATABASE_ERROR", "Failed to update meal food", 400);
    }

    return successResponse({ meal_detail_id, numbers_of_serving });
  } catch (error) {
    console.error("[PUT /meal-foods] Error:", error);
    return errorResponse("INTERNAL_ERROR", "Internal server error", 400);
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
      return errorResponse(
        "VALIDATION_ERROR",
        "Missing or invalid ids array",
        400,
      );
    }

    // Verify ownership: All meal_detail_ids must belong to user's meals
    const { data: mealDetails, error: fetchError } = await supabase
      .from("user_meal_details")
      .select("meal_id")
      .in("meal_detail_id", ids);

    if (fetchError || !mealDetails) {
      return errorResponse("DATABASE_ERROR", "Failed to verify ownership", 400);
    }

    const mealIds = mealDetails.map((md: any) => md.meal_id);

    const { data: meals, error: mealsError } = await supabase
      .from("user_meals")
      .select("user_id")
      .in("meal_id", mealIds);

    if (
      mealsError ||
      !meals ||
      !meals.every((m: any) => m.user_id === user!.userId)
    ) {
      return errorResponse("ACCESS_DENIED", "Insufficient permissions", 403);
    }

    // Delete meal foods
    const { error: deleteError } = await supabase
      .from("user_meal_details")
      .delete()
      .in("meal_detail_id", ids);

    if (deleteError) {
      return errorResponse(
        "DATABASE_ERROR",
        "Failed to delete meal foods",
        400,
      );
    }

    return successResponse({ deleted: ids.length });
  } catch (error) {
    console.error("[DELETE /meal-foods] Error:", error);
    return errorResponse("INTERNAL_ERROR", "Internal server error", 400);
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
