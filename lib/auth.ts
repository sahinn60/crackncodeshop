import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JwtPayload } from './jwt';

export function getAuthUser(req: NextRequest): JwtPayload | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

export function requireAuth(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  return { error: null, user };
}

export function requireAdmin(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return { error, user: null };
  if (user!.role !== 'ADMIN') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), user: null };
  return { error: null, user };
}

export function requireAdminOrSubAdmin(req: NextRequest, permission?: string) {
  const { error, user } = requireAuth(req);
  if (error) return { error, user: null };
  if (user!.role === 'ADMIN') return { error: null, user };
  if (user!.role === 'SUB_ADMIN') {
    if (permission && !user!.permissions?.includes(permission)) {
      return { error: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }), user: null };
    }
    return { error: null, user };
  }
  return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), user: null };
}
