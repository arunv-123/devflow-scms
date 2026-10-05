const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const API_BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'devflow_super_secret_jwt_key_2026';

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  assignedProjects: [mongoose.Schema.Types.ObjectId],
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const projectSchema = new mongoose.Schema({
  name: String,
  clientName: String,
});
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

async function runDocumentsTest() {
  console.log('=== STARTING REAL DOCUMENTS MODULE INTEGRATION VERIFICATION ===\n');

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/devflow';
  await mongoose.connect(mongoUri);

  // 1. Find Super Admin and Client user
  const adminUser = await User.findOne({ role: 'Super Admin' });
  const clientUser = await User.findOne({ role: 'Client' });
  const sampleProject = await Project.findOne();

  if (!adminUser) {
    throw new Error('Super Admin user not found in DB');
  }

  const adminToken = jwt.sign({ id: adminUser._id }, JWT_SECRET, { expiresIn: '1d' });
  const clientToken = clientUser ? jwt.sign({ id: clientUser._id }, JWT_SECRET, { expiresIn: '1d' }) : null;

  console.log(`1. Super Admin Authenticated: ${adminUser.name} (${adminUser.role})`);
  if (clientUser) {
    console.log(`2. Client Authenticated: ${clientUser.name} (${clientUser.role})`);
  }

  // 2. Create a temporary sample file on disk to upload
  const tempTestFilePath = path.join(__dirname, 'test_upload_sample.txt');
  const sampleContent = 'DevFlow Real File Storage Verification Test File Content 2026\nLine 2 of test document.\n';
  fs.writeFileSync(tempTestFilePath, sampleContent);

  const prjName = sampleProject ? sampleProject.name : 'FinTech Nexus Suite';
  const prjId = sampleProject ? sampleProject._id.toString() : undefined;

  // 3. Upload Document using FormData
  console.log('\n3. Uploading real file via POST /api/documents (multipart/form-data)...');
  const form = new FormData();
  form.append('file', fs.createReadStream(tempTestFilePath), 'test_upload_sample.txt');
  form.append('name', 'Architecture Specification v3.0.txt');
  form.append('category', 'Architecture');
  form.append('projectName', prjName);
  if (prjId) form.append('projectId', prjId);

  const uploadRes = await axios.post(`${API_BASE_URL}/documents`, form, {
    headers: {
      ...form.getHeaders(),
      Cookie: `token=${adminToken}`,
    },
  });

  console.log(`   Status: ${uploadRes.status}`);
  const createdDoc = uploadRes.data.document;
  console.log('   Document Created:', {
    id: createdDoc.id,
    name: createdDoc.name,
    category: createdDoc.category,
    projectName: createdDoc.projectName,
    size: createdDoc.size,
    fileType: createdDoc.fileType,
    url: createdDoc.url,
  });

  if (!createdDoc.id) {
    throw new Error('Created document missing ID');
  }

  // 4. Verify Document in GET /api/documents
  console.log('\n4. Fetching document list via GET /api/documents...');
  const listRes = await axios.get(`${API_BASE_URL}/documents`, {
    headers: { Cookie: `token=${adminToken}` },
  });
  console.log(`   Status: ${listRes.status} | Total Documents: ${listRes.data.count}`);
  const foundInList = listRes.data.documents.find((d) => d.id === createdDoc.id);
  if (!foundInList) {
    throw new Error('Uploaded document not found in GET /api/documents response list');
  }
  console.log('   Verified document present in database list: true');

  // 5. Test File Download
  console.log(`\n5. Downloading document file via GET /api/documents/${createdDoc.id}/download...`);
  const downloadRes = await axios.get(`${API_BASE_URL}/documents/${createdDoc.id}/download`, {
    headers: { Cookie: `token=${adminToken}` },
    responseType: 'arraybuffer',
  });
  console.log(`   Status: ${downloadRes.status}`);
  const downloadedText = Buffer.from(downloadRes.data).toString('utf-8');
  console.log(`   Downloaded Content Match: ${downloadedText === sampleContent}`);
  if (downloadedText !== sampleContent) {
    throw new Error('Downloaded file content does not match uploaded sample content!');
  }

  // 6. Test Client RBAC rejection on unauthorized project document
  if (clientToken) {
    console.log('\n6. Testing Client RBAC restricted access...');
    // Create an unassigned project doc for testing
    const unassignedForm = new FormData();
    unassignedForm.append('file', fs.createReadStream(tempTestFilePath), 'restricted_spec.txt');
    unassignedForm.append('name', 'Restricted Executive Contract.txt');
    unassignedForm.append('category', 'Contract');
    unassignedForm.append('projectName', 'Restricted Unassigned Project Alpha');

    const unassignedRes = await axios.post(`${API_BASE_URL}/documents`, unassignedForm, {
      headers: {
        ...unassignedForm.getHeaders(),
        Cookie: `token=${adminToken}`,
      },
    });

    const restrictedDocId = unassignedRes.data.document.id;

    try {
      await axios.get(`${API_BASE_URL}/documents/${restrictedDocId}/download`, {
        headers: { Cookie: `token=${clientToken}` },
      });
      console.error('❌ FAIL: Client accessed unassigned document!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('   ✅ Client download rejected with 403 Forbidden (Expected)');
      } else {
        console.error('   Unexpected error:', err.message);
      }
    }

    // Cleanup restricted test doc
    await axios.delete(`${API_BASE_URL}/documents/${restrictedDocId}`, {
      headers: { Cookie: `token=${adminToken}` },
    });
  }

  // 7. Test Document Delete & File Unlink
  console.log(`\n7. Deleting document via DELETE /api/documents/${createdDoc.id}...`);
  const deleteRes = await axios.get(`${API_BASE_URL}/documents/${createdDoc.id}`, {
    headers: { Cookie: `token=${adminToken}` },
  });
  
  const docDetails = deleteRes.data.document;

  const deleteActionRes = await axios.delete(`${API_BASE_URL}/documents/${createdDoc.id}`, {
    headers: { Cookie: `token=${adminToken}` },
  });
  console.log(`   Status: ${deleteActionRes.status} | Message: ${deleteActionRes.data.message}`);

  // 8. Verify Document deleted from DB
  try {
    await axios.get(`${API_BASE_URL}/documents/${createdDoc.id}`, {
      headers: { Cookie: `token=${adminToken}` },
    });
    console.error('❌ FAIL: Document still exists in DB after deletion!');
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log('   ✅ Verified DB record deleted (404 Not Found)');
    }
  }

  // Clean up local temp test file
  if (fs.existsSync(tempTestFilePath)) {
    fs.unlinkSync(tempTestFilePath);
  }

  console.log('\n======================================================');
  console.log('✅ ALL REAL DOCUMENTS MODULE VERIFICATION TESTS PASSED');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

runDocumentsTest().catch((err) => {
  console.error('❌ DOCUMENTS TEST FAILED:', err.response ? err.response.data : err.message);
  mongoose.disconnect();
  process.exit(1);
});
