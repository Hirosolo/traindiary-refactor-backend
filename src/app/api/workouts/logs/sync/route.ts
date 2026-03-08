import { NextRequest } from 'next/server';
import { WorkoutRepository } from '@/repositories/log.repository';
import { successResponse, errorResponse } from '@/lib/response';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { logs, userId } = body;
    
    if (!Array.isArray(logs)) {
      return errorResponse('logs must be an array', 400);
    }

    const authUser = getAuthUser(req);
    const targetUserId = userId ?? authUser?.userId;
    if (!targetUserId) return errorResponse('Unauthorized', 401);

    const result = await WorkoutRepository.upsertLogs(logs, targetUserId);
    return successResponse(result, 'Logs synced successfully');
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return errorResponse('Unauthorized', 401);
    console.error('[Sync Logs Error]', error);
    return errorResponse(error.message, 500);
  }
}
