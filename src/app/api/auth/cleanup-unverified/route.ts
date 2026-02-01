import { successResponse, errorResponse } from '@/lib/response';
import { UserRepository } from '@/repositories/user.repository';

export async function POST() {
  try {
    const nowIso = new Date().toISOString();
    const deletedCount = await UserRepository.deleteUnverifiedExpired(nowIso);
    return successResponse({ deleted: deletedCount }, 'Cleanup completed', 200);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
