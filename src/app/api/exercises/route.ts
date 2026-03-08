/**
 * @swagger
 * tags:
 *   name: Exercises
 *   description: Exercises management
 */

/**
 * @swagger
 * /api/exercises:
 *   get:
 *     summary: Get all exercises or search exercises by name
 *     tags: [Exercises]
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
 *     tags: [Exercises]
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

function formatDateToDDMMYYYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}${mm}${yyyy}`;
}

function parseDDMMYYYY(version: string): Date {
  const day = parseInt(version.substring(0, 2));
  const month = parseInt(version.substring(2, 4)) - 1;
  const year = parseInt(version.substring(4, 8));
  return new Date(year, month, day);
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const name = searchParams.get('name');
    const clientVersion = searchParams.get('version');

    if (name) {
      const exercises = await ExerciseRepository.findByName(name);
      if (!exercises || exercises.length === 0) {
        return errorResponse('Not found exercise with those keyword', 404);
      }
      return successResponse(exercises, 'Success', 200);
    }

    const latestUpdateStr = await ExerciseRepository.getLatestUpdate();
    const latestUpdate = latestUpdateStr ? new Date(latestUpdateStr) : new Date(0);
    const todayVersion = formatDateToDDMMYYYY(latestUpdate);

    // If no version provided, return all data
    if (!clientVersion) {
      const user = getAuthUser(req);
      const exercises = user 
        ? await ExerciseRepository.findAllWithPR(user.userId)
        : await ExerciseRepository.findAll();
      return successResponse({ changed: 1, version: todayVersion, data: exercises }, 'Full data load', 200);
    }

    // Client version matches latest → no change
    if (clientVersion === todayVersion) {
      return successResponse({ changed: 0, version: todayVersion }, 'Data not changed', 200);
    }

    // Incremental sync: fetch rows updated since the start of the client's version day
    const sinceDate = parseDDMMYYYY(clientVersion);
    const updates = await ExerciseRepository.findUpdatedSince(sinceDate.toISOString());

    return successResponse({ 
      changed: updates.length > 0 ? 1 : 0, 
      version: todayVersion, 
      data: updates 
    }, updates.length > 0 ? 'Incremental update' : 'No new updates', 200);

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
