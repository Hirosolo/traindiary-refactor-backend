import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticate, errorResponse, successResponse } from '../utils';

/**
 * @swagger
 * /api/ai/session-details:
 *   get:
 *     summary: Get session exercises
 *     description: Retrieve all exercises for a specific workout session with exercise details.
 *     tags: [AI - Workout Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: session_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Session ID to get exercises for
 *         example: 101
 *     responses:
 *       200:
 *         description: Session exercises retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       session_detail_id:
 *                         type: integer
 *                         example: 201
 *                       session_id:
 *                         type: integer
 *                         example: 101
 *                       exercise_id:
 *                         type: integer
 *                         example: 50
 *                       status:
 *                         type: string
 *                         example: "pending"
 *                       exercises:
 *                         type: object
 *                         properties:
 *                           exercise_id:
 *                             type: integer
 *                             example: 50
 *                           name:
 *                             type: string
 *                             example: "Squat"
 *       400:
 *         description: Missing session_id parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 *                 message:
 *                   type: string
 *                   example: "Missing session_id parameter"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "UNAUTHORIZED"
 *                 message:
 *                   type: string
 *                   example: "Missing or invalid authorization token"
 *       404:
 *         description: Session not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "ENTITY_NOT_FOUND"
 *                 message:
 *                   type: string
 *                   example: "Session not found or access denied"
 */
async function handleGET(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return errorResponse('VALIDATION_ERROR', 'Missing session_id parameter', 400);
  }

  try {
    // Verify session ownership
    const { data: sessionData, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('user_id')
      .eq('session_id', parseInt(sessionId))
      .single();

    if (sessionError || !sessionData || sessionData.user_id !== user!.userId) {
      return errorResponse('ENTITY_NOT_FOUND', 'Session not found or access denied', 404);
    }

    // Get session details with exercise info
    const { data, error: dbError } = await supabase
      .from('session_details')
      .select(
        `*,
        exercises (
          exercise_id,
          name
        )`
      )
      .eq('session_id', parseInt(sessionId));

    if (dbError) {
      return errorResponse('DATABASE_ERROR', 'Failed to fetch session details', 400);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error('[GET /session-details] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}

/**
 * @swagger
 * /api/ai/session-details:
 *   post:
 *     summary: Add exercise to session
 *     description: Add an exercise to a workout session. Verifies session ownership before adding.
 *     tags: [AI - Workout Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_id, exercise_id]
 *             properties:
 *               session_id:
 *                 type: integer
 *                 example: 101
 *               exercise_id:
 *                 type: integer
 *                 example: 50
 *               status:
 *                 type: string
 *                 example: "pending"
 *     responses:
 *       201:
 *         description: Exercise added to session successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     session_detail_id:
 *                       type: integer
 *                       example: 201
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: session_id, exercise_id"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "UNAUTHORIZED"
 *                 message:
 *                   type: string
 *                   example: "Missing or invalid authorization token"
 *       403:
 *         description: Access denied - Session does not belong to user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "ACCESS_DENIED"
 *                 message:
 *                   type: string
 *                   example: "Session does not belong to user"
 */
async function handlePOST(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { session_id, exercise_id, status } = body;

    if (!session_id || !exercise_id) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Missing required fields: session_id, exercise_id',
        400
      );
    }

    // Security Check: Verify session ownership
    const { data: sessionData, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('user_id')
      .eq('session_id', session_id)
      .single();

    if (sessionError || !sessionData || sessionData.user_id !== user!.userId) {
      return errorResponse('ACCESS_DENIED', 'Session does not belong to user', 403);
    }

    // Insert session detail
    const { data, error: insertError } = await supabase
      .from('session_details')
      .insert({
        session_id,
        exercise_id,
        status: status || 'pending',
      })
      .select('session_detail_id')
      .single();

    if (insertError || !data) {
      return errorResponse('DATABASE_ERROR', 'Failed to add exercise to session', 400);
    }

    return successResponse(data, 201);
  } catch (error) {
    console.error('[POST /session-details] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}

/**
 * @swagger
 * /api/ai/session-details:
 *   put:
 *     summary: Update exercise status
 *     description: Batch update status for multiple session exercises.
 *     tags: [AI - Workout Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids, status]
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [201, 202]
 *               status:
 *                 type: string
 *                 example: "skipped"
 *     responses:
 *       200:
 *         description: Exercise status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated:
 *                       type: integer
 *                       example: 2
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ids (array), status"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "UNAUTHORIZED"
 *                 message:
 *                   type: string
 *                   example: "Missing or invalid authorization token"
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error_code:
 *                   type: string
 *                   example: "ACCESS_DENIED"
 *                 message:
 *                   type: string
 *                   example: "Insufficient permissions"
 */
async function handlePUT(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || !status) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Missing required fields: ids (array), status',
        400
      );
    }

    // Verify ownership: All session_details must belong to user's sessions
    const { data: sessionDetails, error: fetchError } = await supabase
      .from('session_details')
      .select('session_id')
      .in('session_detail_id', ids);

    if (fetchError || !sessionDetails) {
      return errorResponse('DATABASE_ERROR', 'Failed to verify ownership', 400);
    }

    const sessionIds = sessionDetails.map((sd: any) => sd.session_id);

    const { data: sessions, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('user_id')
      .in('session_id', sessionIds);

    if (sessionError || !sessions || !sessions.every((s: any) => s.user_id === user!.userId)) {
      return errorResponse('ACCESS_DENIED', 'Insufficient permissions', 403);
    }

    // Update status
    const { error: updateError } = await supabase
      .from('session_details')
      .update({ status })
      .in('session_detail_id', ids);

    if (updateError) {
      return errorResponse('DATABASE_ERROR', 'Failed to update session details', 400);
    }

    return successResponse({ updated: ids.length });
  } catch (error) {
    console.error('[PUT /session-details] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}

/**
 * Main handlers for /api/ai/session-details
 */
export async function GET(req: NextRequest) {
  return handleGET(req);
}

export async function POST(req: NextRequest) {
  return handlePOST(req);
}

export async function PUT(req: NextRequest) {
  return handlePUT(req);
}
