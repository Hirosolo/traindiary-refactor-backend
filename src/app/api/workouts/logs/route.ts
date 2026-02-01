/**
 * @swagger
 * tags:
 *   name: Session exercise details
 *   description: Exercise's set management
 */

/**
 * @swagger
 * /api/workouts/logs:
 *   get:
 *     summary: Get exercise set logs
 *     description: Retrieve exercise set logs by session_detail_id or a single set by set_id.
 *     tags: [Session exercise details]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_detail_id:
 *                 type: integer
 *                 description: Return all sets for a session detail
 *                 example: 247
 *               set_id:
 *                 type: integer
 *                 description: Return a single set by ID
 *                 example: 130
 *               userId:
 *                 type: integer
 *                 description: Optional user ID (if not provided, uses authenticated user)
 *                 example: 14
 *     responses:
 *       200:
 *         description: Log(s) retrieved successfully
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
 *                   oneOf:
 *                     - type: object
 *                       properties:
 *                         set_id:
 *                           type: integer
 *                           example: 130
 *                         session_detail_id:
 *                           type: integer
 *                           example: 247
 *                         reps:
 *                           type: integer
 *                           example: 3
 *                         weight_kg:
 *                           type: number
 *                           example: 3
 *                         notes:
 *                           type: string
 *                           example: string
 *                         status:
 *                           type: string
 *                           enum: [COMPLETED, UNFINISHED]
 *                           example: COMPLETED
 *                         duration:
 *                           type: integer
 *                           example: 0
 *                     - type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           set_id:
 *                             type: integer
 *                             example: 130
 *                           session_detail_id:
 *                             type: integer
 *                             example: 247
 *                           reps:
 *                             type: integer
 *                             example: 3
 *                           weight_kg:
 *                             type: number
 *                             example: 3
 *                           notes:
 *                             type: string
 *                             example: string
 *                           status:
 *                             type: string
 *                             enum: [COMPLETED, UNFINISHED]
 *                             example: COMPLETED
 *                           duration:
 *                             type: integer
 *                             example: 0
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: session_detail_id or set_id is required
 *   post:
 *     summary: Create an exercise set log
 *     description: Create a new exercise set for a session detail. For cardio exercises, provide duration instead of reps.
 *     tags: [Session exercise details]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_detail_id]
 *             properties:
 *               session_detail_id:
 *                 type: integer
 *                 example: 247
 *               userId:
 *                 type: integer
 *                 description: Optional user ID (if not provided, uses authenticated user)
 *                 example: 14
 *               actual_reps:
 *                 type: integer
 *                 example: 3
 *               weight_kg:
 *                 type: number
 *                 example: 3
 *               duration:
 *                 type: integer
 *                 example: 0
 *               status:
 *                 type: string
 *                 enum: [COMPLETED, UNFINISHED]
 *                 example: COMPLETED
 *               notes:
 *                 type: string
 *                 example: string
 *     responses:
 *       201:
 *         description: Log created successfully
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
 *                   example: Log created
 *                 data:
 *                   type: object
 *                   properties:
 *                     set_id:
 *                       type: integer
 *                       example: 130
 *                     session_detail_id:
 *                       type: integer
 *                       example: 247
 *                     reps:
 *                       type: integer
 *                       example: 3
 *                     weight_kg:
 *                       type: number
 *                       example: 3
 *                     notes:
 *                       type: string
 *                       example: string
 *                     status:
 *                       type: string
 *                       enum: [COMPLETED, UNFINISHED]
 *                       example: COMPLETED
 *                     duration:
 *                       type: integer
 *                       example: 0
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update an exercise set log
 *     description: Update an existing exercise set by log_id. For cardio exercises, update duration instead of reps.
 *     tags: [Session exercise details]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [log_id]
 *             properties:
 *               log_id:
 *                 type: integer
 *                 example: 130
 *               userId:
 *                 type: integer
 *                 description: Optional user ID (if not provided, uses authenticated user)
 *                 example: 14
 *               actual_reps:
 *                 type: integer
 *                 example: 3
 *               weight_kg:
 *                 type: number
 *                 example: 3
 *               duration:
 *                 type: integer
 *                 example: 0
 *               status:
 *                 type: string
 *                 enum: [COMPLETED, UNFINISHED]
 *                 example: COMPLETED
 *               notes:
 *                 type: string
 *                 example: string
 *     responses:
 *       200:
 *         description: Log updated successfully
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
 *                   example: Log updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     set_id:
 *                       type: integer
 *                       example: 130
 *                     session_detail_id:
 *                       type: integer
 *                       example: 247
 *                     reps:
 *                       type: integer
 *                       example: 3
 *                     weight_kg:
 *                       type: number
 *                       example: 3
 *                     notes:
 *                       type: string
 *                       example: string
 *                     status:
 *                       type: string
 *                       enum: [COMPLETED, UNFINISHED]
 *                       example: COMPLETED
 *                     duration:
 *                       type: integer
 *                       example: 0
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete an exercise set log
 *     description: Delete an exercise set by set_id.
 *     tags: [Session exercise details]
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
 *                 example: 130
 *               userId:
 *                 type: integer
 *                 description: Optional user ID (if not provided, uses authenticated user)
 *                 example: 14
 *     responses:
 *       200:
 *         description: Log deleted successfully
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
 *                     message:
 *                       type: string
 *                       example: Log deleted
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
import { NextRequest } from 'next/server';
import { WorkoutRepository } from '@/repositories/log.repository';
import { successResponse, errorResponse } from '@/lib/response';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_detail_id, userId, ...logData } = body;
    const authUser = getAuthUser(req);
    const targetUserId = userId ?? authUser?.userId;
    if (!targetUserId) return errorResponse('Unauthorized', 401);

    const sessionDetailId = Number(session_detail_id);
    if (Number.isNaN(sessionDetailId)) {
      return errorResponse('session_detail_id is required', 400);
    }
    
    const result = await WorkoutRepository.createLog(sessionDetailId, logData, targetUserId);
    return successResponse(result, 'Log created', 201);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return errorResponse('Unauthorized', 401);
    return errorResponse(error.message, 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const { session_detail_id, set_id, userId } = body || {};
    const authUser = getAuthUser(req);
    const targetUserId = userId ?? authUser?.userId;
    if (!targetUserId) return errorResponse('Unauthorized', 401);

    if (!session_detail_id && !set_id) {
      return errorResponse('session_detail_id or set_id is required', 400);
    }

    if (set_id) {
      const setId = Number(set_id);
      if (Number.isNaN(setId)) return errorResponse('Invalid set_id', 400);
      const result = await WorkoutRepository.getLogBySetId(setId, targetUserId);
      return successResponse(result);
    }

    const sessionDetailId = Number(session_detail_id);
    if (Number.isNaN(sessionDetailId)) return errorResponse('Invalid session_detail_id', 400);
    const result = await WorkoutRepository.getLogsBySessionDetailId(sessionDetailId, targetUserId);
    return successResponse(result);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return errorResponse('Unauthorized', 401);
    return errorResponse(error.message, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { log_id, userId, ...logData } = body;
    const authUser = getAuthUser(req);
    const targetUserId = userId ?? authUser?.userId;
    if (!targetUserId) return errorResponse('Unauthorized', 401);

    const logId = Number(log_id);
    if (Number.isNaN(logId)) return errorResponse('log_id is required', 400);
    
    const result = await WorkoutRepository.updateLog(logId, logData, targetUserId);
    return successResponse(result, 'Log updated');
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return errorResponse('Unauthorized', 401);
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { set_id, userId } = body;
    const authUser = getAuthUser(req);
    const targetUserId = userId ?? authUser?.userId;
    if (!targetUserId) return errorResponse('Unauthorized', 401);

    const setId = Number(set_id);
    if (Number.isNaN(setId)) return errorResponse('set_id is required', 400);

    await WorkoutRepository.deleteLog(setId, targetUserId);
    return successResponse({ message: 'Log deleted' });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return errorResponse('Unauthorized', 401);
    return errorResponse(error.message, 500);
  }
}
