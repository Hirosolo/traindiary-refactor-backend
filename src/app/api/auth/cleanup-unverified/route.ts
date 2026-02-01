/**
 * @swagger
 * /api/auth/cleanup-unverified:
 *   post:
 *     summary: Clean up expired unverified user accounts
 *     description: Delete all user accounts that have not been verified and whose verification period has expired.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cleanup completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted:
 *                       type: integer
 *                       description: Number of expired unverified accounts deleted
 *                       example: 5
 *       500:
 *         description: Server error during cleanup
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 *                 errors:
 *                   nullable: true
 *                   example: null
 */
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
