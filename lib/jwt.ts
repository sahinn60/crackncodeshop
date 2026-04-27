import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

export interface JwtPayload {
  id: string;
  role: string;
  permissions?: string[];
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '15m' });
}

export function signRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}
