import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { AuthService } from '../services/authService';
import { sendTokenResponse } from '../utils/token';
import { ApiError, asyncHandler } from '../utils/errors';

// @desc    Register / create new user (Admin & Manager Internal Operation)
// @route   POST /api/auth/register
// @access  Private (Super Admin, Admin, Project Manager)
export const register = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const creator = req.user;
  if (!creator) {
    throw new ApiError('Not authorized to perform account creation', 401);
  }

  const requestedRole = req.body.role || 'Developer';

  // Role restriction checks
  if (creator.role === 'Project Manager' && requestedRole !== 'Client') {
    throw new ApiError('Project Managers are only authorized to create Client accounts', 403);
  }

  if (!['Super Admin', 'Admin', 'Project Manager'].includes(creator.role)) {
    throw new ApiError('Your role is not authorized to create user accounts', 403);
  }

  const user = await AuthService.registerUser(req.body);

  res.status(201).json({
    success: true,
    message: 'User account created successfully',
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      skills: user.skills,
      avatar: user.avatar,
    },
  });
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
  res.cookie('token', '', {
    expires: new Date(0),
    httpOnly: true,
    path: '/',
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
