/**
 * @swagger
 * /api/workouts/logs:
 *   post:
 *     summary: Create an exercise set log
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Log created
 *   put:
 *     summary: Update an exercise set log
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Log updated
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
    const { session_detail_id, ...logData } = body;
    
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
