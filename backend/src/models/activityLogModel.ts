import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  _id: Types.ObjectId;
  userName: string;
  userAvatar: string;
  userRole?: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  projectId?: string;
  projectName?: string;
  timestamp: string;
  description: string;
  metadata?: {
    previousTechStack?: string[];
    newTechStack?: string[];
    additions?: string[];
    removals?: string[];
    reason?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    userName: { type: String, required: true },
    userAvatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    userRole: { type: String },
    userId: { type: String },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    projectId: { type: String },
    projectName: { type: String },
    timestamp: { type: String, default: () => 'Just now' },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const ActivityLogModel = model<IActivityLog>('ActivityLog', activityLogSchema);
