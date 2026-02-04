import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export interface AuthenticatedUser {
  userId: number;
  email: string;
}

/**
 * Extract and validate JWT from Authorization header
 * Zero Trust Rule: user_id comes ONLY from JWT, never from request body
 */
export const validateJWT = (req: NextRequest): AuthenticatedUser | null => {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token) as AuthenticatedUser | null;

  return decoded || null;
};

/**
 * Standard Success Response Envelope
 */
export const successResponse = (
  data: any,
  status: 200 | 201 = 200
): NextResponse => {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
};

/**
 * Standard Error Response Envelope
 */
export const errorResponse = (
  errorCode: string,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 500 = 400
): NextResponse => {
  return NextResponse.json(
    {
      success: false,
      error_code: errorCode,
      message,
    },
    { status }
  );
};

/**
 * Validate JWT and return authenticated user or error response
 */
export const authenticate = (
  req: NextRequest
): { user: AuthenticatedUser; error: null } | { user: null; error: NextResponse } => {
  const user = validateJWT(req);

  if (!user) {
    return {
      user: null,
      error: errorResponse('UNAUTHORIZED', 'Missing or invalid authorization token', 401),
    };
  }

  return { user, error: null };
};

/**
 * Ensure request method is one of the allowed methods
 */
export const validateMethod = (
  req: NextRequest,
  allowedMethods: string[]
): boolean => {
  return allowedMethods.includes(req.method);
};
