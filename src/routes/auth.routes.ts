import { Router } from 'express';
import { ApiError } from '../lib/api-error';
import { login } from '../services/auth.service';

export const authRouter = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};

    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new ApiError(400, 'INVALID_REQUEST', 'username and password are required.');
    }

    const result = await login(username, password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
