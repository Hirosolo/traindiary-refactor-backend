import { NextRequest } from 'next/server';
import { FoodRepository } from '@/repositories/master.repository';
import { foodSchema } from '@/validation/master.schema';
import { successResponse, errorResponse } from '@/lib/response';
import { fromZodError } from 'zod-validation-error';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const foodId = parseInt(params.id);
    const food = await FoodRepository.findById(foodId);
    if (!food) return errorResponse('Food not found', 404);
    return successResponse(food);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const foodId = parseInt(params.id);
    const body = await req.json();
    const validation = foodSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(fromZodError(validation.error).message);
    }

    const food = await FoodRepository.update(foodId, validation.data);
    if (!food) return errorResponse('Food not found', 404);
    return successResponse(food, 'Food updated successfully');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const foodId = parseInt(params.id);
    const deleted = await FoodRepository.delete(foodId);
    if (!deleted) return errorResponse('Food not found', 404);
    return successResponse(null, 'Food deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
