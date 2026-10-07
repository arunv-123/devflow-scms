import path from 'path';
import dotenv from 'dotenv';

// Load .env explicitly
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { groqProvider } from '../services/groqProvider';

async function runDirectGroqTest() {
  console.log('====================================================');
  console.log('           STEP 5: DIRECT GROQ API TEST             ');
  console.log('====================================================\n');

  console.log('[Environment Verification]');
  console.log(`  AI_PROVIDER: ${process.env.AI_PROVIDER}`);
  console.log(`  GROQ_MODEL: ${process.env.GROQ_MODEL || 'openai/gpt-oss-120b'}`);
  console.log(`  GROQ_API_KEY Configured: ${Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_key_here')}\n`);

  console.log('[Sending Direct Prompt to Groq Provider]');
  console.log('  Prompt: "Reply with exactly: GROQ_TEST_OK"');
  console.log('  Target Endpoint: https://api.groq.com/openai/v1');
  console.log(`  Target Model: ${groqProvider.getGroqModel()}\n`);

  const result = await groqProvider.testConnection('Reply with exactly: GROQ_TEST_OK');

  console.log('----------------------------------------------------');
  console.log(`  Test Success: ${result.success}`);
  console.log(`  HTTP Status: ${result.status || (result.success ? 200 : 'N/A')}`);
  console.log(`  Target Model Used: ${result.model}`);
  console.log(`  Target Endpoint Used: ${result.endpoint}`);

  if (result.success) {
    console.log(`  Response Received: "${result.data}"`);
    console.log('----------------------------------------------------');
    console.log('✅ GROQ_TEST_OK PASSED SUCCESSFULLY!\n');
  } else {
    console.log(`  Message: ${result.message}`);
    console.log(`  Error Code: ${result.error || 'N/A'}`);
    console.log('----------------------------------------------------');
    console.log('❌ GROQ DIRECT TEST FAILED!\n');
  }

  console.log('====================================================');
}

runDirectGroqTest();
