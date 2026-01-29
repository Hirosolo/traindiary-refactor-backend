import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';

export interface AuthenticatedUser {
  userId: number;
  email: string;
}

export const getAuthUser = (req: NextRequest): AuthenticatedUser | null => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token) as AuthenticatedUser | null;
  
  return decoded;
};
