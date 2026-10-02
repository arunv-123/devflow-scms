import { Request } from 'express';
import { Document, Types } from 'mongoose';

export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Project Manager'
  | 'Team Lead'
  | 'Developer'
  | 'Designer'
  | 'QA'
  | 'Client';

export type AvailabilityStatus = 'Available' | 'Busy' | 'On Leave';

export type UserAccountStatus = 'invited' | 'active' | 'disabled';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  department?: string;
  skills: string[];
  assignedProjects: Types.ObjectId[];
  workloadPercent: number;
  availability: AvailabilityStatus;
  status: UserAccountStatus;
  performanceRating: number;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(candidatePassword: string): Promise<boolean>;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface JwtPayload {
  id: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
