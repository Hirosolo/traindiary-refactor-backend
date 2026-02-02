import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticate, errorResponse, successResponse } from '../utils';

/**
 * @swagger
 * /api/ai/sets:
 *   get:
 *     summary: Get exercise sets
 *     description: Retrieve all sets/logs for a specific exercise detail (session_detail_id).
 *     tags: [AI - Workout Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: session_detail_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Session detail ID to get sets for
 *         example: 201
 *     responses:
 *       200:
 *         description: Sets retrieved successfully
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
 *   post:
 *     summary: Log exercise set
 *     description: Log a set for an exercise with reps, weight, and other details. Verifies ownership chain.
 *     tags: [AI - Workout Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_detail_id, status]
 *             properties:
 *               session_detail_id:
 *                 type: integer
 *                 example: 201
 *               reps:
 *                 type: integer
 *                 example: 10
 *               weight_kg:
 *                 type: number
 *                 format: float
 *                 example: 20.5
 *               duration:
 *                 type: integer
 *                 example: 0
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 example: "Easy RPE"
 *               status:
 *                 type: string
 *                 example: "completed"
 *     responses:
 *       201:
 *         description: Set logged successfully
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
 *                     set_id:
 *                       type: integer
 *                       example: 505
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
 *                   example: "Missing required fields: session_detail_id, status"
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
 *                   example: "Session does not belong to user"
 *       404:
 *         description: Session detail not found
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
 *                   example: "Session detail not found"
 */async function handleGET(req: NextRequest) {
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

    // Get all sets for this session detail
    const { data, error: dbError } = await supabase
      .from('sessions_exercise_details')
      .select('*')
      .eq('session_detail_id', parseInt(sessionDetailId));

    if (dbError) {
      return errorResponse('DATABASE_ERROR', 'Failed to fetch sets', 400);
    }

    return successResponse(data || []);
  } catch (error) {
    console.error('[GET /sets] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}
async function handlePOST(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { session_detail_id, reps, weight_kg, duration, notes, status } = body;

    if (!session_detail_id || !status) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Missing required fields: session_detail_id, status',
        400
      );
    }

    // Deep Validation: Verify link to user
    const { data: sessionDetail, error: fetchError } = await supabase
      .from('session_details')
      .select('session_id')
      .eq('session_detail_id', session_detail_id)
      .single();

    if (fetchError || !sessionDetail) {
      return errorResponse('ENTITY_NOT_FOUND', 'Session detail not found', 404);
    }

    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('user_id')
      .eq('session_id', sessionDetail.session_id)
      .single();

    if (sessionError || !session || session.user_id !== user!.userId) {
      return errorResponse('ACCESS_DENIED', 'Session does not belong to user', 403);
    }

    // Insert set
    const { data, error: insertError } = await supabase
      .from('sessions_exercise_details')
      .insert({
        session_detail_id,
        reps: reps || null,
        weight_kg: weight_kg || null,
        duration: duration || 0,
        notes: notes || null,
        status,
      })
      .select('set_id')
      .single();

    if (insertError || !data) {
      return errorResponse('DATABASE_ERROR', 'Failed to create set', 400);
    }

    return successResponse(data, 201);
  } catch (error) {
    console.error('[POST /sets] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}

/**
 * @swagger
 * /api/ai/sets:
 *   put:
 *     summary: Update exercise set
 *     description: Update a logged set with new values. Verifies ownership chain.
 *     tags: [AI - Workout Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [set_id]
 *             properties:
 *               set_id:
 *                 type: integer
 *                 example: 505
 *               reps:
 *                 type: integer
 *                 example: 12
 *               weight_kg:
 *                 type: number
 *                 format: float
 *                 example: 22.5
 *               status:
 *                 type: string
 *                 example: "completed"
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 example: "Updated notes"
 *               duration:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       200:
 *         description: Set updated successfully
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
 *                     set_id:
 *                       type: integer
 *                       example: 505
 *                     reps:
 *                       type: integer
 *                       example: 12
 *                     weight_kg:
 *                       type: number
 *                       example: 22.5
 *                     status:
 *                       type: string
 *                       example: "completed"
 *                     notes:
 *                       type: string
 *                       example: "Updated notes"
 *                     duration:
 *                      type: integer
 *                      example: 0
 * 
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
 *                   example: "Missing set_id"
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
 *       404:
 *         description: Set not found
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
 *                   example: "Set not found"
 */
async function handlePUT(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { set_id, reps, weight_kg, status, notes, duration } = body;

    if (!set_id) {
      return errorResponse('VALIDATION_ERROR', 'Missing set_id', 400);
    }

    // Verify ownership: set_id -> session_detail_id -> session_id -> user_id
    const { data: exerciseDetail, error: fetchError } = await supabase
      .from('sessions_exercise_details')
      .select('session_detail_id')
      .eq('set_id', set_id)
      .single();

    if (fetchError || !exerciseDetail) {
      return errorResponse('ENTITY_NOT_FOUND', 'Set not found', 404);
    }

    const { data: sessionDetail, error: sdError } = await supabase
      .from('session_details')
      .select('session_id')
      .eq('session_detail_id', exerciseDetail.session_detail_id)
      .single();

    if (sdError || !sessionDetail) {
      return errorResponse('ENTITY_NOT_FOUND', 'Session detail not found', 404);
    }

    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('user_id')
      .eq('session_id', sessionDetail.session_id)
      .single();

    if (sessionError || !session || session.user_id !== user!.userId) {
      return errorResponse('ACCESS_DENIED', 'Insufficient permissions', 403);
    }

    // Build update object
    const updateData: any = {};
    if (reps !== undefined) updateData.reps = reps;
    if (weight_kg !== undefined) updateData.weight_kg = weight_kg;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (duration !== undefined) updateData.duration = duration;

    // Update set
    const { error: updateError } = await supabase
      .from('sessions_exercise_details')
      .update(updateData)
      .eq('set_id', set_id);

    if (updateError) {
      return errorResponse('DATABASE_ERROR', 'Failed to update set', 400);
    }

    return successResponse({ set_id, ...updateData });
  } catch (error) {
    console.error('[PUT /sets] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}

/**
 * @swagger
 * /api/ai/sets:
 *   delete:
 *     summary: Delete exercise sets
 *     description: Delete one or more exercise sets by their IDs. Verifies ownership.
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
 *                 example: [505, 506]
 *     responses:
 *       200:
 *         description: Sets deleted successfully
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
async function handleDELETE(req: NextRequest) {
  const { user, error } = authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Missing or invalid ids array', 400);
    }

    // Verify ownership: All sets must belong to user's sessions
    const { data: sets, error: fetchError } = await supabase
      .from('sessions_exercise_details')
      .select('session_detail_id')
      .in('set_id', ids);

    if (fetchError || !sets) {
      return errorResponse('DATABASE_ERROR', 'Failed to verify ownership', 400);
    }

    const sessionDetailIds = sets.map((s: any) => s.session_detail_id);

    const { data: sessionDetails, error: sdError } = await supabase
      .from('session_details')
      .select('session_id')
      .in('session_detail_id', sessionDetailIds);

    if (sdError || !sessionDetails) {
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

    // Delete sets
    const { error: deleteError } = await supabase
      .from('sessions_exercise_details')
      .delete()
      .in('set_id', ids);

    if (deleteError) {
      return errorResponse('DATABASE_ERROR', 'Failed to delete sets', 400);
    }

    return successResponse({ deleted: ids.length });
  } catch (error) {
    console.error('[DELETE /sets] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', 400);
  }
}

/**
 * Main handlers for /api/ai/sets
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
