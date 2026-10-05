import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel';
import { AuthRequest, JwtPayload, UserRole } from '../types/auth';
import { ApiError, asyncHandler } from '../utils/errors';

// Protect routes - verify JWT token
export const protect = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    // Check cookies first (HttpOnly cookie)
    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Fallback to Bearer header
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new ApiError('Not authorized to access this route. Token missing.', 401));
    }

    try {
      const secret = process.env.JWT_SECRET || 'devflow_jwt_secret_dev_only';
      const decoded = jwt.verify(token, secret) as JwtPayload;

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        _res.cookie('token', '', { expires: new Date(0), httpOnly: true, path: '/' });
        return next(new ApiError('User belonging to this token no longer exists.', 401));
      }

      req.user = user;
      next();
    } catch (err) {
      _res.cookie('token', '', { expires: new Date(0), httpOnly: true, path: '/' });
      return next(new ApiError('Not authorized to access this route. Invalid or expired token.', 401));
    }
  }
);

// Grant access to specific roles (RBAC)
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError('User not authenticated.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          `User role '${req.user.role}' is not authorized to perform this action.`,
          403
        )
      );
    }

    next();
  };
};
