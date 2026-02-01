/**
 * @swagger
 * /api/exercises:
 *   get:
 *     summary: Get all exercises or search exercises by name
 *     tags: [Master Data]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search keyword for exercise name
 *     responses:
 *       200:
 *         description: List of exercises
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
 *                       exercise_id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Barbell Bench Press
 *                       category:
 *                         type: string
 *                         example: Chest
 *                       default_sets:
 *                         type: integer
 *                         example: 4
 *                       default_reps:
 *                         type: integer
 *                         example: 8
 *                       description:
 *                         type: string
 *                         example: Compound movement focusing on mid chest and triceps involvement.
 *                       difficulty_factor:
 *                         type: number
 *                         example: 1.0
 *                       type:
 *                         type: string
 *                         example: strength
 *       404:
 *         description: No exercises found
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
 *                   example: not found exercise with those keyword
 *                 data:
 *                   type: array
 *                   example: []
 *   post:
 *     summary: Create new exercise
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Barbell Bench Press
 *               category:
 *                 type: string
 *                 example: Chest
 *               default_sets:
 *                 type: integer
 *                 example: 4
 *               default_reps:
 *                 type: integer
 *                 example: 8
 *               description:
 *                 type: string
 *                 example: Compound movement focusing on mid chest and triceps involvement.
 *               difficulty_factor:
 *                 type: number
 *                 example: 1.0
 *               type:
 *                 type: string
 *                 enum: [strength, cardio, flexibility, balance]
 *                 example: strength
 *     responses:
 *       201:
 *         description: Exercise created successfully
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
 *                   example: Exercise created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     exercise_id:
 *                       type: integer
 *                       example: 100
 *                     name:
 *                       type: string
 *                       example: Barbell Bench Press
 *                     category:
 *                       type: string
 *                       example: Chest
 *                     default_sets:
 *                       type: integer
 *                       example: 4
 *                     default_reps:
 *                       type: integer
 *                       example: 8
 *                     description:
 *                       type: string
 *                       example: Compound movement focusing on mid chest and triceps involvement.
 *                     difficulty_factor:
 *                       type: number
 *                       example: 1.0
 *                     type:
 *                       type: string
 *                       example: strength
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       400:
 *         description: Wrong format
 */
import { NextRequest } from 'next/server';
import { ExerciseRepository } from '@/repositories/master.repository';
import { exerciseSchema } from '@/validation/master.schema';
import { successResponse, errorResponse } from '@/lib/response';
import { fromZodError } from 'zod-validation-error';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const name = searchParams.get('name');

    let exercises;
    if (name) {
      exercises = await ExerciseRepository.findByName(name);
      if (!exercises || exercises.length === 0) {
        return errorResponse('not found exercise with those keyword', 404);
      }
    } else {
      exercises = await ExerciseRepository.findAll();
    }

    return successResponse(exercises, 'Success', 200);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const validation = exerciseSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Wrong format",400);
    }

    const exercise = await ExerciseRepository.create(validation.data);
    return successResponse(exercise, 'Exercise created successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
