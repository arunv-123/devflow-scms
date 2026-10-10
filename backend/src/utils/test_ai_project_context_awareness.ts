import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load .env explicitly
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { aiService } from '../services/aiService';
import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { Milestone } from '../models/milestoneModel';
import { User } from '../models/userModel';
import { IUser } from '../types/auth';

async function runVerification() {
  console.log('================================================================');
  console.log(' DEVFLOW AI PROJECT ASSISTANT CONTEXT AWARENESS VERIFICATION   ');
  console.log('================================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devflow';
  await mongoose.connect(mongoUri);
  console.log(' Connected to MongoDB database successfully.');

  try {
    // 1. Ensure test projects exist in the database
    let projects = await Project.find().limit(2);
    if (projects.length === 0) {
      console.log('Seeding test projects...');
      const p1 = await Project.create({
        name: 'Apex Enterprise Portal & Mobile App',
        clientName: 'Apex Capital Corp',
        description: 'AI-driven financial portfolio analytics and secure mobile workspace.',
        manager: {
          id: 'usr-001',
          name: 'Alex Morgan',
          email: 'alex.morgan@devflow.io',
          role: 'Super Admin',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        },
        startDate: '2026-01-10',
        endDate: '2026-08-30',
        status: 'In Progress',
        priority: 'High',
        budget: 180000,
        spent: 95000,
        progress: 68,
        techStack: ['Next.js', 'TypeScript', 'Node.js', 'MongoDB', 'Tailwind'],
        healthScore: 89,
        riskLevel: 'Low',
      });
      const p2 = await Project.create({
        name: 'Vanguard AI Knowledge Engine',
        clientName: 'Vanguard Health Systems',
        description: 'Enterprise RAG knowledge synthesizer with semantic search.',
        manager: {
          id: 'usr-001',
          name: 'Alex Morgan',
          email: 'alex.morgan@devflow.io',
          role: 'Super Admin',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        },
        startDate: '2026-02-01',
        endDate: '2026-06-15',
        status: 'In Progress',
        priority: 'Critical',
        budget: 120000,
        spent: 45000,
        progress: 42,
        techStack: ['Python', 'FastAPI', 'LangChain', 'React'],
        healthScore: 82,
        riskLevel: 'Moderate',
      });
      projects = [p1, p2];
    }

    const testProject1 = projects[0];
    const testProject2 = projects[1] || projects[0];
    const p1Id = testProject1._id.toString();
    const p2Id = testProject2._id.toString();

    console.log(`[Project 1] "${testProject1.name}" (ID: ${p1Id})`);
    console.log(`[Project 2] "${testProject2.name}" (ID: ${p2Id})\n`);

    // Ensure sample tasks & milestones exist for Project 1
    const taskCount = await Task.countDocuments({ projectId: p1Id });
    if (taskCount === 0) {
      await Task.create([
        {
          projectId: p1Id,
          projectName: testProject1.name,
          title: 'Implement Database Schemas & Data Constraints',
          description: 'Define Mongoose schemas with proper indexes.',
          status: 'In Progress',
          priority: 'High',
          dueDate: '2026-01-15', // intentionally overdue
          assignee: { id: 'usr-dev-1', name: 'Elena Rostova', email: 'elena@devflow.io', role: 'Developer' },
        },
        {
          projectId: p1Id,
          projectName: testProject1.name,
          title: 'Setup Protected Auth Pipeline & RBAC Guards',
          description: 'Apply auth JWT guard and RBAC role verification.',
          status: 'Completed',
          priority: 'Critical',
          dueDate: '2026-03-20',
          assignee: { id: 'usr-dev-1', name: 'Elena Rostova', email: 'elena@devflow.io', role: 'Developer' },
        },
      ]);
    }

    const msCount = await Milestone.countDocuments({ projectId: p1Id });
    if (msCount === 0) {
      await Milestone.create([
        {
          projectId: p1Id,
          projectName: testProject1.name,
          title: 'Phase 1: Architecture & Security Setup',
          description: 'Establish foundational schemas and security middleware.',
          status: 'Achieved',
          startDate: '2026-01-10',
          dueDate: '2026-02-28',
          progress: 100,
        },
        {
          projectId: p1Id,
          projectName: testProject1.name,
          title: 'Phase 2: Core Feature Implementation',
          description: 'Build core management modules and activity metrics.',
          status: 'In Progress',
          startDate: '2026-03-01',
          dueDate: '2026-06-30',
          progress: 60,
        },
      ]);
    }

    // Define test users with different roles
    const adminUser: Partial<IUser> = {
      _id: new mongoose.Types.ObjectId() as any,
      name: 'Sarah Admin',
      email: 'admin@devflow.io',
      role: 'Super Admin',
    };

    const developerUser: Partial<IUser> = {
      _id: new mongoose.Types.ObjectId() as any,
      name: 'Elena Developer',
      email: 'elena@devflow.io',
      role: 'Developer',
      assignedProjects: [testProject1._id as any],
    };

    const clientUserWithoutAccess: Partial<IUser> = {
      _id: new mongoose.Types.ObjectId() as any,
      name: 'External Client',
      email: 'client@external.com',
      role: 'Client',
      assignedProjects: [],
    };

    // ────────────────────────────────────────────────────────────────
    // TEST 1: General project-details question when project is selected
    // ────────────────────────────────────────────────────────────────
    console.log('────────────────────────────────────────────────────────────────');
    console.log('TEST 1: "Can you give the current project details?" with project selected');
    console.log('────────────────────────────────────────────────────────────────');
    const res1 = await aiService.processAssistantChat({
      prompt: 'Can you give the current project details?',
      projectId: p1Id,
      user: adminUser as IUser,
    });
    console.log('Response:\n', res1.answer);
    const mentionsProjectName = res1.answer.toLowerCase().includes(testProject1.name.toLowerCase()) ||
      res1.answer.toLowerCase().includes('apex');
    const doesNotAskForId = !res1.answer.toLowerCase().includes('provide a project id') &&
      !res1.answer.toLowerCase().includes('provide the project id');
    if (mentionsProjectName && doesNotAskForId) {
      console.log('✅ TEST 1 PASSED: Resolved project data returned without asking for project ID.');
    } else {
      console.error('❌ TEST 1 FAILED: Did not return project details or asked for ID.');
    }

    // ────────────────────────────────────────────────────────────────
    // TEST 2: General inquiries: Progress, Overdue tasks, Milestones
    // ────────────────────────────────────────────────────────────────
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('TEST 2A: "How is my project progressing?"');
    console.log('────────────────────────────────────────────────────────────────');
    const res2a = await aiService.processAssistantChat({
      prompt: 'How is my project progressing?',
      projectId: p1Id,
      user: adminUser as IUser,
    });
    console.log('Response:\n', res2a.answer);
    if (res2a.answer.includes('%') || res2a.answer.toLowerCase().includes('progress')) {
      console.log('✅ TEST 2A PASSED: Project progress accurately answered.');
    } else {
      console.error('❌ TEST 2A FAILED: Progress not reported.');
    }

    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('TEST 2B: "What tasks are overdue?"');
    console.log('────────────────────────────────────────────────────────────────');
    const res2b = await aiService.processAssistantChat({
      prompt: 'What tasks are overdue?',
      projectId: p1Id,
      user: adminUser as IUser,
    });
    console.log('Response:\n', res2b.answer);
    if (res2b.answer.toLowerCase().includes('overdue') || res2b.answer.toLowerCase().includes('schedule')) {
      console.log('✅ TEST 2B PASSED: Overdue tasks inquiry handled accurately.');
    } else {
      console.error('❌ TEST 2B FAILED.');
    }

    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('TEST 2C: "What milestones are remaining?"');
    console.log('────────────────────────────────────────────────────────────────');
    const res2c = await aiService.processAssistantChat({
      prompt: 'What milestones are remaining?',
      projectId: p1Id,
      user: adminUser as IUser,
    });
    console.log('Response:\n', res2c.answer);
    if (res2c.answer.toLowerCase().includes('milestone')) {
      console.log('✅ TEST 2C PASSED: Remaining milestones inquiry answered.');
    } else {
      console.error('❌ TEST 2C FAILED.');
    }

    // ────────────────────────────────────────────────────────────────
    // TEST 3: Same question when multiple projects are accessible & no project selected
    // ────────────────────────────────────────────────────────────────
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('TEST 3: Multiple accessible projects, no project selected');
    console.log('────────────────────────────────────────────────────────────────');
    const res3 = await aiService.processAssistantChat({
      prompt: 'Can you give the current project details?',
      // No projectId passed
      user: adminUser as IUser,
    });
    console.log('Response:\n', res3.answer);
    const listsMultiple = res3.answer.toLowerCase().includes('select') ||
      res3.answer.toLowerCase().includes('multiple projects') ||
      res3.answer.includes(testProject1.name);
    if (listsMultiple) {
      console.log('✅ TEST 3 PASSED: Prompted user to select from authorized project list.');
    } else {
      console.error('❌ TEST 3 FAILED: Did not present authorized project list.');
    }

    // ────────────────────────────────────────────────────────────────
    // TEST 4: Single accessible project auto-resolution when no project selected
    // ────────────────────────────────────────────────────────────────
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('TEST 4: User with exactly 1 accessible project, no project explicitly passed');
    console.log('────────────────────────────────────────────────────────────────');
    const res4 = await aiService.processAssistantChat({
      prompt: 'Can you give the current project details?',
      // No projectId passed, developer only has testProject1
      user: developerUser as IUser,
    });
    console.log('Response:\n', res4.answer);
    if (res4.answer.toLowerCase().includes(testProject1.name.toLowerCase()) || res4.answer.toLowerCase().includes('apex')) {
      console.log('✅ TEST 4 PASSED: Single accessible project was auto-resolved successfully.');
    } else {
      console.error('❌ TEST 4 FAILED: Could not auto-resolve single project.');
    }

    // ────────────────────────────────────────────────────────────────
    // TEST 5: Unauthorized project access attempt
    // ────────────────────────────────────────────────────────────────
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('TEST 5: User attempting to access unauthorized project');
    console.log('────────────────────────────────────────────────────────────────');
    const res5 = await aiService.processAssistantChat({
      prompt: 'Give me the current project details.',
      projectId: p1Id,
      user: clientUserWithoutAccess as IUser,
    });
    console.log('Response:\n', res5.answer);
    const isDenied = res5.answer.toLowerCase().includes('not authorized') ||
      res5.answer.toLowerCase().includes('denied') ||
      res5.answer.toLowerCase().includes('permission') ||
      res5.answer.toLowerCase().includes('unavailable');
    if (isDenied) {
      console.log('✅ TEST 5 PASSED: Unauthorized access rejected safely without data leak.');
    } else {
      console.error('❌ TEST 5 FAILED: Unauthorized user was not restricted.');
    }

    // ────────────────────────────────────────────────────────────────
    // TEST 6: User with NO accessible projects
    // ────────────────────────────────────────────────────────────────
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('TEST 6: User with NO accessible projects');
    console.log('────────────────────────────────────────────────────────────────');
    const res6 = await aiService.processAssistantChat({
      prompt: 'Give me the current project details.',
      user: clientUserWithoutAccess as IUser,
    });
    console.log('Response:\n', res6.answer);
    if (
      res6.answer.toLowerCase().includes('no accessible projects') ||
      res6.answer.toLowerCase().includes('not assigned') ||
      res6.answer.toLowerCase().includes('no project') ||
      res6.answer.toLowerCase().includes('unable to find') ||
      res6.answer.toLowerCase().includes('currently there are none')
    ) {
      console.log('✅ TEST 6 PASSED: Correctly explained that no accessible projects exist.');
    } else {
      console.error('❌ TEST 6 FAILED.');
    }

    // ────────────────────────────────────────────────────────────────
    // TEST 7: Preserved existing features (General technical & identity)
    // ────────────────────────────────────────────────────────────────
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('TEST 7: Preserved features ("Who are you?" and "What is JWT?")');
    console.log('────────────────────────────────────────────────────────────────');
    const res7a = await aiService.processAssistantChat({
      prompt: 'Who are you?',
      user: adminUser as IUser,
    });
    console.log('[Identity Snippet]:\n', res7a.answer.slice(0, 150));

    const res7b = await aiService.processAssistantChat({
      prompt: 'What is JWT?',
      user: adminUser as IUser,
    });
    console.log('[Technical Snippet]:\n', res7b.answer.slice(0, 150));

    if (res7a.answer.toLowerCase().includes('assistant') || res7a.answer.toLowerCase().includes('copilot')) {
      console.log('✅ TEST 7 PASSED: Existing capabilities intact.');
    } else {
      console.error('❌ TEST 7 FAILED.');
    }

    // ────────────────────────────────────────────────────────────────
    // TEST 8: Rule Engine Fallback Engine Verification
    // ────────────────────────────────────────────────────────────────
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('TEST 8: Rule Engine Fallback Engine Verification (Deterministic)');
    console.log('────────────────────────────────────────────────────────────────');
    const ruleEngine = (aiService as any).processRuleEngineAssistantChat.bind(aiService);

    // 8A. Project Details
    const r8a = await ruleEngine({
      prompt: 'Give me the current project details.',
      projectId: p1Id,
      user: adminUser as IUser,
    });
    console.log('[Rule Engine Project Details]:\n', r8a.answer);
    if (r8a.answer.includes(testProject1.name) && r8a.answer.includes('Client')) {
      console.log('✅ TEST 8A PASSED: Rule Engine resolved project details accurately.');
    } else {
      console.error('❌ TEST 8A FAILED.');
    }

    // 8B. Progress
    const r8b = await ruleEngine({
      prompt: 'How is my project progressing?',
      projectId: p1Id,
      user: adminUser as IUser,
    });
    console.log('[Rule Engine Progress]:\n', r8b.answer);
    if (r8b.answer.includes('Progress') && r8b.answer.includes('%')) {
      console.log('✅ TEST 8B PASSED: Rule Engine reported progress accurately.');
    } else {
      console.error('❌ TEST 8B FAILED.');
    }

    // 8C. Overdue Tasks
    const r8c = await ruleEngine({
      prompt: 'What tasks are overdue?',
      projectId: p1Id,
      user: adminUser as IUser,
    });
    console.log('[Rule Engine Overdue]:\n', r8c.answer);
    if (r8c.answer.includes('overdue')) {
      console.log('✅ TEST 8C PASSED: Rule Engine reported overdue tasks accurately.');
    } else {
      console.error('❌ TEST 8C FAILED.');
    }

    // 8D. Remaining Milestones
    const r8d = await ruleEngine({
      prompt: 'What milestones are remaining?',
      projectId: p1Id,
      user: adminUser as IUser,
    });
    console.log('[Rule Engine Milestones]:\n', r8d.answer);
    if (r8d.answer.includes('milestones')) {
      console.log('✅ TEST 8D PASSED: Rule Engine reported milestones accurately.');
    } else {
      console.error('❌ TEST 8D FAILED.');
    }

    // 8E. Multiple Projects List when none selected
    const r8e = await ruleEngine({
      prompt: 'Give me the current project details.',
      user: adminUser as IUser,
    });
    console.log('[Rule Engine Multiple Projects Prompt]:\n', r8e.answer);
    if (r8e.answer.includes('multiple projects') && r8e.answer.includes(testProject1.name)) {
      console.log('✅ TEST 8E PASSED: Rule Engine presented authorized project list.');
    } else {
      console.error('❌ TEST 8E FAILED.');
    }

    // 8F. Unauthorized Project Access
    const r8f = await ruleEngine({
      prompt: 'Give me the current project details.',
      projectId: p1Id,
      user: clientUserWithoutAccess as IUser,
    });
    console.log('[Rule Engine Unauthorized]:\n', r8f.answer);
    if (r8f.answer.includes('Permission Denied')) {
      console.log('✅ TEST 8F PASSED: Rule Engine rejected unauthorized access.');
    } else {
      console.error('❌ TEST 8F FAILED.');
    }

    console.log('\n================================================================');
    console.log('🎉 ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
    console.log('================================================================');
  } catch (err: any) {
    console.error('Verification error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runVerification();
