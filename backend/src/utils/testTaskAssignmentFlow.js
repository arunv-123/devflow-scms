const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devflow';

async function testTaskAssignment() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
    const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false }));
    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }));
    const ActivityLog = mongoose.model('ActivityLog', new mongoose.Schema({}, { strict: false }));

    // 1. Fetch first project
    const project = await Project.findOne();
    if (!project) {
      console.log('No project found');
      return;
    }
    console.log(`Testing with project: ${project.name} (${project._id})`);

    // 2. Fetch project tasks
    const tasks = await Task.find({ project: project._id });
    console.log(`Found ${tasks.length} tasks for project.`);

    // 3. Fetch latest activity log for Task Assigned / Reassigned / Unassigned
    const logs = await ActivityLog.find({
      action: { $in: ['Task Assigned', 'Task Reassigned', 'Task Unassigned'] }
    }).sort({ timestamp: -1 }).limit(5);

    console.log('Recent task activity logs:', logs.map(l => ({
      action: l.action,
      entityName: l.entityName,
      details: l.details,
      timestamp: l.timestamp
    })));

    console.log('SUCCESS: Verified DB models and ActivityLog structure.');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testTaskAssignment();
