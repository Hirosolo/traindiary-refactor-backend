import { NextRequest } from 'next/server';
import { NutritionService, CalculationMetrics } from '@/services/nutrition.service';
import { successResponse, errorResponse } from '@/lib/response';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body: CalculationMetrics = await req.json();
    
    // Basic validation
    if (!body.age || !body.sex || !body.height_cm || !body.weight_kg || !body.activity_level || !body.goal_type || !body.goal_speed) {
      return errorResponse('Missing required fields for calculation', 400);
    }

    const result = NutritionService.calculateGoal(body);

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
