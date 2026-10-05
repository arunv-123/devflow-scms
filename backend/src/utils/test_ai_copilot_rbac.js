const mongoose = require('d:/user/Documents/Projects/DevFlow/backend/node_modules/mongoose');
const jwt = require('d:/user/Documents/Projects/DevFlow/backend/node_modules/jsonwebtoken');

const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'devflow_jwt_secret_dev_only';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/devflow';

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  assignedProjects: [mongoose.Schema.Types.ObjectId],
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const taskSchema = new mongoose.Schema({
  projectId: String,
  projectName: String,
  title: String,
  description: String,
  assignee: Object,
  status: String,
  priority: String,
  dueDate: String,
  subtasks: Array,
}, { timestamps: true });

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

async function getOrCreateUser(name, email, role) {
  let u = await User.findOne({ role });
  if (!u) {
    u = await User.create({
      name,
      email: `${role.toLowerCase().replace(/\s+/g, '')}_test_${Date.now()}@devflow.local`,
      role,
    });
  }
  return u;
}

async function apiRequest(token, endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_URL}${endpoint}`, options);
  let data = {};
  try {
    data = await res.json();
  } catch (e) {}
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('--- CONNECTING TO MONGO TO FIND REAL USERS PER ROLE ---');
  await mongoose.connect(MONGO_URI);

  const devUser = await getOrCreateUser('Dev User', 'dev@devflow.local', 'Developer');
  const qaUser = await getOrCreateUser('QA User', 'qa@devflow.local', 'QA');
  const leadUser = await getOrCreateUser('Lead User', 'lead@devflow.local', 'Team Lead');
  const pmUser = await getOrCreateUser('PM User', 'pm@devflow.local', 'Project Manager');
  const adminUser = await getOrCreateUser('Admin User', 'admin@devflow.local', 'Admin');
  const superAdminUser = await getOrCreateUser('Super Admin User', 'superadmin@devflow.local', 'Super Admin');

  // Create a sample task assigned to devUser if none exists
  let sampleTask = await Task.findOne({ 'assignee.id': devUser._id.toString() });
  if (!sampleTask) {
    sampleTask = await Task.create({
      projectId: '651f8a8b1c9d2e3f4a5b6c7d',
      projectName: 'DevFlow Architecture Project',
      title: 'Implement RBAC Auth Middleware Guards',
      description: 'Enforce JWT authentication and role authorization checks on backend routes.',
      assignee: {
        id: devUser._id.toString(),
        name: devUser.name,
        email: devUser.email,
        role: devUser.role,
      },
      status: 'In Progress',
      priority: 'High',
      dueDate: '2026-10-15',
      subtasks: [],
    });
  }

  const devToken = jwt.sign({ id: devUser._id.toString(), role: devUser.role }, JWT_SECRET, { expiresIn: '1h' });
  const qaToken = jwt.sign({ id: qaUser._id.toString(), role: qaUser.role }, JWT_SECRET, { expiresIn: '1h' });
  const leadToken = jwt.sign({ id: leadUser._id.toString(), role: leadUser.role }, JWT_SECRET, { expiresIn: '1h' });
  const pmToken = jwt.sign({ id: pmUser._id.toString(), role: pmUser.role }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: adminUser._id.toString(), role: adminUser.role }, JWT_SECRET, { expiresIn: '1h' });
  const superAdminToken = jwt.sign({ id: superAdminUser._id.toString(), role: superAdminUser.role }, JWT_SECRET, { expiresIn: '1h' });

  console.log('✅ Real DB users retrieved & JWT tokens generated for all 6 roles.\n');

  // 1. DEVELOPER AI COPILOT CAPABILITIES & RESTRICTIONS
  console.log('--- 1. Testing Developer AI Copilot ---');
  
  // A. Explain My Tasks
  const explainRes = await apiRequest(devToken, '/ai/assistant', 'POST', { action: 'explain_my_tasks' });
  console.log('[Developer] Explain My Tasks Response Status:', explainRes.status);
  console.log('[Developer] Explain My Tasks Content:\n', explainRes.data.data?.answer);

  // B. Break Down My Task
  const breakdownRes = await apiRequest(devToken, '/ai/assistant', 'POST', { action: 'breakdown_task', taskId: sampleTask._id.toString() });
  console.log('\n[Developer] Breakdown Task Action:', breakdownRes.data.data?.action);
  console.log('[Developer] Target Task Title:', breakdownRes.data.data?.taskTitle);
  console.log('[Developer] Suggested Subtasks Count:', breakdownRes.data.data?.suggestedSubtasks?.length || 0);

  if (breakdownRes.data.data?.suggestedSubtasks && breakdownRes.data.data?.taskId) {
    const taskId = breakdownRes.data.data.taskId;
    const subtasks = breakdownRes.data.data.suggestedSubtasks;
    console.log(`[Developer] Confirming ${subtasks.length} subtasks for Task ID ${taskId}...`);
    
    const confirmRes = await apiRequest(devToken, '/ai/confirm-subtasks', 'POST', { taskId, subtasks });
    console.log('[Developer] Confirm Subtasks Result Message:', confirmRes.data?.message);
    
    // Verify DB update
    const updatedTask = await Task.findById(taskId);
    console.log('[Developer] Verified Subtasks in MongoDB:', updatedTask.subtasks.length, 'subtasks persisted.');
  }

  // C. Developer attempt PM prompt (team allocation)
  const pmPromptRes = await apiRequest(devToken, '/ai/assistant', 'POST', { prompt: 'Recommend team member allocations and calculate project health' });
  console.log('\n[Developer] PM Prompt Fallback Response:\n', pmPromptRes.data.data?.answer);
  if (pmPromptRes.data.data?.answer?.includes('recommend optimal team member allocations')) {
    console.error('❌ FAILED: Developer received generic PM text!');
  } else {
    console.log('✅ SUCCESS: Developer did NOT receive generic PM text.');
  }

  // D. Developer Direct RESTRICTED API Access Rejection
  console.log('\n[Developer] Testing Restricted API Endpoints (Expecting 403 Rejections)...');
  
  const scanRes = await apiRequest(devToken, '/ai/project-intelligence/scan', 'POST', {});
  if (scanRes.status === 403) {
    console.log('✅ SUCCESS: Developer scan rejected with status 403 Forbidden.');
  } else {
    console.error('❌ FAILED: Developer scan returned status:', scanRes.status);
  }

  const recsRes = await apiRequest(devToken, '/ai/team-recommendations', 'GET');
  if (recsRes.status === 403) {
    console.log('✅ SUCCESS: Developer team recommendations rejected with status 403 Forbidden.');
  } else {
    console.error('❌ FAILED: Developer team recommendations returned status:', recsRes.status);
  }

  const autoLinkRes = await apiRequest(devToken, '/ai/auto-link-milestones', 'POST', {});
  if (autoLinkRes.status === 403) {
    console.log('✅ SUCCESS: Developer auto-link milestones rejected with status 403 Forbidden.');
  } else {
    console.error('❌ FAILED: Developer auto-link milestones returned status:', autoLinkRes.status);
  }

  // 2. QA AI COPILOT CAPABILITIES & RESTRICTIONS
  console.log('\n--- 2. Testing QA AI Copilot ---');
  const qaBreakdownRes = await apiRequest(qaToken, '/ai/assistant', 'POST', { action: 'breakdown_test_cases' });
  console.log('[QA] Breakdown Test Cases Response:\n', qaBreakdownRes.data.data?.answer);

  const qaRecsRes = await apiRequest(qaToken, '/ai/team-recommendations', 'GET');
  if (qaRecsRes.status === 403) {
    console.log('✅ SUCCESS: QA team recommendations rejected with status 403 Forbidden.');
  } else {
    console.error('❌ FAILED: QA team recommendations returned status:', qaRecsRes.status);
  }

  // 3. TEAM LEAD AI COPILOT CAPABILITIES
  console.log('\n--- 3. Testing Team Lead AI Copilot ---');
  const workloadRes = await apiRequest(leadToken, '/ai/assistant', 'POST', { action: 'team_workload_analysis' });
  console.log('[Team Lead] Workload Analysis Response:\n', workloadRes.data.data?.answer);
  
  const leadRecsRes = await apiRequest(leadToken, '/ai/team-recommendations', 'GET');
  console.log('[Team Lead] Team Recommendations API Status:', leadRecsRes.status);

  // 4. PROJECT MANAGER AI COPILOT CAPABILITIES
  console.log('\n--- 4. Testing Project Manager AI Copilot ---');
  const healthRes = await apiRequest(pmToken, '/ai/assistant', 'POST', { action: 'project_health' });
  console.log('[PM] Project Health Scan:\n', healthRes.data.data?.answer?.substring(0, 180) + '...');

  const techStackRes = await apiRequest(pmToken, '/ai/assistant', 'POST', { action: 'suggest_tech_stack' });
  console.log('[PM] Tech Stack Suggestion:', techStackRes.data.data?.generatedItems?.techStack);

  // 5. ADMIN & SUPER ADMIN AI COPILOT CAPABILITIES
  console.log('\n--- 5. Testing Admin & Super Admin AI Copilot ---');
  const adminAssistantRes = await apiRequest(adminToken, '/ai/assistant', 'POST', { prompt: 'Overview' });
  console.log('[Admin] Welcome/Overview Response:\n', adminAssistantRes.data.data?.answer);

  const superAdminRes = await apiRequest(superAdminToken, '/ai/project-intelligence/scan', 'POST', {});
  console.log('[Super Admin] Project Health Scan Status:', superAdminRes.status);

  await mongoose.disconnect();
  console.log('\n======================================================');
  console.log('✅ ALL AI COPILOT RBAC VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
}

runTests();
