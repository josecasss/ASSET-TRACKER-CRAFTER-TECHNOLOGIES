import jwt from 'jsonwebtoken';

export interface AuthTokenPayload {
  userId: number;
  username: string;
  role: string;
  companyCode: string;
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET: string = process.env.JWT_SECRET;

const TOKEN_EXPIRY_SECONDS = 8 * 60 * 60; // 8 hours, per spec section 3.1

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: TOKEN_EXPIRY_SECONDS,
  });
}

// Algorithm is pinned to HS256 here so a token's own `alg` header is never trusted (spec 3.3).
export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as AuthTokenPayload;
}

export const TOKEN_EXPIRY = TOKEN_EXPIRY_SECONDS;
