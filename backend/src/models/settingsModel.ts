import { Schema, model, Document } from 'mongoose';

export interface ISettings extends Document {
  organizationName: string;
  organizationEmail: string;
  defaultCurrency: string;
  timezone: string;
  strictRBAC: boolean;
  emailNotifications: boolean;
  aiAssistantEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    organizationName: { type: String, default: 'DevFlow Enterprise SCMS' },
    organizationEmail: { type: String, default: 'admin@devflow.local' },
    defaultCurrency: { type: String, default: 'INR (₹) — Indian Rupee' },
    timezone: { type: String, default: 'Asia/Kolkata (IST, UTC+05:30)' },
    strictRBAC: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    aiAssistantEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SettingsModel = model<ISettings>('Settings', settingsSchema);
