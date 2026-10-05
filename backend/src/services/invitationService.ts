import crypto from 'crypto';
import { User } from '../models/userModel';
import { InvitationModel } from '../models/invitationModel';
import { ActivityLogModel } from '../models/activityLogModel';
import { IUser, UserRole } from '../types/auth';
import { ApiError } from '../utils/errors';

export interface InviteUserInput {
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  skills?: string[];
}

export interface AcceptInvitationInput {
  token: string;
  password: string;
}

export class InvitationService {
  /**
   * Invites a new user or resends an invitation to a pending user.
   */
  static async inviteUser(inviter: IUser, input: InviteUserInput) {
    const { name, email: rawEmail, role, department, skills } = input;

    if (!name || !rawEmail || !role) {
      throw new ApiError('Name, email, and role are required for invitation', 400);
    }

    const email = rawEmail.toLowerCase().trim();

    // RBAC Permissions Enforcement
    const inviterRole = inviter.role;
    if (inviterRole === 'Project Manager' && role !== 'Client') {
      throw new ApiError('Project Managers are only authorized to invite Client accounts', 403);
    }

    if (inviterRole === 'Admin' && role === 'Super Admin') {
      throw new ApiError('Admins cannot invite Super Admin accounts', 403);
    }

    if (!['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator'].includes(inviterRole)) {
      throw new ApiError('Your role is not authorized to invite users', 403);
    }

    // Check existing user
    let targetUser = await User.findOne({ email });

    if (targetUser) {
      if (targetUser.status === 'active') {
        throw new ApiError('A user with this email is already active in the workspace', 400);
      }
      if (targetUser.status === 'disabled') {
        throw new ApiError('This user account is currently disabled. Contact an admin.', 400);
      }

      // Update details for pending invited user
      targetUser.name = name;
      targetUser.role = role;
      if (department) targetUser.department = department;
      if (skills) targetUser.skills = skills;
      await targetUser.save();
    } else {
      // Create new user with status 'invited'
      const placeholderPassword = 'INVITED_PENDING_' + crypto.randomBytes(16).toString('hex');
      targetUser = await User.create({
        name,
        email,
        password: placeholderPassword,
        role,
        department: department || 'Engineering',
        skills: skills || [],
        status: 'invited',
      });
    }

    // Invalidate any previous pending invitations for this email
    await InvitationModel.updateMany({ email, used: false }, { used: true });

    // Generate secure random token and SHA-256 hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await InvitationModel.create({
      email,
      invitedBy: inviter._id,
      role,
      department: department || 'Engineering',
      tokenHash,
      expiresAt,
      user: targetUser._id,
      used: false,
    });

    // Development Invitation URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const invitationUrl = `${clientUrl}/accept-invitation?token=${rawToken}`;

    // Log activity
    await ActivityLogModel.create({
      userName: inviter.name,
      userAvatar: inviter.avatar,
      action: 'User Invited',
      entity: targetUser.name,
      description: `Invited ${targetUser.name} (${targetUser.role}) to workspace`,
    });

    return {
      user: {
        id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        department: targetUser.department,
        status: targetUser.status,
      },
      invitationUrl,
      expiresAt,
    };
  }

  /**
   * Validates an invitation token for the Accept Invitation page.
   */
  static async validateToken(rawToken: string) {
    if (!rawToken) {
      throw new ApiError('Invitation token is required', 400);
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const invitation = await InvitationModel.findOne({ tokenHash });

    if (!invitation) {
      throw new ApiError('Invalid invitation token', 400);
    }

    if (invitation.used) {
      throw new ApiError('This invitation link has already been used', 400);
    }

    if (invitation.expiresAt < new Date()) {
      throw new ApiError('This invitation link has expired. Please ask an administrator to resend your invitation.', 400);
    }

    const user = await User.findById(invitation.user);
    if (!user) {
      throw new ApiError('Invited user account not found', 404);
    }

    return {
      email: invitation.email,
      name: user.name,
      role: invitation.role,
      department: invitation.department,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Accepts an invitation and sets the user's password.
   */
  static async acceptInvitation(input: AcceptInvitationInput) {
    const { token: rawToken, password } = input;

    if (!rawToken || !password) {
      throw new ApiError('Token and password are required', 400);
    }

    // Password strength check
    if (password.length < 8) {
      throw new ApiError('Password must be at least 8 characters long', 400);
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpper || !hasLower || !hasNumberOrSymbol) {
      throw new ApiError(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character',
        400
      );
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const invitation = await InvitationModel.findOne({ tokenHash });

    if (!invitation || invitation.used) {
      throw new ApiError('Invalid or already used invitation link', 400);
    }

    if (invitation.expiresAt < new Date()) {
      throw new ApiError('Invitation link has expired', 400);
    }

    const user = await User.findById(invitation.user);
    if (!user) {
      throw new ApiError('User account not found', 404);
    }

    // Update user password & set status to active
    user.password = password;
    user.status = 'active';
    await user.save(); // pre('save') hook hashes password once via bcrypt

    // Mark invitation as used
    invitation.used = true;
    await invitation.save();

    // Log Activity
    await ActivityLogModel.create({
      userName: user.name,
      userAvatar: user.avatar,
      action: 'Account Activated',
      entity: user.name,
      description: `Activated account and set password via invitation`,
    });

    return {
      success: true,
      message: 'Account activated successfully. You can now log in.',
    };
  }

  /**
   * Resends an invitation for a pending user account.
   */
  static async resendInvitation(inviter: IUser, userId: string) {
    const inviterRole = inviter.role;
    if (!['Super Admin', 'Admin', 'Project Manager'].includes(inviterRole)) {
      throw new ApiError('Not authorized to resend invitations', 403);
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      throw new ApiError('User not found', 404);
    }

    if (targetUser.status !== 'invited') {
      throw new ApiError(`Cannot resend invitation. User status is '${targetUser.status}'.`, 400);
    }

    if (inviterRole === 'Admin' && targetUser.role === 'Super Admin') {
      throw new ApiError('Admins cannot resend invitations for Super Admin accounts', 403);
    }

    if (inviterRole === 'Project Manager' && targetUser.role !== 'Client') {
      throw new ApiError('Project Managers can only resend invitations for Client accounts', 403);
    }

    // Invalidate previous unused invitations
    await InvitationModel.updateMany({ email: targetUser.email, used: false }, { used: true });

    // Generate new secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await InvitationModel.create({
      email: targetUser.email,
      invitedBy: inviter._id,
      role: targetUser.role,
      department: targetUser.department,
      tokenHash,
      expiresAt,
      user: targetUser._id,
      used: false,
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const invitationUrl = `${clientUrl}/accept-invitation?token=${rawToken}`;

    return {
      user: {
        id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
      },
      invitationUrl,
      expiresAt,
    };
  }

  /**
   * Cancels a pending invitation and deletes/disables the invited user record.
   */
  static async cancelInvitation(inviter: IUser, userId: string) {
    const inviterRole = inviter.role;
    if (!['Super Admin', 'Admin'].includes(inviterRole)) {
      throw new ApiError('Only Super Admin and Admin can cancel invitations', 403);
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      throw new ApiError('User not found', 404);
    }

    if (inviterRole === 'Admin' && targetUser.role === 'Super Admin') {
      throw new ApiError('Admins cannot cancel invitations for Super Admin accounts', 403);
    }

    // Invalidate any invitations
    await InvitationModel.updateMany({ user: targetUser._id }, { used: true });

    if (targetUser.status === 'invited') {
      await User.findByIdAndDelete(userId);
    } else {
      targetUser.status = 'disabled';
      await targetUser.save();
    }

    return {
      success: true,
      message: 'Invitation cancelled successfully',
    };
  }
}
