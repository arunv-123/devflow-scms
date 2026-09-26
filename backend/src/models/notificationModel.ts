import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType = 'task' | 'project' | 'milestone' | 'ai' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: NotificationPriority;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['task', 'project', 'milestone', 'ai', 'system'],
      default: 'system',
    },
    title: { type: String, required: [true, 'Notification title is required'] },
    message: { type: String, required: [true, 'Notification message is required'] },
    timestamp: { type: String, default: () => 'Just now' },
    read: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

export const NotificationModel = model<INotification>('Notification', notificationSchema);
