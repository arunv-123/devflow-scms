import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { aiService } from '../services/aiService';
import { IUser } from '../types/auth';

async function runRealTimeDataTest() {
  console.log('====================================================');
  console.log('  TESTING REAL-TIME / LIVE DATA LIMITATIONS (GROQ)  ');
  console.log('====================================================\n');

  const mockUser: Partial<IUser> = {
    _id: '65f1a2b3c4d5e6f7a8b9c0d1' as any,
    name: 'Test User',
    email: 'user@devflow.io',
    role: 'Developer',
  };

  const testPrompts = [
    'What is the current live weather in Tokyo right now?',
    'What is the live Bitcoin price right now?',
  ];

  for (const prompt of testPrompts) {
    console.log(`[Prompt] "${prompt}"`);
    try {
      const response = await aiService.processAssistantChat({
        prompt,
        user: mockUser as IUser,
      });

      console.log('----------------------------------------------------');
      console.log('Response:');
      console.log(response.answer);
      console.log('----------------------------------------------------\n');
    } catch (err: any) {
      console.error('Test error:', err);
    }
  }

  process.exit(0);
}

runRealTimeDataTest();
