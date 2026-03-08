import { NextRequest } from 'next/server';
import { MetricRepository } from '@/repositories/metric.repository';
import { successResponse, errorResponse } from '@/lib/response';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { 
      age, sex, height_cm, weight_kg, activity_level, 
      body_fat_percentage, is_body_fat_estimated 
    } = body;

    if (!weight_kg) return errorResponse('Weight is required', 400);

    // If some fields are missing, try to get them from the latest metric
    let finalMetrics = { ...body, user_id: user.userId };
    
    if (!age || !sex || !height_cm || !activity_level) {
        const latest = await MetricRepository.getLatestMetric(user.userId);
        if (latest) {
            finalMetrics = {
                ...latest,
                ...body,
                user_id: user.userId
            };
            // Remove metric_id and recorded_at to create a new entry
            delete (finalMetrics as any).metric_id;
            delete (finalMetrics as any).recorded_at;
        }
    }

    const metric = await MetricRepository.addMetric(finalMetrics);

    return successResponse(metric, 'User metrics updated', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
