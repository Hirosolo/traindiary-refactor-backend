/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify email with code or token
 *     description: Verify a user's email using either a verification code or token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Verification failed
 */
import { NextRequest } from 'next/server';
import { UserRepository } from '@/repositories/user.repository';
import { verifyEmailSchema } from '@/validation/auth.schema';
import { successResponse, errorResponse } from '@/lib/response';
import { fromZodError } from 'zod-validation-error';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = verifyEmailSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = fromZodError(validation.error).message;
      return errorResponse(errorMessage, 400);
    }

    const { code, token } = validation.data;

    const user = token
      ? await UserRepository.findByVerificationToken(token)
      : code
        ? await UserRepository.findByVerificationCode(code)
        : null;

    if (!user) {
      return errorResponse('Invalid verification code or token', 400);
    }

    if (user.verified) {
      return successResponse(null, 'Email already verified', 200);
    }

    if (!user.verification_expires_at || new Date(user.verification_expires_at) < new Date()) {
      await UserRepository.deleteById(user.user_id);
      return errorResponse('Verification expired. Please sign up again.', 400);
    }

    await UserRepository.verifyUser(user.user_id);
    return successResponse(null, 'Email verified successfully', 200);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return errorResponse('Missing verification token', 400);
    }

    const user = await UserRepository.findByVerificationToken(token);
    if (!user) {
      return errorResponse('Invalid verification token', 400);
    }

    if (user.verified) {
      return successResponse(null, 'Email already verified', 200);
    }

    if (!user.verification_expires_at || new Date(user.verification_expires_at) < new Date()) {
      await UserRepository.deleteById(user.user_id);
      return errorResponse('Verification expired. Please sign up again.', 400);
    }

    if (user.verification_token !== token) {
      return errorResponse('Invalid verification token', 400);
    }

    await UserRepository.verifyUser(user.user_id);
    return successResponse(null, 'Email verified successfully', 200);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
