import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  _id: Types.ObjectId;
  userName: string;
  userAvatar: string;
  action: string;
  entity: string;
  timestamp: string;
  description: string;
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
    action: { type: String, required: true },
    entity: { type: String, required: true },
    timestamp: { type: String, default: () => 'Just now' },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export const ActivityLogModel = model<IActivityLog>('ActivityLog', activityLogSchema);
