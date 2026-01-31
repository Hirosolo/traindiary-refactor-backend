import { NextRequest } from 'next/server';
import { ExerciseRepository } from '@/repositories/master.repository';
import { exerciseSchema } from '@/validation/master.schema';
import { successResponse, errorResponse } from '@/lib/response';
import { fromZodError } from 'zod-validation-error';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exerciseId = parseInt(id);
    const exercise = await ExerciseRepository.findById(exerciseId);
    if (!exercise) return errorResponse('Exercise not found', 404);
    return successResponse(exercise);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { id } = await params;
    const exerciseId = parseInt(id);
    const body = await req.json();
    const validation = exerciseSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(fromZodError(validation.error).message);
    }

    const exercise = await ExerciseRepository.update(exerciseId, validation.data);
    if (!exercise) return errorResponse('Exercise not found', 404);
    return successResponse(exercise, 'Exercise updated successfully');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { id } = await params;
    const exerciseId = parseInt(id);
    const deleted = await ExerciseRepository.delete(exerciseId);
    if (!deleted) return errorResponse('Exercise not found', 404);
    return successResponse(null, 'Exercise deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}