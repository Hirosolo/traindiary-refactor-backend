/**
 * @swagger
 * tags:
 *   name: Meals
 *   description: Meal management
 */

/**
 * @swagger
 * /api/meals:
 *   get:
 *     summary: Get user meals with total nutrition
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Optional user ID to query meals for (if not provided, uses authenticated user)
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Filter by month (YYYY-MM format)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Filter by specific date (YYYY-MM-DD format)
 *     responses:
 *       200:
 *         description: List of meals with aggregated nutrition totals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       meal_id:
 *                         type: integer
 *                       meal_type:
 *                         type: string
 *                         enum: [breakfast, lunch, dinner, snack, pre-workout, post-workout]
 *                       log_date:
 *                         type: string
 *                         format: date
 *                       total_calories:
 *                         type: number
 *                       total_protein:
 *                         type: number
 *                       total_carbs:
 *                         type: number
 *                       total_fat:
 *                         type: number
 *                       total_fibers:
 *                         type: number
 *                       total_sugars:
 *                         type: number
 *                       total_zincs:
 *                         type: number
 *                       total_magnesiums:
 *                         type: number
 *                       total_calciums:
 *                         type: number
 *                       total_irons:
 *                         type: number
 *                       total_vitamin_a:
 *                         type: number
 *                       total_vitamin_c:
 *                         type: number
 *                       total_vitamin_b12:
 *                         type: number
 *                       total_vitamin_d:
 *                         type: number
 *       400:
 *         description: User ID is required
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: create a meal
 *     tags: [Meals]
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
 *               userId:
 *                 type: integer
 *                 description: Optional user ID to log meal for (if not provided, uses authenticated user)
 *               meal_type:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack, pre-workout, post-workout]
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
 *       400:
 *         description: User ID is required
 *       401:
 *         description: Unauthorized
 */
import { NextRequest } from "next/server";
import { MealRepository } from "@/repositories/log.repository";
import { requestMealSchema } from "@/validation/log.schema";
import { successResponse, errorResponse } from "@/lib/response";
import { fromZodError } from "zod-validation-error";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);

    const searchParams = req.nextUrl.searchParams;
    const userIdParam = searchParams.get("userId");

    if (!userIdParam && !user) return errorResponse("User ID is required", 400);

    if (!user) return errorResponse("Unauthorized", 401);

    const userId = userIdParam ? parseInt(userIdParam) : user.userId;
    const month = searchParams.get("month") || undefined;
    const date = searchParams.get("date") || undefined;

    const meals = await MealRepository.findByUserId(userId, { month, date });
    return successResponse(meals);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);

    const searchParams = req.nextUrl.searchParams;
    const userIdParam = searchParams.get("userId");

    if (!userIdParam && !user) return errorResponse("User ID is required", 400);

    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const validation = requestMealSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Wrong format", 400);
    }

    const userId = body.userId || user.userId;
    const meal = await MealRepository.create(userId, validation.data);
    return successResponse(meal, "Meal logged successfully", 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
