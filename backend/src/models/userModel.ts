import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole, AvailabilityStatus } from '../types/auth';

const VALID_ROLES: UserRole[] = [
  'Super Admin',
  'Admin',
  'Project Manager',
  'Team Lead',
  'Developer',
  'Designer',
  'QA',
  'Client',
];

const VALID_AVAILABILITY: AvailabilityStatus[] = ['Available', 'Busy', 'On Leave'];

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: VALID_ROLES,
        message: '{VALUE} is not a valid role',
      },
      default: 'Developer',
    },
    avatar: {
      type: String,
      default: function (this: IUser) {
        return `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;
      },
    },
    department: {
      type: String,
      trim: true,
      default: 'Engineering',
    },
    skills: {
      type: [String],
      default: [],
    },
    assignedProjects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
    workloadPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    availability: {
      type: String,
      enum: {
        values: VALID_AVAILABILITY,
        message: '{VALUE} is not a valid availability status',
      },
      default: 'Available',
    },
    performanceRating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', userSchema);
