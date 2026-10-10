import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../models/userModel';
import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'devflow_jwt_secret_dev_only';

const makeToken = (user: any) => {
  return jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '1h',
  });
};

async function runVerification() {
  console.log('================================================================');
  console.log('🚀 RUNNING COMPREHENSIVE END-TO-END FLOW VERIFICATION');
  console.log('================================================================');

  await mongoose.connect(process.env.MONGODB_URI as string);

  // 1. Get projects & users from live DB
  const projects = await Project.find();
  const targetProject = projects[0];
  console.log(`Loaded ${projects.length} projects. Target project: "${targetProject.name}" (ID: ${targetProject._id})`);

  const adminUser = await User.findOne({ role: 'Super Admin' });
  const devUser = await User.findOne({ role: 'Developer' });

  // Create or identify client user
  let clientUser = await User.findOne({ role: 'Client' });
  if (!clientUser) {
    clientUser = await User.create({
      name: 'Test Client',
      email: 'test.client@example.com',
      password: 'password123',
      role: 'Client',
      assignedProjects: [],
    });
  }

  const adminToken = makeToken(adminUser);
  const devToken = makeToken(devUser);
  const clientToken = makeToken(clientUser);

  let passedTests = 0;
  let totalTests = 8;

  // ────────────────────────────────────────────────────────────
  // TEST 1: Selected project details via HTTP POST /api/ai/assistant
  // ────────────────────────────────────────────────────────────
  console.log('\n--- TEST 1: Project is Selected ("Can you give the current project details?") ---');
  const res1 = await axios.post(
    `${BASE_URL}/ai/assistant`,
    {
      prompt: 'Can you give the current project details?',
      projectId: targetProject._id.toString(),
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );

  const answer1 = res1.data.data?.answer || '';
  console.log('Answer snippet:\n', answer1.slice(0, 400) + '...\n');

  const hasName = answer1.includes(targetProject.name);
  const hasClient = answer1.includes(targetProject.clientName);
  const hasProgress = answer1.includes(`${targetProject.progress}%`);
  const hasTeamMembers = answer1.includes('Assigned Team Members');
  const hasNextSteps = answer1.includes('Recommended Next Steps');
  const noIdPrompt = !answer1.toLowerCase().includes('provide the project id') && !answer1.toLowerCase().includes('provide a project id');

  if (hasName && hasClient && hasProgress && hasTeamMembers && hasNextSteps && noIdPrompt) {
    console.log('✅ TEST 1 PASSED: Full real project details returned with team members & next steps.');
    passedTests++;
  } else {
    console.error('❌ TEST 1 FAILED');
  }

  // ────────────────────────────────────────────────────────────
  // TEST 2: Specific queries ("How is my project progressing?", "What tasks are overdue?", "What milestones are remaining?")
  // ────────────────────────────────────────────────────────────
  console.log('\n--- TEST 2A: "How is my project progressing?" ---');
  const res2A = await axios.post(
    `${BASE_URL}/ai/assistant`,
    {
      prompt: 'How is my project progressing?',
      projectId: targetProject._id.toString(),
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const answer2A = res2A.data.data?.answer || '';
  const pass2A = answer2A.includes(`${targetProject.progress}%`) && answer2A.includes('Project Progress');
  console.log('Progress snippet:', answer2A.slice(0, 200).replace(/\n/g, ' '));
  if (pass2A) console.log('✅ TEST 2A PASSED');

  console.log('\n--- TEST 2B: "What tasks are overdue?" ---');
  const res2B = await axios.post(
    `${BASE_URL}/ai/assistant`,
    {
      prompt: 'What tasks are overdue?',
      projectId: targetProject._id.toString(),
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const answer2B = res2B.data.data?.answer || '';
  console.log('Overdue snippet:', answer2B.slice(0, 200).replace(/\n/g, ' '));
  const pass2B = answer2B.includes('overdue tasks') || answer2B.includes('no overdue tasks');
  if (pass2B) console.log('✅ TEST 2B PASSED');

  console.log('\n--- TEST 2C: "What milestones are remaining?" ---');
  const res2C = await axios.post(
    `${BASE_URL}/ai/assistant`,
    {
      prompt: 'What milestones are remaining?',
      projectId: targetProject._id.toString(),
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const answer2C = res2C.data.data?.answer || '';
  console.log('Milestones snippet:', answer2C.slice(0, 200).replace(/\n/g, ' '));
  const pass2C = answer2C.includes('milestones') || answer2C.includes('milestone');
  if (pass2C) console.log('✅ TEST 2C PASSED');

  if (pass2A && pass2B && pass2C) {
    passedTests++;
  }

  // ────────────────────────────────────────────────────────────
  // TEST 3: No project selected with MULTIPLE accessible projects
  // ────────────────────────────────────────────────────────────
  console.log('\n--- TEST 3: Multiple accessible projects and NO project selected ---');
  const res3 = await axios.post(
    `${BASE_URL}/ai/assistant`,
    {
      prompt: 'Can you give the current project details?',
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const answer3 = res3.data.data?.answer || '';
  console.log('Answer snippet:\n', answer3.slice(0, 300) + '...\n');
  const listsMultiple = answer3.includes('multiple projects') && answer3.includes(targetProject.name);
  if (listsMultiple) {
    console.log('✅ TEST 3 PASSED: Presented formatted list of authorized projects.');
    passedTests++;
  } else {
    console.error('❌ TEST 3 FAILED');
  }

  // ────────────────────────────────────────────────────────────
  // TEST 4: Auto-resolution when user has EXACTLY ONE accessible project
  // ────────────────────────────────────────────────────────────
  console.log('\n--- TEST 4: Auto-resolve context when user has exactly ONE accessible project ---');
  let singleDev = await User.findOne({ email: 'single.dev@devflow.demo' });
  if (!singleDev) {
    singleDev = await User.create({
      name: 'Single Dev User',
      email: 'single.dev@devflow.demo',
      password: 'password123',
      role: 'Developer',
      assignedProjects: [targetProject._id],
    });
  }
  await Task.create({
    projectId: targetProject._id.toString(),
    projectName: targetProject.name,
    title: 'Sole Dev Assignment Task',
    dueDate: '2026-11-01',
    assignee: {
      id: singleDev._id.toString(),
      name: singleDev.name,
      email: singleDev.email,
      role: 'Developer',
    },
    status: 'In Progress',
  });
  const singleDevToken = makeToken(singleDev);

  const res4 = await axios.post(
    `${BASE_URL}/ai/assistant`,
    {
      prompt: 'Can you give the current project details?',
    },
    { headers: { Authorization: `Bearer ${singleDevToken}` } }
  );
  const answer4 = res4.data.data?.answer || '';
  console.log('Answer snippet:\n', answer4.slice(0, 300) + '...\n');
  const autoResolved = answer4.includes(targetProject.name) && !answer4.includes('multiple projects');
  if (autoResolved) {
    console.log('✅ TEST 4 PASSED: Single accessible project was resolved automatically.');
    passedTests++;
  } else {
    console.error('❌ TEST 4 FAILED');
  }

  // ────────────────────────────────────────────────────────────
  // TEST 5: Unauthorized project access rejected safely
  // ────────────────────────────────────────────────────────────
  console.log('\n--- TEST 5: Unauthorized project access rejection ---');
  const res5 = await axios.post(
    `${BASE_URL}/ai/assistant`,
    {
      prompt: 'Can you give the current project details?',
      projectId: targetProject._id.toString(),
    },
    { headers: { Authorization: `Bearer ${clientToken}` } }
  );
  const answer5 = res5.data.data?.answer || '';
  console.log('Answer:\n', answer5);
  const rejected = answer5.includes('Permission Denied') || answer5.includes('not authorized');
  const noLeak = !answer5.includes(targetProject.description);
  if (rejected && noLeak) {
    console.log('✅ TEST 5 PASSED: Unauthorized access rejected with zero project data leak.');
    passedTests++;
  } else {
    console.error('❌ TEST 5 FAILED');
  }

  // ────────────────────────────────────────────────────────────
  // TEST 6: User with NO accessible projects
  // ────────────────────────────────────────────────────────────
  console.log('\n--- TEST 6: User with NO accessible projects ---');
  const res6 = await axios.post(
    `${BASE_URL}/ai/assistant`,
    {
      prompt: 'Can you give the current project details?',
    },
    { headers: { Authorization: `Bearer ${clientToken}` } }
  );
  const answer6 = res6.data.data?.answer || '';
  console.log('Answer:\n', answer6);
  const noProjectsHandled = answer6.toLowerCase().includes('no accessible projects') || answer6.toLowerCase().includes('not find any accessible');
  if (noProjectsHandled) {
    console.log('✅ TEST 6 PASSED: Correctly explained that no accessible projects exist without hallucinating.');
    passedTests++;
  } else {
    console.error('❌ TEST 6 FAILED');
  }

  // ────────────────────────────────────────────────────────────
  // TEST 7: Regression check: Existing AI features ("Who are you?" & "What is JWT?")
  // ────────────────────────────────────────────────────────────
  console.log('\n--- TEST 7: Existing AI Assistant capabilities regression check ---');
  const res7A = await axios.post(
    `${BASE_URL}/ai/assistant`,
    {
      prompt: 'Who are you?',
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const answer7A = res7A.data.data?.answer || '';
  console.log('Who are you snippet:\n', answer7A.slice(0, 150) + '...\n');

  const res7B = await axios.post(
    `${BASE_URL}/ai/assistant`,
    {
      prompt: 'What is JWT?',
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const answer7B = res7B.data.data?.answer || '';
  console.log('What is JWT snippet:\n', answer7B.slice(0, 150) + '...\n');

  const pass7 = answer7A.toLowerCase().includes('assistant') && (answer7B.toLowerCase().includes('token') || answer7B.toLowerCase().includes('jwt'));
  if (pass7) {
    console.log('✅ TEST 7 PASSED: Preserved existing identity and general technical guidance.');
    passedTests++;
  } else {
    console.error('❌ TEST 7 FAILED');
  }

  // ────────────────────────────────────────────────────────────
  // TEST 8: Invalid / non-existent Project ID
  // ────────────────────────────────────────────────────────────
  console.log('\n--- TEST 8: Missing / non-existent Project ID ---');
  const res8 = await axios.post(
    `${BASE_URL}/ai/assistant`,
    {
      prompt: 'Can you give the current project details?',
      projectId: '650000000000000000099999',
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const answer8 = res8.data.data?.answer || '';
  console.log('Answer:\n', answer8);
  const pass8 = answer8.toLowerCase().includes('no accessible') || answer8.toLowerCase().includes('not find');
  if (pass8) {
    console.log('✅ TEST 8 PASSED: Non-existent project handled cleanly.');
    passedTests++;
  } else {
    console.error('❌ TEST 8 FAILED');
  }

  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');

  await mongoose.disconnect();

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err.response?.data || err.message || err);
  process.exit(1);
});
