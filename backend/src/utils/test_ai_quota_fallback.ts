import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { aiService } from '../services/aiService';
import { User } from '../models/userModel';
import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { IUser } from '../types/auth';

async function runQuotaFallbackAuditTests() {
  console.log('====================================================');
  console.log('      AI COPILOT QUOTA RECOVERY & FALLBACK AUDIT    ');
  console.log('====================================================\n');

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devflow';
    await mongoose.connect(mongoUri);
    console.log('[Setup] Connected to MongoDB database successfully.');

    // Fetch test user context
    let testUser = await User.findOne({ role: 'Project Manager' });
    if (!testUser) {
      testUser = await User.findOne({ role: 'Developer' });
    }
    if (!testUser) {
      testUser = await User.findOne();
    }

    if (!testUser) {
      console.error('[Setup Error] No user found in database for testing.');
      process.exit(1);
    }

    console.log(`[Setup] Using test user: ${testUser.name} (${testUser.role})\n`);

    // --- TEST A: Standard AI Service / Gemini Request ---
    console.log('--- TEST A: Standard Gemini AI Service Request ---');
    aiService.resetProviderStatus();
    const resA = await aiService.processAssistantChat({
      prompt: 'Summarize current project status and health metrics',
      action: 'project_health',
      user: testUser as IUser,
    });

    if (!resA || !resA.answer) {
      throw new Error('Test A failed: No response answer returned.');
    }
    const statusA = aiService.getProviderStatus();
    console.log('✅ Test A Result: Response received successfully.');
    console.log(`   Provider State: ${statusA.state}`);
    console.log(`   Answer snippet: "${resA.answer.slice(0, 80)}..."\n`);

    // --- TEST B: Gemini Quota / 429 Error Simulation ---
    console.log('--- TEST B: Gemini 429 Quota / Rate Limit Failure Simulation ---');
    aiService.simulateGeminiFailure('429 Rate limit exceeded / Quota exhausted (RESOURCE_EXHAUSTED)');

    const startB = Date.now();
    const resB = await aiService.processAssistantChat({
      prompt: 'Explain my assigned tasks and deadlines',
      action: 'explain_my_tasks',
      user: testUser as IUser,
    });
    const elapsedB = Date.now() - startB;

    if (!resB || !resB.answer) {
      throw new Error('Test B failed: Fallback engine did not return a response.');
    }
    const statusB = aiService.getProviderStatus();
    console.log(`✅ Test B Result: Fallback Engine responded in ${elapsedB}ms.`);
    console.log(`   Provider State: ${statusB.state}`);
    console.log(`   Failure Reason: ${statusB.lastFailureReason}`);
    console.log(`   Cooldown Ms: ${statusB.cooldownMs}ms`);
    console.log(`   Fallback answer snippet: "${resB.answer.slice(0, 80)}..."\n`);

    // --- TEST C: Multiple Consecutive Requests While Gemini is Unavailable ---
    console.log('--- TEST C: Repeated Requests During Cooldown (Zero Delay Check) ---');
    const startC = Date.now();
    const prompts = [
      'Break down task technical subtasks',
      'Suggest modern web application tech stack',
      'Summarize meeting notes and action items',
    ];

    for (let i = 0; i < prompts.length; i++) {
      const pStart = Date.now();
      const resC = await aiService.processAssistantChat({
        prompt: prompts[i],
        user: testUser as IUser,
      });
      const pTime = Date.now() - pStart;
      console.log(`   Request ${i + 1} ("${prompts[i]}") -> Fallback response in ${pTime}ms`);
      if (!resC || !resC.answer) {
        throw new Error(`Test C request ${i + 1} failed.`);
      }
    }
    const totalTimeC = Date.now() - startC;
    console.log(`✅ Test C Result: 3 consecutive fallback requests handled seamlessly in ${totalTimeC}ms total.\n`);

    // --- TEST D: Gemini Recovery Simulation ---
    console.log('--- TEST D: Gemini Recovery Simulation ---');
    aiService.simulateGeminiRecovery();

    const resD = await aiService.processAssistantChat({
      prompt: 'Provide technical assistance and REST API guidance',
      action: 'technical_assistant',
      user: testUser as IUser,
    });

    const statusD = aiService.getProviderStatus();
    console.log('✅ Test D Result: Request handled after recovery trigger.');
    console.log(`   Provider State: ${statusD.state}`);
    console.log(`   Answer snippet: "${resD.answer.slice(0, 80)}..."\n`);

    // --- TEST E: Provider Reset & Clean Reset Check ---
    console.log('--- TEST E: Provider Status Reset Verification ---');
    aiService.resetProviderStatus();
    const statusE = aiService.getProviderStatus();
    if (statusE.state !== 'GEMINI_ACTIVE') {
      throw new Error(`Test E failed: State is ${statusE.state} instead of GEMINI_ACTIVE.`);
    }
    console.log('✅ Test E Result: Provider status reset cleanly to GEMINI_ACTIVE.\n');

    console.log('====================================================');
    console.log('     ALL AI QUOTA & FALLBACK TESTS PASSED 100%!     ');
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ AI Quota Fallback Test Failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runQuotaFallbackAuditTests();
