import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticate, errorResponse, successResponse, validateMethod } from '../utils';

/**
 * @swagger
 * /api/ai/sessions:
 *   get:
 *     summary: Get workout sessions
 *     description: Retrieve all user's workout sessions or a specific session by ID. Requires JWT authentication.
 *     tags: [AI - Workout Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: Optional session ID to retrieve a specific session
 *         example: 101
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
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
 *                       session_id:
 *                         type: integer
 *                         example: 101
 *                       user_id:
 *                         type: integer
 *                         example: 1
 *                       scheduled_date:
 *                         type: string
 *                         format: date
 *                         example: "2023-10-27"
 *                       type:
 *                         type: string
 *                         example: "Strength"
 *                       status:
 *                         type: string
 *                         example: "completed"
 *                       notes:
 *                         type: string
 *                         nullable: true
 *                         example: "Leg day"
 *                       gr_score:
 *                         type: integer
 *                         nullable: true
 *                         example: 85
 *       401:
 *         description: Unauthorized - Missing or invalid JWT token
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
 *         description: Session not found
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
 *                   example: "Workout session not found"
 */
async function handleGET(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('id');

  try {
    if (sessionId) {
      // Get specific session by ID with session details
      const { data, error: dbError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          session_details (*)
        `)
        .eq('session_id', parseInt(sessionId))
        .eq('user_id', user!.userId)
        .single();

      if (dbError || !data) {
        return errorResponse('ENTITY_NOT_FOUND', 'Workout session not found', 404);
      }

      return successResponse([data]);
    } else {
      // Get user's workout history with session details
      const { data, error: dbError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          session_details (*)
        `)
        .eq('user_id', user!.userId)
        .order('scheduled_date', { ascending: false });

      if (dbError) {
        return errorResponse('DATABASE_ERROR', 'Failed to fetch sessions', 400);
      }

      return successResponse(data || []);
    }
  } catch (error) {
    console.error('[GET /sessions] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}

/**
 * @swagger
 * /api/ai/sessions:
 *   post:
 *     summary: Create workout session
 *     description: Create a new workout session. Maximum 1 session per day per user.
 *     tags: [AI - Workout Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheduled_date, type, status]
 *             properties:
 *               scheduled_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-10-27"
 *               type:
 *                 type: string
 *                 example: "strength"
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 example: "Focus on form"
 *               status:
 *                 type: string
 *                 example: "planned"
 *     responses:
 *       201:
 *         description: Session created successfully
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
 *                     session_id:
 *                       type: integer
 *                       example: 101
 *       400:
 *         description: Validation error - Missing required fields
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
 *                   example: "Missing required fields: scheduled_date, type, status"
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
 *       409:
 *         description: Conflict - Session already exists for this date
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
 *                   example: "CONFLICT"
 *                 message:
 *                   type: string
 *                   example: "Session already exists for this date"
 */
async function handlePOST(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { scheduled_date, type, notes, status } = body;

    // Validate required fields
    if (!scheduled_date || !type || !status) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Missing required fields: scheduled_date, type, status',
        400
      );
    }

    // Check constraint: Max 1 session per day per user
    const { data: existingSession, error: checkError } = await supabase
      .from('workout_sessions')
      .select('session_id')
      .eq('user_id', user!.userId)
      .eq('scheduled_date', scheduled_date)
      .single();

    if (existingSession && !checkError) {
      return errorResponse(
        'CONFLICT',
        'Session already exists for this date',
        409
      );
    }

    // Insert new session
    const { data, error: insertError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user!.userId,
        scheduled_date,
        type,
        notes: notes || null,
        status,
        gr_score: null,
      })
      .select('session_id')
      .single();

    if (insertError || !data) {
      return errorResponse('DATABASE_ERROR', 'Failed to create session', 400);
    }

    return successResponse(data, 201);
  } catch (error) {
    console.error('[POST /sessions] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}

/**
 * @swagger
 * /api/ai/sessions:
 *   put:
 *     summary: Update workout session(s)
 *     description: Update a single session (full update) or batch update status for multiple sessions.
 *     tags: [AI - Workout Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 description: Full update for single session
 *                 required: [session_id]
 *                 properties:
 *                   session_id:
 *                     type: integer
 *                     example: 101
 *                   scheduled_date:
 *                     type: string
 *                     format: date
 *                     example: "2023-10-28"
 *                   type:
 *                     type: string
 *                     example: "stength"
 *                   notes:
 *                     type: string
 *                     example: "Updated note"
 *                   status:
 *                     type: string
 *                     example: "completed"
 *               - type: object
 *                 description: Batch status update
 *                 required: [ids, status]
 *                 properties:
 *                   ids:
 *                     type: array
 *                     items:
 *                       type: integer
 *                     example: [101, 102]
 *                   status:
 *                     type: string
 *                     example: "completed"
 *     responses:
 *       200:
 *         description: Session updated successfully
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
 *                     session_id:
 *                       type: integer
 *                       example: 113
 *                     scheduled_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-02-03"
 *                     type:
 *                       type: string
 *                       example: "strength"
 *                     notes:
 *                       type: string
 *                       nullable: true
 *                       example: "Updated note"
 *                     status:
 *                       type: string
 *                       example: "PENDING"
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
 *                   example: "Missing session_id"
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
 */
async function handlePUT(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { session_id, ids, status, scheduled_date, type, notes, gr_score } = body;

    // Scenario B: Batch status update
    if (ids && Array.isArray(ids) && status) {
      const { error: updateError } = await supabase
        .from('workout_sessions')
        .update({ status })
        .in('session_id', ids)
        .eq('user_id', user!.userId);

      if (updateError) {
        return errorResponse('DATABASE_ERROR', 'Failed to update sessions', 400);
      }

      return successResponse({ updated: ids.length });
    }

    // Scenario A: Full update
    if (!session_id) {
      return errorResponse('VALIDATION_ERROR', 'Missing session_id', 400);
    }

    const updateData: any = {};
    if (scheduled_date) updateData.scheduled_date = scheduled_date;
    if (type) updateData.type = type;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    if (gr_score !== undefined) updateData.gr_score = gr_score;

    const { data: updatedSession, error: updateError } = await supabase
      .from('workout_sessions')
      .update(updateData)
      .eq('session_id', session_id)
      .eq('user_id', user!.userId)
      .select('session_id, scheduled_date, type, notes, status')
      .single();

    if (updateError || !updatedSession) {
      return errorResponse('DATABASE_ERROR', 'Failed to update session', 400);
    }

    return successResponse(updatedSession);
  } catch (error) {
    console.error('[PUT /sessions] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}

/**
 * @swagger
 * /api/ai/sessions:
 *   delete:
 *     summary: Delete workout sessions
 *     description: Delete one or more workout sessions by their IDs.
 *     tags: [AI - Workout Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [101, 105]
 *     responses:
 *       200:
 *         description: Sessions deleted successfully
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
 *                     deleted:
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
 *                   example: "Missing or invalid ids array"
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
 */
async function handleDELETE(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Missing or invalid ids array', 400);
    }

    const { error: deleteError } = await supabase
      .from('workout_sessions')
      .delete()
      .in('session_id', ids)
      .eq('user_id', user!.userId);

    if (deleteError) {
      return errorResponse('DATABASE_ERROR', 'Failed to delete sessions', 400);
    }

    return successResponse({ deleted: ids.length });
  } catch (error) {
    console.error('[DELETE /sessions] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}

/**
 * Main handler for /api/ai/sessions
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

export async function DELETE(req: NextRequest) {
  return handleDELETE(req);
}
