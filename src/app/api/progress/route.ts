/**
 * @swagger
 * /api/progress:
 *   get:
 *     summary: Get user progress summary
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress summary data
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
    const period = (searchParams.get('period') as 'weekly' | 'monthly') || 'weekly';

    const summary = await ProgressRepository.getSummary(user.userId, period);
    return successResponse(summary);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
