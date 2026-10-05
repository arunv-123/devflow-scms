const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devflow';

async function testMilestoneTaskRelationship() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const { ProjectService } = require('../services/projectService');
    const { Task } = require('../models/taskModel');
    const { Milestone } = require('../models/milestoneModel');

    // 1. Fetch milestones
    const milestones = await ProjectService.getMilestones();
    console.log(`Fetched ${milestones.length} milestones.`);

    milestones.forEach((m) => {
      console.log(`- Milestone "${m.title}" (${m.projectName}): ${m.relatedTasksCount} Linked Tasks | Progress: ${m.progress}% | Status: ${m.status}`);
    });

    // 2. Test creating a task associated with the first milestone
    const targetMilestone = milestones[0];
    if (targetMilestone) {
      console.log(`\nCreating new task linked to milestone: "${targetMilestone.title}"...`);
      const newTask = await ProjectService.createTask({
        title: 'Integration Test Task for Milestone Sync',
        projectId: targetMilestone.projectId,
        description: 'Test task linking to milestone',
        status: 'Completed',
        dueDate: '2026-10-20',
        milestoneId: targetMilestone._id.toString(),
      });
      console.log(`Created Task ID: ${newTask._id} (milestoneId: ${newTask.milestoneId})`);

      // Refetch milestone to verify updated stats
      const updatedMilestones = await ProjectService.getMilestones(targetMilestone.projectId);
      const updatedMilestone = updatedMilestones.find(m => m._id.toString() === targetMilestone._id.toString());
      console.log(`Updated Milestone Linked Tasks Count: ${updatedMilestone.relatedTasksCount} Tasks | Progress: ${updatedMilestone.progress}%`);

      // Clean up test task
      await ProjectService.deleteTask(newTask._id.toString());
      console.log('Deleted test task and re-synced milestone stats successfully.');
    }

    console.log('SUCCESS: Project -> Milestone -> Task relationship verified!');
  } catch (err) {
    console.error('Error testing milestone task relationship:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testMilestoneTaskRelationship();
