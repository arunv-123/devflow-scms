import { User } from '../models/userModel';
import { IUser, UserRole } from '../types/auth';
import { ApiError } from '../utils/errors';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  department?: string;
  skills?: string[];
  avatar?: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export class AuthService {
  static async registerUser(input: RegisterUserInput): Promise<IUser> {
    const { name, email, password, role, department, skills, avatar } = input;

    if (!name || !email || !password) {
      throw new ApiError('Please provide name, email, and password', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError('User with this email already exists', 400);
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'Developer',
      department: department || 'Engineering',
      skills: skills || [],
      ...(avatar && { avatar }),
    });

    return user;
  }

  static async loginUser(input: LoginUserInput): Promise<IUser> {
    const { email, password } = input;

    if (!email || !password) {
      throw new ApiError('Please provide email and password', 400);
    }

    // Find user and select password explicitly
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new ApiError('Invalid email or password credentials', 401);
    }

    if (user.status === 'invited') {
      throw new ApiError('Account invitation pending. Please check your invitation link to set a password and activate your account.', 401);
    }

    if (user.status === 'disabled') {
      throw new ApiError('Account disabled. Please contact your administrator.', 403);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new ApiError('Invalid email or password credentials', 401);
    }

    return user;
  }

  static async getUserProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    return user;
  }
}
