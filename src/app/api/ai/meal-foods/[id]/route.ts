import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { authenticate, errorResponse, successResponse } from "../../utils";

/**
 * @swagger
 * /api/ai/meal-foods/{id}:
 *   get:
 *     summary: Get foods in a meal
 *     description: |
 *       Returns all food items for a specific meal.
 *       Only the meal owner can access this resource.
 *     tags: [AI - Nutrition Tracking]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Meal ID
 *         schema:
 *           type: integer
 *           example: 300
 *
 *     responses:
 *       200:
 *         description: List of foods in the meal
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
 *                   items:
 *                     type: object
 *                     properties:
 *                       meal_detail_id:
 *                         type: integer
 *                         example: 901
 *                       food_id:
 *                         type: integer
 *                         example: 55
 *                       number_of_serving:
 *                         type: number
 *                         format: float
 *                         example: 1.5
 *
 *       400:
 *         description: Invalid meal id or database error
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
 *                   example: "Invalid meal_id"
 *
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
 *
 *       404:
 *         description: Meal not found or does not belong to user
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
 *                   example: "NOT_FOUND"
 *                 message:
 *                   type: string
 *                   example: "Meal not found"
 *
 *       500:
 *         description: Internal server error
 */

async function handleGET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const { id } = await params;
    const mealId = parseInt(id, 10);

    if (isNaN(mealId)) {
      return errorResponse("VALIDATION_ERROR", "Invalid meal_id", 400);
    }

    // First verify the meal belongs to the user
    const { data: meal, error: mealError } = await supabase
      .from("user_meals")
      .select("meal_id")
      .eq("meal_id", mealId)
      .eq("user_id", user!.userId)
      .single();

    if (mealError || !meal) {
      return errorResponse("NOT_FOUND", "Meal not found", 404);
    }

    // Get foods for this meal
    const { data: foods, error: foodsError } = await supabase
      .from("user_meal_details")
      .select("meal_detail_id, food_id, numbers_of_serving")
      .eq("meal_id", mealId);

    if (foodsError) {
      return errorResponse("DATABASE_ERROR", "Failed to fetch meal foods", 400);
    }

    return successResponse(foods || []);
  } catch (err) {
    console.error("[GET /meal-foods/$[id]] Error:", err);
    return errorResponse("INTERNAL_ERROR", "Internal server error", 500);
  }
}


export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleGET(req, { params });
}