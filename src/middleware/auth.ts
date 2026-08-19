import { NextFunction, Request, Response } from 'express';
import { AuthTokenPayload, verifyToken } from '../lib/jwt';
import { ApiError } from '../lib/api-error';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'No token provided.'));
  }

  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHORIZED', 'Token is invalid or expired.'));
  }
}

// Role hierarchy per spec 3.2: each role includes all permissions of the ones before it.
const ROLE_RANK: Record<string, number> = {
  ASSET_VIEWER: 0,
  ASSET_WORKER: 1,
  ASSET_ADMIN: 2,
};

export function requireRole(minRole: keyof typeof ROLE_RANK) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.auth?.role;
    if (!role || ROLE_RANK[role] === undefined || ROLE_RANK[role] < ROLE_RANK[minRole]) {
      return next(new ApiError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }
    next();
  };
}
