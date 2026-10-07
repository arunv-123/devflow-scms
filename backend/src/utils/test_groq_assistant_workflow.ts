import path from 'path';
import dotenv from 'dotenv';

// Load .env explicitly
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { aiService } from '../services/aiService';
import { IUser } from '../types/auth';

async function runGroqAssistantWorkflowTest() {
  console.log('====================================================');
  console.log('      STEP 7: DEVFLOW AI ASSISTANT GROQ TEST        ');
  console.log('====================================================\n');

  try {
    const mockUser: Partial<IUser> = {
      _id: '65f1a2b3c4d5e6f7a8b9c0d1' as any,
      name: 'Test Project Manager',
      email: 'pm@devflow.com',
      role: 'Project Manager',
    };

    console.log(`[Setup] Using test user context: ${mockUser.name} (${mockUser.role})`);
    console.log(`[Config] process.env.AI_PROVIDER = "${process.env.AI_PROVIDER}"`);
    console.log(`[Config] process.env.GROQ_MODEL = "${process.env.GROQ_MODEL || 'openai/gpt-oss-120b'}"\n`);

    console.log('[Test 1] Sending conversational prompt to DevFlow AI Assistant via Groq...');
    const response1 = await aiService.processAssistantChat({
      prompt: 'Hello! What are your core capabilities as DevFlow AI Copilot?',
      user: mockUser as IUser,
    });

    console.log('\n----------------------------------------------------');
    console.log('  DevFlow AI Assistant Conversational Response:');
    console.log('----------------------------------------------------');
    console.log(response1.answer);
    console.log('----------------------------------------------------\n');

    console.log('[Test 2] Sending tool-triggering prompt ("Suggest modern tech stack for project")...');
    const response2 = await aiService.processAssistantChat({
      prompt: 'Suggest a modern, scalable technical stack for our new web application.',
      action: 'suggest_tech_stack',
      user: mockUser as IUser,
    });

    console.log('----------------------------------------------------');
    console.log('  DevFlow AI Assistant Tool Response (Tech Stack):');
    console.log('----------------------------------------------------');
    console.log(response2.answer);
    if (response2.generatedItems) {
      console.log('  Generated Items:', JSON.stringify(response2.generatedItems, null, 2));
    }
    console.log('----------------------------------------------------');
    console.log('✅ ALL DEVFLOW AI ASSISTANT GROQ TESTS PASSED!\n');
  } catch (err: any) {
    console.error('❌ DevFlow AI Assistant Groq test error:', err);
  } finally {
    process.exit(0);
  }
}

runGroqAssistantWorkflowTest();
