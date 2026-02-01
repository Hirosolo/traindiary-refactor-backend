/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email, password, full name, and phone number. Returns verification code and JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullname, email, phone, password]
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: user1@gmail.com
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: User registered successfully
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
 *                         fullname:
 *                           type: string
 *                           example: John Doe
 *                         phone:
 *                           type: string
 *                           example: 1234567890
 *                     verificationCode:
 *                       type: string
 *                       description: 6-digit verification code for email verification
 *                       example: 123456
 *                     token:
 *                       type: string
 *                       description: JWT access token
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     verificationRequired:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Validation error or user already exists
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
 *                   example: User already exists with this email
 *                 errors:
 *                   nullable: true
 *                   example: null
 */
import { NextRequest } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { signupSchema } from '@/validation/auth.schema';
import { successResponse, errorResponse } from '@/lib/response';
import { fromZodError } from 'zod-validation-error';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validation
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = fromZodError(validation.error).message;
      return errorResponse(errorMessage, 400);
    }

    const result = await AuthService.signup(validation.data);
    return successResponse(result, 'User registered successfully', 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
