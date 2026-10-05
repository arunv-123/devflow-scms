const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devflow';

async function testTaskRecBugFix() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const { Project } = require('../models/projectModel');
    const { aiService } = require('../services/aiService');
    const { ProjectService } = require('../services/projectService');

    const project = await Project.findOne();
    if (!project) {
      console.log('No project found');
      return;
    }

    console.log(`Testing Project: ${project.name} (${project._id})`);
    const projectMembersCount = (project.members || []).length + (project.manager ? 1 : 0);
    console.log(`Project Team Size: ${projectMembersCount}`);

    const recs = await aiService.getTaskAssigneeRecommendations(project._id.toString(), ['TypeScript', 'React']);
    console.log(`Task Assignee Recommendations Count: ${recs.length}`);
    console.log('Recommendations list:', recs.map(r => ({
      name: r.name,
      role: r.role,
      matchScore: r.matchScore,
      isExistingMember: r.isExistingMember
    })));

    // Verify all recommended members belong to project team
    const eligibleRefs = await ProjectService.getEligibleAssignees(project._id.toString());
    const eligibleIds = new Set(eligibleRefs.map(m => m.id));

    const invalidRecs = recs.filter(r => !eligibleIds.has(r.memberId));
    if (invalidRecs.length > 0) {
      console.error('FAIL: Found non-project members in recommendation:', invalidRecs);
    } else {
      console.log('SUCCESS: All task assignee recommendations strictly belong to the project team!');
    }
  } catch (err) {
    console.error('Error in test:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testTaskRecBugFix();
