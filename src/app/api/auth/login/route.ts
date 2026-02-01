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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
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
