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
 *   post:
 *     summary: Create new exercise
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Exercise created
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

    if (name) {
      const exercises = await ExerciseRepository.findByName(name);
      return successResponse(exercises);
    }

    const exercises = await ExerciseRepository.findAll();
    return successResponse(exercises);
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
      return errorResponse(fromZodError(validation.error).message);
    }

    const exercise = await ExerciseRepository.create(validation.data);
    return successResponse(exercise, 'Exercise created successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
