/**
 * @swagger
 * /api/workouts/{id}/session-details:
@@   delete:
@@     summary: Delete an exercise from a workout session
@@     tags: [Session details]
@@     security:
@@       - bearerAuth: []
@@     parameters:
@@       - in: path
@@         name: id
@@         required: true
@@         schema:
@@           type: integer
@@         description: The workout session ID
@@     requestBody:
@@       required: true
@@       content:
@@         application/json:
@@           schema:
@@             type: object
@@             required: [session_detail_id]
@@             properties:
@@               session_detail_id:
@@                 type: integer
@@                 description: The session detail ID to delete
@@     responses:
@@       200:
@@         description: Exercise deleted from session
@@       400:
@@         description: Invalid request
@@       401:
@@         description: Unauthorized
@@       404:
@@         description: Session detail not found
 *   post:
 *     summary: Add exercises to an existing workout session
 *     tags: [Session details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The workout session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [exercises]
 *             properties:
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [exercise_id, planned_sets, planned_reps]
 *                   properties:
 *                     exercise_id:
 *                       type: integer
 *                     planned_sets:
 *                       type: integer
 *                     planned_reps:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Exercises added to session
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 */
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { getAuthUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { id } = await params;
    const sessionId = parseInt(id);
    if (isNaN(sessionId)) {
      return errorResponse('Invalid session ID', 400);
    }

    // Verify session exists and belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('session_id')
      .eq('session_id', sessionId)
      .eq('user_id', user.userId)
      .single();

    if (sessionError || !session) {
      return errorResponse('Workout session not found', 404);
    }

    const body = await req.json();
    const { exercises } = body;

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return errorResponse('exercises array is required', 400);
    }

    // Validate exercise data
    for (const ex of exercises) {
      if (!ex.exercise_id || !ex.planned_sets || !ex.planned_reps) {
        return errorResponse('Each exercise must have exercise_id, planned_sets, and planned_reps', 400);
      }
    }

    // Add each exercise to the session as session_details
    const addedDetails = [];
    
    for (const ex of exercises) {
      const exerciseId = Number(ex.exercise_id);
      const plannedSets = Number(ex.planned_sets);
      const plannedReps = Number(ex.planned_reps);

      // Check if this exercise already exists in the session
      const { data: existingDetail } = await supabase
        .from('session_details')
        .select('session_detail_id')
        .eq('session_id', sessionId)
        .eq('exercise_id', exerciseId)
        .single();

      // Skip if exercise already exists in this session
      if (existingDetail) {
        continue;
      }

      // Create session_detail entry
      const { data: detail, error: detailError } = await supabase
        .from('session_details')
        .insert([{
          session_id: sessionId,
          exercise_id: exerciseId,
          status: 'UNFINISHED'
        }])
        .select()
        .single();

      if (detailError) {
        console.error('Error creating session detail:', detailError);
        throw new Error(detailError.message);
      }

      // Create empty set rows for planned sets
      const setInserts = [];
      for (let i = 0; i < plannedSets; i++) {
        setInserts.push({
          session_detail_id: detail.session_detail_id,
          reps: plannedReps,
          weight_kg: 0,
          status: 'UNFINISHED',
          notes: null
        });
      }

      const { error: setError } = await supabase
        .from('sessions_exercise_details')
        .insert(setInserts);

      if (setError) {
        console.error('Error creating exercise sets:', setError);
        throw new Error(setError.message);
      }

      addedDetails.push(detail);
    }

    return successResponse(
      { 
        session_id: sessionId,
        added_exercises: addedDetails.length,
        details: addedDetails 
      },
      `Successfully added ${addedDetails.length} exercise(s) to the session`,
      201
    );
  } catch (error: any) {
    console.error('Error adding exercises to session:', error);
    return errorResponse(error.message || 'Failed to add exercises', 500);
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
      const sessionId = parseInt(id);
      if (isNaN(sessionId)) {
        return errorResponse('Invalid session ID', 400);
      }

      const body = await req.json();
      const { session_detail_id } = body;

      if (!session_detail_id) {
        return errorResponse('session_detail_id is required', 400);
      }

      const sessionDetailId = Number(session_detail_id);

      // Verify the session_detail belongs to this session and user owns the session
      const { data: sessionDetail, error: verifyError } = await supabase
        .from('session_details')
        .select('session_id, session:workout_sessions(user_id)')
        .eq('session_detail_id', sessionDetailId)
        .single();

      if (verifyError || !sessionDetail) {
        return errorResponse('Session detail not found', 404);
      }

      // Check if user owns the session
      if ((sessionDetail.session as any).user_id !== user.userId) {
        return errorResponse('Unauthorized', 403);
      }

      // Check if session_detail belongs to the specified session
      if (sessionDetail.session_id !== sessionId) {
        return errorResponse('Session detail does not belong to this session', 400);
      }

      // Delete all exercise sets (sessions_exercise_details) first due to foreign key
      const { error: setsError } = await supabase
        .from('sessions_exercise_details')
        .delete()
        .eq('session_detail_id', sessionDetailId);

      if (setsError) {
        console.error('Error deleting exercise sets:', setsError);
        throw new Error(setsError.message);
      }

      // Then delete the session_detail
      const { error: detailError } = await supabase
        .from('session_details')
        .delete()
        .eq('session_detail_id', sessionDetailId);

      if (detailError) {
        console.error('Error deleting session detail:', detailError);
        throw new Error(detailError.message);
      }

      return successResponse(
        { session_detail_id: sessionDetailId },
        'Exercise deleted from session successfully'
      );
    } catch (error: any) {
      console.error('Error deleting exercise from session:', error);
      return errorResponse(error.message || 'Failed to delete exercise', 500);
    }
  }
