import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/userModel';

dotenv.config();

export const seedSuperAdmin = async (): Promise<void> => {
  try {
    await connectDB();

    const existingSuperAdmin = await User.findOne({ email: 'superadmin@devflow.local' }).select('+password');

    if (existingSuperAdmin) {
      const isPasswordValid = await existingSuperAdmin.matchPassword('SuperAdmin@123');
      if (!isPasswordValid) {
        existingSuperAdmin.password = 'SuperAdmin@123';
        existingSuperAdmin.name = 'DevFlow Super Admin';
        existingSuperAdmin.role = 'Super Admin';
        existingSuperAdmin.department = 'Management';
        await existingSuperAdmin.save();
        console.log('[DevFlow Seed] Super Admin credentials updated to match SuperAdmin@123.');
      } else {
        console.log('[DevFlow Seed] Super Admin account (superadmin@devflow.local) already exists with correct credentials.');
      }
    } else {
      await User.create({
        name: 'DevFlow Super Admin',
        email: 'superadmin@devflow.local',
        password: 'SuperAdmin@123',
        role: 'Super Admin',
        department: 'Management',
        skills: ['Executive Leadership', 'System Administration', 'Security Governance'],
      });
      console.log('[DevFlow Seed] Super Admin account created successfully: superadmin@devflow.local');
    }
  } catch (error) {
    console.error('[DevFlow Seed] Error seeding Super Admin account:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
};

if (require.main === module) {
  seedSuperAdmin();
}
