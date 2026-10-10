import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error(`[Server Error] ${statusCode} - ${message} [${req.method} ${req.originalUrl}]`);
  } else if (statusCode === 401) {
    // Routine unauthenticated check on /api/auth/me (SPA checking if session exists) is expected
    if (req.originalUrl !== '/api/auth/me') {
      console.warn(`[Auth Warning] 401 - ${message} [${req.method} ${req.originalUrl}]`);
    }
  } else {
    console.warn(`[Client Warning] ${statusCode} - ${message} [${req.method} ${req.originalUrl}]`);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
