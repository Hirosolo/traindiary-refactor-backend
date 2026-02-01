/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
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
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
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
