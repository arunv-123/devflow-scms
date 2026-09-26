import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { SettingsModel } from '../models/settingsModel';
import { asyncHandler } from '../utils/errors';

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private
export const getSettings = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  let settings = await SettingsModel.findOne();
  if (!settings) {
    settings = await SettingsModel.create({
      organizationName: 'DevFlow Enterprise SCMS',
      defaultCurrency: 'USD ($)',
      strictRBAC: true,
      emailNotifications: true,
      aiAssistantEnabled: true,
    });
  }

  res.status(200).json({
    success: true,
    settings: {
      id: settings._id.toString(),
      organizationName: settings.organizationName,
      organizationEmail: settings.organizationEmail,
      defaultCurrency: settings.defaultCurrency,
      strictRBAC: settings.strictRBAC,
      emailNotifications: settings.emailNotifications,
      aiAssistantEnabled: settings.aiAssistantEnabled,
    },
  });
});

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private (Super Admin, Admin only)
export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  let settings = await SettingsModel.findOne();
  if (!settings) {
    settings = new SettingsModel(req.body);
  } else {
    Object.assign(settings, req.body);
  }

  await settings.save();

  res.status(200).json({
    success: true,
    message: 'System settings updated successfully',
    settings: {
      id: settings._id.toString(),
      organizationName: settings.organizationName,
      organizationEmail: settings.organizationEmail,
      defaultCurrency: settings.defaultCurrency,
      strictRBAC: settings.strictRBAC,
      emailNotifications: settings.emailNotifications,
      aiAssistantEnabled: settings.aiAssistantEnabled,
    },
  });
});
