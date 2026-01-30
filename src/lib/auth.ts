import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';

export interface AuthenticatedUser {
  userId: number;
  email: string;
}

export const getAuthUser = (req: NextRequest): AuthenticatedUser | null => {
  const authHeader = req.headers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    .get('authorization');
  
  if (!authHeader) {
     console.log('[AUTH] Missing Authorization header');
     return null;
  }

  if (!authHeader.startsWith('Bearer ')) {
    console.log('[AUTH] Invalid Authorization format:', authHeader.substring(0, 15));
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token) as AuthenticatedUser | null;
  
  if (!decoded) {
    console.log('[AUTH] Token verification failed for token:', token.substring(0, 10) + '...');
  } else {
    console.log('[AUTH] User authenticated:', decoded.userId);
  }
  
  return decoded;
};
