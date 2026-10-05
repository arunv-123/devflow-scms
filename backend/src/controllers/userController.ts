import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { User } from '../models/userModel';
import { Project } from '../models/projectModel';
import { ActivityLogModel } from '../models/activityLogModel';
import { InvitationService } from '../services/invitationService';
import { ApiError, asyncHandler } from '../utils/errors';

// @desc    Get all users / team members
// @route   GET /api/users
// @access  Private (Internal roles only; Client forbidden)
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUser = req.user!;
  if (currentUser.role === 'Client') {
    throw new ApiError("Role 'Client' is not authorised to access the team directory.", 403);
  }

  const { search, role, status } = req.query;
  const filter: any = {};

  if (role && role !== 'All') {
    filter.role = role;
  } else {
    // Exclude external Client accounts from internal team directory / resource utilization matrix
    filter.role = { $ne: 'Client' };
  }

  if (status && status !== 'All') {
    filter.status = status;
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

  const [users, allProjects] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }),
    Project.find().select('members manager name'),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    users: users.map((u) => {
      const userIdStr = u._id.toString();
      const userProjects = allProjects.filter((p) => {
        const isManager = p.manager && (p.manager.id === userIdStr || p.manager.email === u.email);
        const isMember = Array.isArray(p.members) && p.members.some((m: any) => m.id === userIdStr || m.email === u.email);
        return isManager || isMember;
      });

      const liveAssignedProjects = userProjects.map((p) => p._id);
      const assignedProjects = liveAssignedProjects.length > 0 ? liveAssignedProjects : (u.assignedProjects || []);

      return {
        id: userIdStr,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        department: u.department,
        skills: u.skills || [],
        assignedProjects,
        workloadPercent: u.workloadPercent || 0,
        availability: u.availability || 'Available',
        status: u.status || 'active',
        performanceRating: u.performanceRating || 5.0,
        joinedDate: u.createdAt ? u.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      };
    }),
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Internal roles only; Client forbidden)
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUser = req.user!;
  if (currentUser.role === 'Client') {
    throw new ApiError("Role 'Client' is not authorised to access the team directory.", 403);
  }

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
      status: user.status || 'active',
      performanceRating: user.performanceRating,
    },
  });
});

// @desc    Invite/Create user via Onboarding Flow
// @route   POST /api/users
// @access  Private (Super Admin, Admin, Project Manager)
export const createUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError('Not authenticated', 401);
  }

  const result = await InvitationService.inviteUser(req.user, req.body);

  res.status(201).json({
    success: true,
    message: `Invitation sent to ${result.user.email}`,
    user: result.user,
    invitationUrl: result.invitationUrl,
    expiresAt: result.expiresAt,
  });
});

// @desc    Update user profile / skills / workload / role / status
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUser = req.user!;
  const isSelf = currentUser._id.toString() === req.params.id;

  if (!isSelf && currentUser.role === 'Client') {
    throw new ApiError("Role 'Client' is not authorised to access user management.", 403);
  }

  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    throw new ApiError('User not found', 404);
  }

  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isAdmin = currentUser.role === 'Admin';
  const isAdminOrSuperAdmin = isSuperAdmin || isAdmin;

  // 1. Permission check to edit: Must be Self, Admin, or Super Admin
  if (!isSelf && !isAdminOrSuperAdmin) {
    throw new ApiError('Not authorized to update this user profile', 403);
  }

  // 2. Admin cannot modify a Super Admin user
  if (isAdmin && !isSelf && targetUser.role === 'Super Admin') {
    throw new ApiError('Admins cannot modify Super Admin accounts', 403);
  }

  // 3. Role modification security checks
  if (req.body.role !== undefined && req.body.role !== targetUser.role) {
    if (isSelf) {
      throw new ApiError('Users cannot change their own role', 403);
    }
    if (!isAdminOrSuperAdmin) {
      throw new ApiError('Not authorized to modify user roles', 403);
    }
    if (isAdmin && req.body.role === 'Super Admin') {
      throw new ApiError('Admins cannot elevate accounts to Super Admin', 403);
    }
    if (targetUser.role === 'Super Admin' && req.body.role !== 'Super Admin') {
      const superAdminCount = await User.countDocuments({ role: 'Super Admin', status: { $ne: 'disabled' } });
      if (superAdminCount <= 1) {
        throw new ApiError('Cannot demote the last Super Admin account', 400);
      }
    }
  }

  // 4. Status modification security checks (disable/enable)
  if (req.body.status !== undefined && req.body.status !== targetUser.status) {
    if (isSelf && req.body.status === 'disabled') {
      throw new ApiError('Users cannot disable their own account', 403);
    }
    if (!isAdminOrSuperAdmin) {
      throw new ApiError('Not authorized to modify user status', 403);
    }
    if (targetUser.role === 'Super Admin' && req.body.status === 'disabled') {
      const superAdminCount = await User.countDocuments({ role: 'Super Admin', status: 'active' });
      if (superAdminCount <= 1) {
        throw new ApiError('Cannot disable the last active Super Admin account', 400);
      }
    }
  }

  const allowedUpdates = ['name', 'avatar', 'department', 'skills', 'workloadPercent', 'availability', 'performanceRating', 'role', 'status'];
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
      status: updatedUser.status || 'active',
      performanceRating: updatedUser.performanceRating,
    },
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Super Admin, Admin)
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUser = req.user!;
  if (!['Super Admin', 'Admin'].includes(currentUser.role)) {
    throw new ApiError('Not authorized to delete user accounts', 403);
  }

  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    throw new ApiError('User not found', 404);
  }

  if (currentUser.role === 'Admin' && targetUser.role === 'Super Admin') {
    throw new ApiError('Admins are not authorized to delete Super Admin accounts', 403);
  }

  if (targetUser.role === 'Super Admin') {
    const superAdminCount = await User.countDocuments({ role: 'Super Admin' });
    if (superAdminCount <= 1) {
      throw new ApiError('Cannot delete the last Super Admin account', 400);
    }
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'User removed successfully',
  });
});
