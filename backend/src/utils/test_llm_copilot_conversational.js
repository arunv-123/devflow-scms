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

async function runConversationalTests() {
  console.log('--- STARTING CONVERSATIONAL LLM & TOOL CALLING TESTS ---');
  await mongoose.connect(MONGO_URI);

  const devUser = await User.findOne({ role: 'Developer' }) || await User.create({ name: 'Dev Test User', email: 'dev_conv_test@devflow.local', role: 'Developer' });
  const pmUser = await User.findOne({ role: 'Project Manager' }) || await User.create({ name: 'PM Test User', email: 'pm_conv_test@devflow.local', role: 'Project Manager' });

  const devToken = jwt.sign({ id: devUser._id.toString(), role: 'Developer' }, JWT_SECRET, { expiresIn: '1h' });
  const pmToken = jwt.sign({ id: pmUser._id.toString(), role: 'Project Manager' }, JWT_SECRET, { expiresIn: '1h' });

  // 1. Natural Conversation Tests for Developer
  console.log('\n--- 1. Testing Natural Conversation ("Hi", "How are you?", "What is JWT?") ---');
  
  const hiRes = await apiRequest(devToken, '/ai/assistant', 'POST', { prompt: 'Hi' });
  console.log('[Dev] Prompt "Hi":\n', hiRes.data.data?.answer);

  const howRes = await apiRequest(devToken, '/ai/assistant', 'POST', { prompt: 'How are you?' });
  console.log('[Dev] Prompt "How are you?":\n', howRes.data.data?.answer);

  const jwtRes = await apiRequest(devToken, '/ai/assistant', 'POST', { prompt: 'What is JWT and how does signature verification work?' });
  console.log('[Dev] Prompt "What is JWT?":\n', jwtRes.data.data?.answer?.substring(0, 200) + '...');

  const restRes = await apiRequest(devToken, '/ai/assistant', 'POST', { prompt: 'Explain REST APIs' });
  console.log('[Dev] Prompt "Explain REST APIs":\n', restRes.data.data?.answer?.substring(0, 200) + '...');

  // 2. Developer requesting PM action (Team Allocation) -> RBAC Tool Blocked
  console.log('\n--- 2. Testing Developer RBAC Tool Execution Rejection ---');
  const devRecRes = await apiRequest(devToken, '/ai/assistant', 'POST', { prompt: 'Recommend a developer for this task' });
  console.log('[Dev] Prompt "Recommend a developer for this task":\n', devRecRes.data.data?.answer);

  // 3. PM requesting PM action -> Authorized Tool Execution
  console.log('\n--- 3. Testing Project Manager Authorized Tool Execution ---');
  const pmHealthRes = await apiRequest(pmToken, '/ai/assistant', 'POST', { prompt: 'Analyze the health of my project' });
  console.log('[PM] Prompt "Analyze the health of my project":\n', pmHealthRes.data.data?.answer?.substring(0, 200) + '...');

  await mongoose.disconnect();
  console.log('\n======================================================');
  console.log('✅ ALL LLM CONVERSATIONAL & TOOL CALLING TESTS COMPLETED!');
  console.log('======================================================');
}

runConversationalTests();
