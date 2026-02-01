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
 *     summary: Get all foods or search foods by name
 *     tags: [Foods]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword for food name
 *     responses:
 *       200:
 *         description: List of foods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       food_id:
 *                         type: integer
 *                         example: 71
 *                       name:
 *                         type: string
 *                         example: Almonds
 *                       calories_per_serving:
 *                         type: number
 *                         example: 579
 *                       protein_per_serving:
 *                         type: number
 *                         example: 21
 *                       carbs_per_serving:
 *                         type: number
 *                         example: 22
 *                       fat_per_serving:
 *                         type: number
 *                         example: 50
 *                       serving_type:
 *                         type: string
 *                         example: 100 g
 *                       image:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       fibers_per_serving:
 *                         type: number
 *                         example: 10
 *                       sugars_per_serving:
 *                         type: number
 *                         example: 0
 *                       zincs_per_serving:
 *                         type: number
 *                         example: 0.003
 *                       magnesiums_per_serving:
 *                         type: number
 *                         example: 0.25
 *                       calciums_per_serving:
 *                         type: number
 *                         example: 0.1
 *                       irons_per_serving:
 *                         type: number
 *                         example: 0.003
 *                       vitamin_a_per_serving:
 *                         type: number
 *                         example: 0
 *                       vitamin_c_per_serving:
 *                         type: number
 *                         example: 0
 *                       vitamin_b12_per_serving:
 *                         type: number
 *                         example: 0
 *                       vitamin_d_per_serving:
 *                         type: number
 *                         example: 0
 *       404:
 *         description: No foods found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: not found food base on the keyword
 *                 data:
 *                   type: array
 *                   example: []
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
 *                 example: Almonds
 *               calories_per_serving:
 *                 type: number
 *                 example: 579
 *               protein_per_serving:
 *                 type: number
 *                 example: 21
 *               carbs_per_serving:
 *                 type: number
 *                 example: 22
 *               fat_per_serving:
 *                 type: number
 *                 example: 50
 *               serving_type:
 *                 type: string
 *                 example: 100 g
 *               image:
 *                 type: string
 *                 nullable: true
 *               fibers_per_serving:
 *                 type: number
 *                 example: 10
 *               sugars_per_serving:
 *                 type: number
 *                 example: 0
 *               zincs_per_serving:
 *                 type: number
 *                 example: 0.003
 *               magnesiums_per_serving:
 *                 type: number
 *                 example: 0.25
 *               calciums_per_serving:
 *                 type: number
 *                 example: 0.1
 *               irons_per_serving:
 *                 type: number
 *                 example: 0.003
 *               vitamin_a_per_serving:
 *                 type: number
 *                 example: 0
 *               vitamin_c_per_serving:
 *                 type: number
 *                 example: 0
 *               vitamin_b12_per_serving:
 *                 type: number
 *                 example: 0
 *               vitamin_d_per_serving:
 *                 type: number
 *                 example: 0
 *     responses:
 *       201:
 *         description: Food created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Food created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error
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
    
    if (search && (!foods || foods.length === 0)) {
      return errorResponse('not found any food math with the keyword', 404);
    }
    
    return successResponse(foods, 'Success', 200);
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
