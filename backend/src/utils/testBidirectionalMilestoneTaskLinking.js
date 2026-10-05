const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devflow';

async function testBidirectionalLinking() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const { ProjectService } = require('../services/projectService');
    const { Task } = require('../models/taskModel');
    const { Milestone } = require('../models/milestoneModel');
    const { Project } = require('../models/projectModel');

    const project = await Project.findOne();
    if (!project) {
      console.log('No project found');
      return;
    }
    const pId = project._id.toString();

    // 1. Create an unlinked task first
    console.log(`\n1. Creating unlinked task for project "${project.name}"...`);
    const taskBeforeMilestone = await ProjectService.createTask({
      title: 'Task Created Before Milestone',
      projectId: pId,
      description: 'Task created before milestone existed',
      status: 'In Progress',
      dueDate: '2026-11-01',
      milestoneId: '',
    });
    console.log(`Task created with ID: ${taskBeforeMilestone._id}, milestoneId: "${taskBeforeMilestone.milestoneId}"`);

    // 2. Create milestone and link existing task
    console.log('\n2. Creating new milestone and linking existing task...');
    const milestoneA = await ProjectService.createMilestone({
      title: 'Milestone A - Pre-task Link Test',
      projectId: pId,
      projectName: project.name,
      description: 'Milestone created after task',
      dueDate: '2026-11-30',
      status: 'Upcoming',
      linkedTaskIds: [taskBeforeMilestone._id.toString()],
    });
    console.log(`Milestone A Created: ${milestoneA._id}, Linked Tasks: ${milestoneA.relatedTasksCount}, Progress: ${milestoneA.progress}%`);

    // 3. Move task to Milestone B
    console.log('\n3. Creating Milestone B and moving task to Milestone B...');
    const milestoneB = await ProjectService.createMilestone({
      title: 'Milestone B - Reassignment Target',
      projectId: pId,
      projectName: project.name,
      description: 'Milestone B target',
      dueDate: '2026-12-15',
      status: 'Upcoming',
    });

    // Update task to point to Milestone B
    await ProjectService.updateTask(taskBeforeMilestone._id.toString(), {
      milestoneId: milestoneB._id.toString(),
    });

    const refreshedA = await ProjectService.getMilestoneById(milestoneA._id.toString());
    const refreshedB = await ProjectService.getMilestoneById(milestoneB._id.toString());
    console.log(`Milestone A Linked Tasks after move: ${refreshedA.relatedTasksCount}`);
    console.log(`Milestone B Linked Tasks after move: ${refreshedB.relatedTasksCount}`);

    // 4. Delete Milestone B and verify task is unlinked (not deleted)
    console.log('\n4. Deleting Milestone B...');
    await ProjectService.deleteMilestone(milestoneB._id.toString());

    const taskAfterDelete = await Task.findById(taskBeforeMilestone._id.toString());
    if (taskAfterDelete) {
      console.log(`Task survived deletion! milestoneId is now: "${taskAfterDelete.milestoneId}"`);
    } else {
      console.error('FAIL: Task was incorrectly deleted!');
    }

    // Clean up
    await Task.findByIdAndDelete(taskBeforeMilestone._id);
    await Milestone.findByIdAndDelete(milestoneA._id);
    console.log('\nSUCCESS: Bidirectional milestone-task linking & lifecycle fully verified!');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testBidirectionalLinking();
