import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '../types/auth';

export const generateToken = (id: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'devflow_jwt_secret_dev_only';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id, role }, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

export const sendTokenResponse = (
  user: IUser,
  statusCode: number,
  res: Response,
  message?: string
): void => {
  const token = generateToken(user._id.toString(), user.role);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    ...(message && { message }),
    token, // included for client flexibility if header fallback is needed
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      skills: user.skills,
      availability: user.availability,
      workloadPercent: user.workloadPercent,
      performanceRating: user.performanceRating,
    },
  });
};
