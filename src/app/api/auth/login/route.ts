/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate a user using email and password and return an access token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user1@gmail.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         email:
 *                           type: string
 *                           example: user1@gmail.com
 *                     token:
 *                       type: string
 *                       description: JWT access token
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid email or password
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
 *                   example: Invalid email or password
 *                 errors:
 *                   nullable: true
 *                   example: null
 */

import { NextRequest } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { loginSchema } from '@/validation/auth.schema';
import { successResponse, errorResponse } from '@/lib/response';
import { fromZodError } from 'zod-validation-error';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validation
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = fromZodError(validation.error).message;
      return errorResponse(errorMessage, 400);
    }

    const result = await AuthService.login(validation.data);
    return successResponse(result, 'Login successful', 200);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
