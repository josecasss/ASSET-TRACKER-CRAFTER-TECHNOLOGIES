import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/api-error';
import { signToken, TOKEN_EXPIRY } from '../lib/jwt';

export interface LoginResult {
  token: string;
  expiresIn: number;
  user: {
    userId: number;
    username: string;
    role: string;
    companyCode: string;
  };
}

// Used to run bcrypt.compare on the unknown-user path too, so response timing doesn't
// reveal whether a username exists.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

export async function login(username: string, password: string): Promise<LoginResult> {
  const user = username ? await prisma.user.findUnique({ where: { username } }) : null;

  const passwordMatches = await bcrypt.compare(password ?? '', user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordMatches) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid username or password.');
  }

  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    companyCode: user.companyCode,
  };

  return {
    token: signToken(payload),
    expiresIn: TOKEN_EXPIRY,
    user: payload,
  };
}
