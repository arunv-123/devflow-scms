import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { User } from '../models/userModel';
import { ActivityLogModel } from '../models/activityLogModel';
import { ApiError, asyncHandler } from '../utils/errors';

// @desc    Get all users / team members
// @route   GET /api/users
// @access  Private
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, role } = req.query;
  const filter: any = {};

  if (role && role !== 'All') {
    filter.role = role;
  }

  if (search) {
    const searchRegex = new RegExp(String(search), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { skills: searchRegex },
      { department: searchRegex },
    ];
  }

  const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    users: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      department: u.department,
      skills: u.skills || [],
      assignedProjects: u.assignedProjects || [],
      workloadPercent: u.workloadPercent || 0,
      availability: u.availability || 'Available',
      performanceRating: u.performanceRating || 5.0,
      joinedDate: u.createdAt ? u.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    })),
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      skills: user.skills,
      assignedProjects: user.assignedProjects,
      workloadPercent: user.workloadPercent,
      availability: user.availability,
      performanceRating: user.performanceRating,
    },
  });
});

// @desc    Create new user / team member
// @route   POST /api/users
// @access  Private (Super Admin, Admin, Project Manager)
export const createUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const creator = req.user;
  const { name, email, password, role, department, skills, workloadPercent, availability } = req.body;

  if (!name || !email || !password) {
    throw new ApiError('Name, email, and password are required', 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError('User with this email already exists', 400);
  }

  // RBAC checks
  const requestedRole = role || 'Developer';
  if (creator?.role === 'Project Manager' && requestedRole !== 'Client') {
    throw new ApiError('Project Managers are only authorized to create Client accounts', 403);
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: requestedRole,
    department: department || 'Engineering',
    skills: skills || ['TypeScript', 'React'],
    workloadPercent: workloadPercent !== undefined ? workloadPercent : 0,
    availability: availability || 'Available',
  });

  // Create Activity Log
  await ActivityLogModel.create({
    userName: creator?.name || 'System Admin',
    userAvatar: creator?.avatar || user.avatar,
    action: 'User Created',
    entity: user.name,
    description: `Added ${user.name} (${user.role}) to team directory`,
  });

  res.status(201).json({
    success: true,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      skills: user.skills,
      workloadPercent: user.workloadPercent,
      availability: user.availability,
    },
  });
});

// @desc    Update user profile / skills / workload
// @route   PUT /api/users/:id
// @access  Private (Super Admin, Admin, Self)
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const allowedUpdates = ['name', 'department', 'skills', 'workloadPercent', 'availability', 'performanceRating', 'role'];
  const updateData: any = {};
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      updateData[key] = req.body[key];
    }
  }

  const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
  if (!updatedUser) {
    throw new ApiError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user: {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      department: updatedUser.department,
      skills: updatedUser.skills,
      workloadPercent: updatedUser.workloadPercent,
      availability: updatedUser.availability,
      performanceRating: updatedUser.performanceRating,
    },
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Super Admin, Admin)
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'User removed successfully',
  });
});
