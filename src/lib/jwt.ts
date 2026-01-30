import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
console.log('[JWT] Loaded secret:', JWT_SECRET === 'fallback-secret-for-dev' ? 'using fallback' : 'using from env', '(length:' + JWT_SECRET.length + ')');

export const signToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
