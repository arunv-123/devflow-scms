import mongoose from 'mongoose';
import { User } from '../models/userModel';

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devflow';

  try {
    // Attempt local MongoDB connection first with a 3-second timeout
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[DevFlow DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[DevFlow DB] Local MongoDB unavailable (${(error as Error).message}). Initializing In-Memory Database...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[DevFlow DB] In-Memory MongoDB Connected at ${memoryUri}`);
    } catch (memError) {
      console.error(`[DevFlow DB] Failed to start In-Memory MongoDB: ${(memError as Error).message}`);
    }
  }

  // Seed default demo users if database is empty
  try {
    if (mongoose.connection.readyState === 1) {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[DevFlow DB] Seeding default demo accounts...');
        await User.create([
          {
            name: 'Admin User',
            email: 'admin@devflow.local',
            password: 'password123',
            role: 'Admin',
            department: 'Management',
            skills: ['Leadership', 'Architecture', 'Strategy'],
          },
          {
            name: 'Dev User',
            email: 'dev@devflow.local',
            password: 'password123',
            role: 'Developer',
            department: 'Engineering',
            skills: ['TypeScript', 'React', 'Node.js', 'MongoDB'],
          },
          {
            name: 'Acme Corp Client',
            email: 'client@devflow.local',
            password: 'password123',
            role: 'Client',
            department: 'Client Representative',
            skills: ['Product Ownership', 'Acceptance Testing'],
          },
        ]);
        console.log('[DevFlow DB] Demo accounts seeded: admin@devflow.local, dev@devflow.local, client@devflow.local (Password: password123)');
      }
    }
  } catch (seedErr) {
    console.warn(`[DevFlow DB] Error seeding initial users: ${(seedErr as Error).message}`);
  }
};
