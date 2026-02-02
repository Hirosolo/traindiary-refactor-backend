import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticate, errorResponse, successResponse } from '../utils';

/**
 * @swagger
 * /api/ai/session-details:
 *   get:
 *     summary: Get exercise sets/logs
 *     description: Retrieve all sets/logs for a specific exercise detail (session_detail_id) with exercise set details.
 *     tags: [AI - Workout Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: session_detail_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Session detail ID to get exercise sets for
 *         example: 201
 *     responses:
 *       200:
 *         description: Exercise sets retrieved successfully
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
 *                       set_id:
 *                         type: integer
 *                         example: 505
 *                       session_detail_id:
 *                         type: integer
 *                         example: 201
 *                       reps:
 *                         type: integer
 *                         example: 10
 *                       weight_kg:
 *                         type: number
 *                         format: float
 *                         nullable: true
 *                         example: 20.5
 *                       duration:
 *                         type: integer
 *                         nullable: true
 *                         example: 0
 *                       notes:
 *                         type: string
 *                         nullable: true
 *                         example: "Easy RPE"
 *                       status:
 *                         type: string
 *                         example: "completed"
 *       400:
 *         description: Missing session_detail_id parameter
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
 *                   example: "Missing session_detail_id parameter"
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
 *         description: Session detail not found or access denied
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
 *                   example: "Session detail not found or access denied"
 */
async function handleGET(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const sessionDetailId = searchParams.get('session_detail_id');

  if (!sessionDetailId) {
    return errorResponse('VALIDATION_ERROR', 'Missing session_detail_id parameter', 400);
  }

  try {
    // Verify session detail ownership
    const { data: sessionDetail, error: sdError } = await supabase
      .from('session_details')
      .select('session_id')
      .eq('session_detail_id', parseInt(sessionDetailId))
      .single();

    if (sdError || !sessionDetail) {
      return errorResponse('ENTITY_NOT_FOUND', 'Session detail not found or access denied', 404);
    }

    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('user_id')
      .eq('session_id', sessionDetail.session_id)
      .single();

    if (sessionError || !session || session.user_id !== user!.userId) {
      return errorResponse('ENTITY_NOT_FOUND', 'Session detail not found or access denied', 404);
    }

    // Get all exercise sets/logs for this session detail
    const { data, error: dbError } = await supabase
      .from('sessions_exercise_details')
      .select('*')
      .eq('session_detail_id', parseInt(sessionDetailId));

    if (dbError) {
      return errorResponse('DATABASE_ERROR', 'Failed to fetch exercise sets', 400);
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
