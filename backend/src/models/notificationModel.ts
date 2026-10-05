import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType = 'task' | 'project' | 'milestone' | 'meeting' | 'ai' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: NotificationPriority;
  entityId?: string;
  entityType?: 'task' | 'project' | 'milestone' | 'meeting' | 'ai' | 'system';
  projectId?: string;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'userId is required for notification scoping'], index: true },
    type: {
      type: String,
      enum: ['task', 'project', 'milestone', 'meeting', 'ai', 'system'],
      default: 'system',
    },
    title: { type: String, required: [true, 'Notification title is required'] },
    message: { type: String, required: [true, 'Notification message is required'] },
    timestamp: { type: String, default: () => 'Just now' },
    read: { type: Boolean, default: false, index: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    entityId: { type: String },
    entityType: {
      type: String,
      enum: ['task', 'project', 'milestone', 'meeting', 'ai', 'system'],
    },
    projectId: { type: String },
    actionUrl: { type: String },
  },
  { timestamps: true }
);

// Compound index for fast user unread and chronological notification queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const NotificationModel = model<INotification>('Notification', notificationSchema);

