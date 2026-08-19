import { NextFunction, Request, Response } from 'express';
import { ApiError, errorBody } from '../lib/api-error';
import { logger } from '../lib/logger';

function isHttpError(err: unknown): err is { status: number } {
  return typeof err === 'object' && err !== null && 'status' in err && typeof (err as { status: unknown }).status === 'number';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (err.status >= 500) {
      logger.error({ err }, 'Unhandled server error');
    }
    return res.status(err.status).json(errorBody(err));
  }

  if (isHttpError(err) && err.status === 413) {
    return res.status(413).json(errorBody(new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds the 1mb limit.')));
  }
  if (isHttpError(err) && err.status === 400) {
    return res.status(400).json(errorBody(new ApiError(400, 'INVALID_JSON', 'Request body is not valid JSON.')));
  }

  logger.error({ err }, 'Unhandled server error');
  const fallback = new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
  return res.status(500).json(errorBody(fallback));
}
