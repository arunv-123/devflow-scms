import mongoose from 'mongoose';
import { User } from '../models/userModel';
import { seedMasterDatabase } from '../scripts/seedMasterDatabase';

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devflow';
  const isAtlas = mongoURI.includes('mongodb+srv://') || mongoURI.includes('mongodb.net');

  try {
    // Attempt MongoDB connection with 15s timeout for cloud Atlas clusters
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: isAtlas ? 15000 : 4000,
    });
    console.log(`[DevFlow DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[DevFlow DB] Mongo connection warning (${(error as Error).message}). Initializing fallback database...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[DevFlow DB] In-Memory MongoDB Connected at ${memoryUri}`);
    } catch (memError) {
      console.error(`[DevFlow DB] Failed to start fallback MongoDB: ${(memError as Error).message}`);
    }
  }

  // Ensure database has canonical presentation dataset and no legacy test data
  try {
    if (mongoose.connection.readyState === 1) {
      const hasLegacyUsers = await User.exists({
        $or: [
          { name: /Test User|Dev Test|QA Test|Coord Test|RBAC Proj|Michael Scott|Dwight Schrute/i },
          { email: /test.*@|example.com|dunder.com/i },
        ],
      });

      const userCount = await User.countDocuments();

      if (hasLegacyUsers || userCount === 0 || process.env.RESET_DB === 'true') {
        console.log('[DevFlow DB] Performing automatic DB reset & seeding canonical presentation dataset...');
        await seedMasterDatabase(false);
      }
    }
  } catch (seedErr) {
    console.warn(`[DevFlow DB] Error verifying/seeding DB: ${(seedErr as Error).message}`);
  }
};
