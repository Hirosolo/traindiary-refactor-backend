import { NextRequest } from 'next/server';
import { MetricRepository } from '@/repositories/metric.repository';
import { successResponse, errorResponse } from '@/lib/response';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const latest = await MetricRepository.getLatestMetric(user.userId);
    
    return successResponse(latest);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
