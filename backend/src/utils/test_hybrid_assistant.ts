import path from 'path';
import dotenv from 'dotenv';

// Load .env explicitly
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { aiService } from '../services/aiService';
import { IUser } from '../types/auth';

async function runHybridAssistantTestSuite() {
  console.log('====================================================');
  console.log('     DEVFLOW HYBRID AI ASSISTANT SUITE (GROQ)      ');
  console.log('====================================================\n');

  const mockUser: Partial<IUser> = {
    _id: '65f1a2b3c4d5e6f7a8b9c0d1' as any,
    name: 'Test PM',
    email: 'pm@devflow.io',
    role: 'Project Manager',
  };

  const testCases = [
    {
      id: 1,
      title: 'Identity & Capabilities Query',
      prompt: 'Who are you?',
    },
    {
      id: 2,
      title: 'General Technical Query: React',
      prompt: 'What is React?',
    },
    {
      id: 3,
      title: 'General Technical Query: JWT',
      prompt: 'Explain JWT authentication.',
    },
    {
      id: 4,
      title: 'General Technical Query: REST vs GraphQL',
      prompt: 'What is the difference between REST and GraphQL?',
    },
    {
      id: 5,
      title: 'Project-Specific Question (Health Analysis)',
      prompt: 'Analyze health and risk for my current project.',
      action: 'project_health',
    },
    {
      id: 6,
      title: 'Task & Workload Question (Project Context)',
      prompt: 'What are my assigned tasks and team workload status?',
      action: 'explain_my_tasks',
    },
    {
      id: 7,
      title: 'AI Generation Request (Tech Stack Suggestion)',
      prompt: 'Suggest a modern scalable tech stack for our web application.',
      action: 'suggest_tech_stack',
    },
  ];

  let passedCount = 0;

  for (const tc of testCases) {
    console.log(`[TEST ${tc.id}/7] ${tc.title}`);
    console.log(`  User Prompt: "${tc.prompt}"`);
    if (tc.action) console.log(`  Action: ${tc.action}`);

    try {
      const response = await aiService.processAssistantChat({
        prompt: tc.prompt,
        action: tc.action,
        user: mockUser as IUser,
      });

      if (!response || !response.answer) {
        throw new Error(`Test ${tc.id} failed: Empty response received.`);
      }

      console.log('  Response Snippet:');
      const snippet = response.answer.slice(0, 180).replace(/\n/g, ' ');
      console.log(`  "${snippet}..."`);

      if (tc.id === 1) {
        if (!response.answer.toLowerCase().includes('devflow ai assistant') && !response.answer.toLowerCase().includes('copilot')) {
          console.warn('  ⚠️ Warning: Identity response did not include expected title.');
        }
      }

      if (tc.id === 2) {
        if (response.answer.includes('MongoDB') && !tc.prompt.includes('MongoDB')) {
          console.warn('  ⚠️ Warning: General React query injected unrelated MongoDB project context.');
        }
      }

      passedCount++;
      console.log(`  ✅ Test ${tc.id} PASSED\n`);
    } catch (err: any) {
      console.error(`  ❌ Test ${tc.id} FAILED:`, err.message || err);
      console.log('');
    }
  }

  console.log('====================================================');
  console.log(`  RESULTS: ${passedCount}/${testCases.length} TESTS COMPLETED SUCCESSFULLY`);
  console.log('====================================================');

  process.exit(passedCount === testCases.length ? 0 : 1);
}

runHybridAssistantTestSuite();
