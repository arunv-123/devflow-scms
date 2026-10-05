const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { ProjectService } = require('../../dist/services/projectService');
const { Task } = require('../../dist/models/taskModel');
const { Milestone } = require('../../dist/models/milestoneModel');

async function debugMilestones() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devflow';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const allTasks = await Task.find();
    console.log(`\nTotal Tasks in DB: ${allTasks.length}`);
    allTasks.forEach((t) => {
      console.log(`- Task "${t.title}" (id: ${t._id}) | projectId: "${t.projectId}" | milestoneId: "${t.milestoneId}" | status: "${t.status}"`);
    });

    const allMilestones = await Milestone.find();
    console.log(`\nTotal Milestones in DB: ${allMilestones.length}`);
    allMilestones.forEach((m) => {
      console.log(`- Milestone "${m.title}" (_id: ${m._id}, id: ${m.id}) | projectId: "${m.projectId}" | relatedTasksCount: ${m.relatedTasksCount} | progress: ${m.progress}% | status: "${m.status}"`);
    });

    console.log('\n--- Calling ProjectService.getMilestones() ---');
    const serviceMilestones = await ProjectService.getMilestones();
    serviceMilestones.forEach((m) => {
      console.log(`- Result Milestone "${m.title}" (_id: ${m._id}) | relatedTasksCount: ${m.relatedTasksCount} | progress: ${m.progress}% | status: "${m.status}"`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Debug error:', err);
  }
}

debugMilestones();
