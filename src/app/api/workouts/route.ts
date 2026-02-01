/**
 * @swagger
 * /api/workouts:
 *   get:
 *     summary: Get user workouts
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workouts
 *   put:
 *     summary: Update workout session (using session_id in body)
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_id]
 *             properties:
 *               session_id:
 *                 type: integer
 *               status:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Workout updated
 *       400:
 *         description: Missing session_id or invalid JSON
 *   post:
 *     summary: Log a workout session
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheduled_date, exercises]
 *             properties:
 *               userId:
 *                 type: integer
 *               scheduled_date:
 *                 type: string
 *               type:
 *                 type: string
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED, UNFINISHED, MISSED]
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     exercise_id:
 *                       type: integer
 *                     actual_sets:
 *                       type: integer
 *                     actual_reps:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Workout logged
 */
import { NextRequest } from 'next/server';
import { WorkoutRepository } from '@/repositories/log.repository';
import { requestWorkoutSchema } from '@/validation/log.schema';
import { successResponse, errorResponse } from '@/lib/response';
import { fromZodError } from 'zod-validation-error';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const searchParams = req.nextUrl.searchParams;
    const month = searchParams.get('month') || undefined;
    const date = searchParams.get('date') || undefined;

    const workouts = await WorkoutRepository.findByUserId(user.userId, { month, date });
    return successResponse(workouts);
  } catch (error: any) {
    if (error?.message === 'WORKOUT_SESSION_ALREADY_EXISTS') {
      return errorResponse('Only one workout session is allowed per day.', 409);
    }
    return errorResponse(error.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const validation = requestWorkoutSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(fromZodError(validation.error).message);
    }

    const legacyUserId = validation.data.userID ? Number(validation.data.userID) : undefined;
    if (validation.data.userID && Number.isNaN(legacyUserId)) {
      return errorResponse('Invalid userID', 400);
    }

    const requestedUserId = validation.data.userId ?? legacyUserId;
    const targetUserId = requestedUserId ?? user.userId;

    const workout = await WorkoutRepository.create(targetUserId, validation.data);
    return successResponse(workout, 'Workout session logged successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return errorResponse('Valid JSON body is required', 400);
    }
    
    const { session_id, ...updateData } = body;

    if (!session_id) {
      return errorResponse('session_id is required', 400);
    }

    const result = await WorkoutRepository.updateSession(session_id, user.userId, updateData);
    return successResponse(result, 'Workout session updated');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
