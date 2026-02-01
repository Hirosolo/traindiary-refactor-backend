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
 *         description: Email verified successfully
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
 *                   example: Email verified successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 14
 *                         email:
 *                           type: string
 *                           example: user1@gmail.com
 *                     token:
 *                       type: string
 *                       description: JWT access token
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Verification failed - invalid code/token or expired
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
 *                   example: Invalid verification code or token
 *                 errors:
 *                   nullable: true
 *                   example: null
 *   get:
 *     summary: Verify email with token via URL
 *     description: Verify a user's email using a token passed as a query parameter.
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         example: abc123def456...
 *     responses:
 *       200:
 *         description: Email verified successfully
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
 *                   example: Email verified successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 14
 *                         email:
 *                           type: string
 *                           example: user1@gmail.com
 *                     token:
 *                       type: string
 *                       description: JWT access token
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Verification failed - invalid or expired token
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
 *                   example: Invalid verification token
 *                 errors:
 *                   nullable: true
 *                   example: null
 */
import { NextRequest } from 'next/server';
import { UserRepository } from '@/repositories/user.repository';
import { verifyEmailSchema } from '@/validation/auth.schema';
import { successResponse, errorResponse } from '@/lib/response';
import { fromZodError } from 'zod-validation-error';
import { signToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validation = verifyEmailSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = fromZodError(validation.error).message;
      return errorResponse(errorMessage, 400);
    }

    const { code, token: verificationTokenParam } = validation.data;

    const user = verificationTokenParam
      ? await UserRepository.findByVerificationToken(verificationTokenParam)
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
    const token = signToken({ userId: user.user_id, email: user.email });
    return successResponse(
      {
        user: {
          id: user.user_id,
          email: user.email,
        },
        token,
      },
      'Email verified successfully',
      200
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const verificationToken = req.nextUrl.searchParams.get('token');
    if (!verificationToken) {
      return errorResponse('Missing verification token', 400);
    }

    const user = await UserRepository.findByVerificationToken(verificationToken);
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

    if (user.verification_token !== verificationToken) {
      return errorResponse('Invalid verification token', 400);
    }

    await UserRepository.verifyUser(user.user_id);
    const token = signToken({ userId: user.user_id, email: user.email });
    return successResponse(
      {
        user: {
          id: user.user_id,
          email: user.email,
        },
        token,
      },
      'Email verified successfully',
      200
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
