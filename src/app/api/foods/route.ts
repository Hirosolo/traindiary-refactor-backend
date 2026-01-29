/**
 * @swagger
 * tags:
 *   name: Foods
 *   description: Food management
 */

/**
 * @swagger
 * /api/foods:
 *   get:
 *     summary: Get all foods
 *     tags: [Foods]
 *     responses:
 *       200:
 *         description: List of foods
 *   post:
 *     summary: Create a new food
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, serving_type]
 *             properties:
 *               name:
 *                 type: string
 *               calories_per_serving:
 *                 type: number
 *               protein_per_serving:
 *                 type: number
 *               carbs_per_serving:
 *                 type: number
 *               fat_per_serving:
 *                 type: number
 *               serving_type:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Food created
 *       401:
 *         description: Unauthorized
 */
import { NextRequest } from 'next/server';
import { FoodRepository } from '@/repositories/master.repository';
import { foodSchema } from '@/validation/master.schema';
import { successResponse, errorResponse } from '@/lib/response';
import { fromZodError } from 'zod-validation-error';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;

    const foods = await FoodRepository.findAll(search);
    return successResponse(foods);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const validation = foodSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(fromZodError(validation.error).message);
    }

    const food = await FoodRepository.create(validation.data);
    return successResponse(food, 'Food created successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
