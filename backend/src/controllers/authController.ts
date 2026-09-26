import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { AuthService } from '../services/authService';
import { sendTokenResponse } from '../utils/token';
import { asyncHandler } from '../utils/errors';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await AuthService.registerUser(req.body);
  sendTokenResponse(user, 201, res, 'User registered successfully');
});

// @desc    Login user & set JWT in HttpOnly cookie
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await AuthService.loginUser(req.body);
  sendTokenResponse(user, 200, res, 'Logged in successfully');
});

// @desc    Logout user / clear HttpOnly cookie
// @route   POST /api/auth/logout
// @access  Private / Public
export const logout = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
});

// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  res.status(200).json({
    success: true,
    user: {
      id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      department: req.user.department,
      skills: req.user.skills,
      availability: req.user.availability,
      workloadPercent: req.user.workloadPercent,
      performanceRating: req.user.performanceRating,
      createdAt: req.user.createdAt,
    },
  });
});

// @desc    Test RBAC endpoint reserved for Admins
// @route   GET /api/auth/admin-only
// @access  Private (Admin / Super Admin only)
export const adminOnlyTest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: `Access granted for role '${req.user?.role}'. Welcome to Admin Protected Route.`,
    user: {
      id: req.user?._id.toString(),
      name: req.user?.name,
      role: req.user?.role,
    },
  });
});
