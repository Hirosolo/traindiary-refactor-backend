/**
 * @swagger
 * /api/workouts/{id}:
 *   get:
 *     summary: Get workout session details
 *     tags: [Logs]
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
 *         description: Workout session details
 *   put:
 *     summary: Update workout session
 *     tags: [Logs]
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
 *         description: Session updated
 *   delete:
 *     summary: Delete workout session
 *     tags: [Logs]
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
 *         description: Session deleted
 */
import { NextRequest } from 'next/server';
import { WorkoutRepository } from '@/repositories/log.repository';
import { successResponse, errorResponse } from '@/lib/response';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const sessionId = parseInt(params.id);
    if (isNaN(sessionId)) {
      return errorResponse('Invalid session ID', 400);
    }

    // Fetch the specific workout session with all details
    const { data, error } = await (await import('@/lib/supabase')).supabase
      .from('workout_sessions')
      .select(`
        *,
        session_details:session_details(
          *,
          exercises:exercises(*),
          exercise_logs:sessions_exercise_details(*)
        )
      `)
      .eq('session_id', sessionId)
      .eq('user_id', user.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Workout session not found', 404);
      }
      throw new Error(error.message);
    }

    return successResponse(data);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const sessionId = parseInt(params.id);
    if (isNaN(sessionId)) {
      return errorResponse('Invalid session ID', 400);
    }

    const body = await req.json();
    
    const result = await WorkoutRepository.updateSession(sessionId, user.userId, body);
    return successResponse(result, 'Workout session updated');
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const sessionId = parseInt(params.id);
    if (isNaN(sessionId)) {
      return errorResponse('Invalid session ID', 400);
    }

    await WorkoutRepository.delete(sessionId, user.userId);
    return successResponse({ message: 'Workout session deleted' });
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
