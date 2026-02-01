/**
 * @swagger
 * tags:
 *   name: Meal Logs
 *   description: Log user meal
 */

/**
 * @swagger
 * /api/meals/{id}:
 *   get:
 *     summary: Get meal details with all foods and nutrition values
 *     tags: [Meal Logs]
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
 *         description: Meal details with all foods and their nutrition values
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     meal_id:
 *                       type: integer
 *                     meal_type:
 *                       type: string
 *                       enum: [breakfast, lunch, dinner, snack, pre-workout, post-workout]
 *                     log_date:
 *                       type: string
 *                       format: date
 *                     foods:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           meal_detail_id:
 *                             type: integer
 *                           food_id:
 *                             type: integer
 *                           food_name:
 *                             type: string
 *                           serving_type:
 *                             type: string
 *                           image:
 *                             type: string
 *                           numbers_of_serving:
 *                             type: number
 *                           total_calories:
 *                             type: number
 *                           total_protein:
 *                             type: number
 *                           total_carbs:
 *                             type: number
 *                           total_fat:
 *                             type: number
 *                           total_fibers:
 *                             type: number
 *                           total_sugars:
 *                             type: number
 *                           total_zincs:
 *                             type: number
 *                           total_magnesiums:
 *                             type: number
 *                           total_calciums:
 *                             type: number
 *                           total_irons:
 *                             type: number
 *                           total_vitamin_a:
 *                             type: number
 *                           total_vitamin_c:
 *                             type: number
 *                           total_vitamin_b12:
 *                             type: number
 *                           total_vitamin_d:
 *                             type: number
 *       404:
 *         description: Meal not found
 *       400:
 *         description: User ID is required
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete meal
 *     tags: [Meal Logs]
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
 *       400:
 *         description: User ID is required
 *       401:
 *         description: Unauthorized
 *       417:
 *         description: Faild to delete meal
 */
import { NextRequest } from "next/server";
import { MealRepository } from "@/repositories/log.repository";
import { successResponse, errorResponse } from "@/lib/response";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getAuthUser(req);

    const searchParams = req.nextUrl.searchParams;
    const userIdParam = searchParams.get("userId");

    if (!userIdParam && !user) return errorResponse("User ID is required", 400);

    if (!user) return errorResponse("Unauthorized", 401);

    const userId = userIdParam ? parseInt(userIdParam) : user.userId;

    const { id } = await params;
    const mealId = parseInt(id);
    if (isNaN(mealId)) {
      return errorResponse("Invalid meal ID", 400);
    }

    const meal = await MealRepository.findById(mealId, userId);
    return successResponse(meal);
  } catch (error: any) {
    if (error.message === "Meal not found") {
      return errorResponse("Meal not found", 404);
    }
    return errorResponse(error.message || "Internal Server Error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = getAuthUser(req);

    const searchParams = req.nextUrl.searchParams;
    const userIdParam = searchParams.get("userId");

    if (!userIdParam && !user) return errorResponse("User ID is required", 400);

    if (!user) return errorResponse("Unauthorized", 401);

    const userId = userIdParam ? parseInt(userIdParam) : user.userId;

    const { id } = await params;
    const mealId = parseInt(id);
    if (isNaN(mealId)) {
      return errorResponse("Invalid meal ID", 400);
    }

    const deleted = await MealRepository.delete(mealId, userId);
    if(!deleted)
      return errorResponse("Faild to delete meal", 417);

    return successResponse({ message: "Meal deleted" });
  } catch (error: any) {
    return errorResponse(error.message || "Internal Server Error", 500);
  }
}
