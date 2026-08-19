import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.routes';
import { assetRouter } from './routes/assets.routes';
import { errorHandler } from './middleware/error-handler';
import { ApiError } from './lib/api-error';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === 'production'
          ? (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean)
          : true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, _res, next) => {
        next(new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.'));
      },
    })
  );

  app.use('/api/auth', authRouter);
  app.use('/api/assets', assetRouter);

  app.use((_req, _res, next) => {
    next(new ApiError(404, 'NOT_FOUND', 'Resource not found.'));
  });

  app.use(errorHandler);

  return app;
}
