/**
 * @swagger
 * /api/exercises/{id}:
 *   get:
 *     summary: Get an exercise by ID
 *     tags: [Master Data]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Exercise ID
 *     responses:
 *       200:
 *         description: Exercise details
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
 *                   type: object
 *                   properties:
 *                     exercise_id:
 *                       type: integer
 *                       example: 1
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
 *       404:
 *         description: Exercise not found
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
 *                   example: Exercise not found
 *   put:
 *     summary: Update an exercise by ID
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Exercise ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: Exercise updated successfully
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
 *                   example: Exercise updated successfully
 *       404:
 *         description: Exercise not found
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error
 *   delete:
 *     summary: Delete an exercise by ID
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Exercise ID
 *     responses:
 *       200:
 *         description: Exercise deleted successfully
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
 *                   example: Exercise deleted successfully
 *                 data:
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: Exercise not found
 *       401:
 *         description: Unauthorized
 */
import { NextRequest } from 'next/server';
import { ExerciseRepository } from '@/repositories/master.repository';
import { exerciseSchema } from '@/validation/master.schema';
import { successResponse, errorResponse } from '@/lib/response';
import { fromZodError } from 'zod-validation-error';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exerciseId = parseInt(id);
    const exercise = await ExerciseRepository.findById(exerciseId);
    if (!exercise) return errorResponse('Exercise not found', 404);
    return successResponse(exercise, 'Success', 200);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { id } = await params;
    const exerciseId = parseInt(id);

    if ((await ExerciseRepository.findById(exerciseId)) === null) {
      return errorResponse('Not exist exercise with that id', 404);
    }

    const body = await req.json();
    const validation = exerciseSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Wrong format",400);
    }

    const exercise = await ExerciseRepository.update(exerciseId, validation.data);
    if (!exercise) return errorResponse('Faild to update exercise', 417);
    return successResponse(exercise, 'Exercise updated successfully');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { id } = await params;
    const exerciseId = parseInt(id);

    if((await ExerciseRepository.findById(exerciseId)) === null) {
      return errorResponse('Not exist exercise with that id', 404);
    }

    const deleted = await ExerciseRepository.delete(exerciseId);
    if (!deleted) return errorResponse('Faild to delete exercise', 417);
    return successResponse(null, 'Exercise deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}