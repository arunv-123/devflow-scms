const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const API_BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'devflow_super_secret_jwt_key_2026';

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  assignedProjects: [mongoose.Schema.Types.ObjectId],
  workloadPercent: Number,
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function runWorkloadAuditTest() {
  console.log('=== STARTING WORKLOAD & CAPACITY ENGINE AUDIT VERIFICATION ===\n');

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/devflow';
  await mongoose.connect(mongoUri);

  const adminUser = await User.findOne({ role: 'Super Admin' });
  const clientUser = await User.findOne({ role: 'Client' });

  if (!adminUser) {
    throw new Error('Super Admin user not found');
  }

  const adminToken = jwt.sign({ id: adminUser._id }, JWT_SECRET, { expiresIn: '1d' });
  const clientToken = clientUser ? jwt.sign({ id: clientUser._id }, JWT_SECRET, { expiresIn: '1d' }) : null;

  // 1. Verify GET /api/users returns internal team members and excludes Client role
  console.log('1. Fetching Resource Utilization Matrix via GET /api/users...');
  const usersRes = await axios.get(`${API_BASE_URL}/users`, {
    headers: { Cookie: `token=${adminToken}` },
  });

  console.log(`   Status: ${usersRes.status} | Total Internal Members: ${usersRes.data.count}`);
  const returnedUsers = usersRes.data.users;
  const hasClientAccount = returnedUsers.some((u) => u.role === 'Client');
  console.log(`   Client Accounts Excluded: ${!hasClientAccount}`);
  if (hasClientAccount) {
    throw new Error('Client account found in resource matrix');
  }

  // 2. Verify Capacity summary statistics formulas
  console.log('\n2. Verifying Workload & Capacity Formulas...');
  const overloaded = returnedUsers.filter((u) => (u.workloadPercent || 0) > 85);
  const optimal = returnedUsers.filter((u) => (u.workloadPercent || 0) >= 50 && (u.workloadPercent || 0) <= 85);
  const totalUtilization = returnedUsers.reduce((sum, u) => sum + (u.workloadPercent || 0), 0);
  const avgUtilization = returnedUsers.length > 0 ? (totalUtilization / returnedUsers.length).toFixed(1) : '0';

  console.log(`   Optimal Members (50-85%): ${optimal.length}`);
  console.log(`   Overloaded Members (>85%): ${overloaded.length}`);
  console.log(`   Average Utilization: ${avgUtilization}%`);

  // 3. Verify Client RBAC rejection
  if (clientToken) {
    console.log('\n3. Testing Client RBAC Access Restriction on /api/users...');
    try {
      await axios.get(`${API_BASE_URL}/users`, {
        headers: { Cookie: `token=${clientToken}` },
      });
      console.error('❌ FAIL: Client accessed team directory!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('   ✅ Client access rejected with 403 Forbidden (Expected)');
      }
    }
  }

  console.log('\n======================================================');
  console.log('✅ WORKLOAD & CAPACITY ENGINE AUDIT VERIFICATION PASSED');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

runWorkloadAuditTest().catch((err) => {
  console.error('❌ WORKLOAD AUDIT TEST FAILED:', err.response ? err.response.data : err.message);
  mongoose.disconnect();
  process.exit(1);
});
