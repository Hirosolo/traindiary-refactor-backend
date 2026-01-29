/**
 * @swagger
 * /api/summary:
 *   get:
 *     summary: Get dashboard summary
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary data
 */
import { NextRequest } from 'next/server';
import { ProgressRepository } from '@/repositories/progress.repository';
import { successResponse, errorResponse } from '@/lib/response';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const searchParams = req.nextUrl.searchParams;
    const periodType = (searchParams.get('period_type') as 'weekly' | 'monthly') || 'weekly';
    const periodStart = searchParams.get('period_start') || undefined;

    const summary = await ProgressRepository.getSummary(user.userId, periodType === 'weekly' ? 'weekly' : 'monthly', periodStart);
    
    return successResponse(summary);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
