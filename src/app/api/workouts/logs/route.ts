/**
 * @swagger
 * tags:
 *   name: Session exercise details
 *   description: Exercise's set management
 */

/**
 * @swagger
 * /api/workouts/logs:
 *   post:
 *     summary: Create an exercise set log
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
 */
import { NextRequest } from 'next/server';
import { WorkoutRepository } from '@/repositories/log.repository';
import { successResponse, errorResponse } from '@/lib/response';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { session_detail_id, userId, ...logData } = body;
    
    // Use userId from body if provided, otherwise use authenticated user's ID
    const targetUserId = userId || user.userId;
    
    const result = await WorkoutRepository.createLog(session_detail_id, logData);
    return successResponse(result, 'Log created', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { log_id, ...logData } = body;
    
    const result = await WorkoutRepository.updateLog(log_id, logData);
    return successResponse(result, 'Log updated');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
