export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown[];

  constructor(status: number, code: string, message: string, details?: unknown[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function errorBody(err: ApiError) {
  return {
    error: {
      code: err.code,
      message: err.message,
      status: err.status,
      ...(err.details ? { details: err.details } : {}),
    },
  };
}
