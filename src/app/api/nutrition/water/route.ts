import { NextRequest } from 'next/server';
import { WaterRepository } from '@/repositories/water.repository';
import { successResponse, errorResponse } from '@/lib/response';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const data = await WaterRepository.getDailyLogs(user.userId, date);
    
    return successResponse(data);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { amount_ml, date } = body;

    if (!amount_ml) return errorResponse('Amount in ml is required', 400);

    const log = await WaterRepository.addWater({
      user_id: user.userId,
      amount_ml,
      log_date: date || new Date().toISOString().split('T')[0]
    });

    return successResponse(log, 'Water intake logged', 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const logId = req.nextUrl.searchParams.get('id');
    if (!logId) return errorResponse('Log ID is required', 400);

    await WaterRepository.deleteWater(Number(logId), user.userId);
    
    return successResponse(null, 'Water log deleted');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
