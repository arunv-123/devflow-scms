import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { InvitationService } from '../services/invitationService';
import { ApiError, asyncHandler } from '../utils/errors';

// @desc    Invite user to workspace
// @route   POST /api/invitations / POST /api/users/invite
// @access  Private (Super Admin, Admin, Project Manager)
export const inviteUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError('Not authenticated', 401);
  }

  const result = await InvitationService.inviteUser(req.user, req.body);

  res.status(201).json({
    success: true,
    message: `Invitation generated for ${result.user.email}`,
    user: result.user,
    invitationUrl: result.invitationUrl,
    expiresAt: result.expiresAt,
  });
});

// @desc    Validate invitation token
// @route   GET /api/invitations/:token
// @access  Public
export const validateInvitationToken = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const token = String(req.params.token);
  const result = await InvitationService.validateToken(token);

  res.status(200).json({
    success: true,
    invitation: result,
  });
});

// @desc    Accept invitation & set user password
// @route   POST /api/invitations/accept
// @access  Public
export const acceptInvitation = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await InvitationService.acceptInvitation(req.body);

  res.status(200).json(result);
});

// @desc    Resend invitation for pending user
// @route   POST /api/users/:id/resend-invitation
// @access  Private (Super Admin, Admin, Project Manager)
export const resendInvitation = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError('Not authenticated', 401);
  }

  const result = await InvitationService.resendInvitation(req.user, String(req.params.id));

  res.status(200).json({
    success: true,
    message: 'Invitation resent successfully',
    user: result.user,
    invitationUrl: result.invitationUrl,
    expiresAt: result.expiresAt,
  });
});

// @desc    Cancel invitation for pending user
// @route   POST /api/users/:id/cancel-invitation
// @access  Private (Super Admin, Admin)
export const cancelInvitation = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new ApiError('Not authenticated', 401);
  }

  const result = await InvitationService.cancelInvitation(req.user, String(req.params.id));

  res.status(200).json(result);
});
