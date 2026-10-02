import { Schema, model, Document, Types } from 'mongoose';
import { UserRole } from '../types/auth';

export interface IInvitation extends Document {
  _id: Types.ObjectId;
  email: string;
  invitedBy: Types.ObjectId;
  role: UserRole;
  department?: string;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
    },
    department: {
      type: String,
      default: 'Engineering',
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

invitationSchema.index({ email: 1 });

export const InvitationModel = model<IInvitation>('Invitation', invitationSchema);
