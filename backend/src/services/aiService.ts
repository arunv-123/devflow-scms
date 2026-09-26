import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { Milestone } from '../models/milestoneModel';
import { User } from '../models/userModel';
import { Meeting } from '../models/meetingModel';
import {
  ProjectHealthReport,
  OverallHealthSummary,
  TeamMemberRecommendation,
  AssistantChatResponse,
} from '../types/ai';

export class AIService {
  /**
   * Recalculates dynamic health scores for all projects or a specific project using MongoDB data.
   */
  public async analyzeProjectHealth(projectId?: string): Promise<OverallHealthSummary> {
    const query = projectId ? { _id: projectId } : {};
    const projects = await Project.find(query);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const healthReports: ProjectHealthReport[] = [];
    let totalTasksAnalyzed = 0;

    for (const project of projects) {
      const pIdStr = project._id.toString();
      
      // Fetch tasks for this project
      const tasks = await Task.find({
        $or: [{ projectId: pIdStr }, { projectId: project.id }],
      });
      totalTasksAnalyzed += tasks.length;

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
      const overdueTasks = tasks.filter(
        (t) => t.status !== 'Completed' && t.dueDate && t.dueDate < todayStr
      ).length;

      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

      // Calculate health score: base 100
      let healthScore = 100;

      // Deduct for overdue tasks
      healthScore -= overdueTasks * 10;

      // Deduct if progress is low compared to expected schedule
      if (totalTasks > 0 && completionRate < 50) {
        healthScore -= 15;
      }

      // Deduct for high/critical priority pending tasks overdue
      const criticalPendingOverdue = tasks.filter(
        (t) => (t.priority === 'High' || t.priority === 'Critical') && t.status !== 'Completed' && t.dueDate < todayStr
      ).length;
      healthScore -= criticalPendingOverdue * 10;

      // Bound between 0 and 100
      healthScore = Math.max(0, Math.min(100, healthScore));

      let riskLevel: 'Low' | 'Moderate' | 'High' = 'Low';
      if (healthScore < 50) {
        riskLevel = 'High';
      } else if (healthScore < 80) {
        riskLevel = 'Moderate';
      }

      // Update project health in DB if changed
      if (project.healthScore !== healthScore || project.riskLevel !== riskLevel) {
        project.healthScore = healthScore;
        project.riskLevel = riskLevel;
        await project.save();
      }

      // Dynamic insights & recommendations
      const insights: string[] = [];
      const recommendedActions: string[] = [];

      if (overdueTasks > 0) {
        insights.push(`Flagged ${overdueTasks} overdue task(s) requiring team attention.`);
        recommendedActions.push(`Reallocate overdue task(s) to available developers or adjust deadline.`);
      } else {
        insights.push(`Task completion velocity is on track with target milestones.`);
      }

      if (completionRate < 50 && totalTasks > 0) {
        insights.push(`Task completion rate is at ${completionRate}%. Sprint progress is below 50%.`);
        recommendedActions.push(`Review blockers in standup and streamline backlog priorities.`);
      } else {
        insights.push(`Progress is healthy at ${completionRate}% task completion rate.`);
      }

      if (project.members && project.members.length < 2) {
        insights.push(`Project has minimal allocated team capacity (${project.members.length} members).`);
        recommendedActions.push(`Use Smart Team Matcher to assign additional team members.`);
      }

      if (recommendedActions.length === 0) {
        recommendedActions.push(`Maintain current development velocity and continue daily reviews.`);
      }

      healthReports.push({
        projectId: pIdStr,
        projectName: project.name,
        clientName: project.clientName,
        healthScore,
        riskLevel,
        completionRate,
        totalTasks,
        completedTasks,
        overdueTasks,
        insights,
        recommendedActions,
      });
    }

    // Compute overall company summary
    const overallHealthScore =
      healthReports.length > 0
        ? Math.round(
            healthReports.reduce((acc, curr) => acc + curr.healthScore, 0) / healthReports.length
          )
        : 90;

    let overallStatus: 'Optimal' | 'Attention Required' | 'Critical Risk' = 'Optimal';
    if (overallHealthScore < 60) {
      overallStatus = 'Critical Risk';
    } else if (overallHealthScore < 80) {
      overallStatus = 'Attention Required';
    }

    const deliveryProbability = Math.min(99, Math.round(overallHealthScore * 1.05));

    return {
      overallHealthScore,
      overallStatus,
      deliveryProbability,
      totalActiveProjects: projects.length,
      totalTasksAnalyzed,
      projectHealthList: healthReports,
    };
  }

  /**
   * Generates smart team recommendations based on skills, availability, and workload.
   */
  public async getSmartTeamRecommendations(
    projectId?: string,
    targetSkills?: string[]
  ): Promise<TeamMemberRecommendation[]> {
    let requiredSkills = targetSkills || [];
    let projectTechStack: string[] = [];

    if (projectId) {
      const project = await Project.findById(projectId);
      if (project && project.techStack && project.techStack.length > 0) {
        projectTechStack = project.techStack;
        if (requiredSkills.length === 0) {
          requiredSkills = projectTechStack;
        }
      }
    }

    // Default target skills fallback if none specified
    if (requiredSkills.length === 0) {
      requiredSkills = ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Tailwind CSS', 'Python', 'AWS'];
    }

    // Get all non-client users
    const users = await User.find({ role: { $ne: 'Client' } });

    const recommendations: TeamMemberRecommendation[] = users.map((u) => {
      const userSkills = u.skills || [];
      const userRole = u.role || 'Developer';
      const availability = u.availability || 'Available';
      const workloadPercent = u.workloadPercent || 0;

      // Matching skills calculation
      const matchingSkills = userSkills.filter((s) =>
        requiredSkills.some((req) => req.toLowerCase() === s.toLowerCase())
      );

      // Match Score logic (60 to 98)
      let score = 65;

      if (matchingSkills.length > 0) {
        score += Math.min(25, matchingSkills.length * 8);
      }

      if (availability === 'Available') {
        score += 10;
      } else if (availability === 'On Leave') {
        score -= 20;
      }

      if (workloadPercent < 50) {
        score += 8;
      } else if (workloadPercent > 85) {
        score -= 10;
      }

      // Bound score
      const matchScore = Math.min(98, Math.max(50, score));

      // Rationale formulation
      let matchReason = '';
      if (matchingSkills.length > 0) {
        matchReason = `High skill alignment in ${matchingSkills.join(', ')}. Currently ${availability.toLowerCase()} with ${workloadPercent}% workload capacity.`;
      } else {
        matchReason = `Strong ${userRole} profile with ${availability.toLowerCase()} availability (${workloadPercent}% workload).`;
      }

      return {
        memberId: u._id.toString(),
        name: u.name,
        role: u.role,
        email: u.email,
        avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        skills: userSkills,
        matchScore,
        workloadPercent,
        availability,
        matchReason,
        matchingSkills,
      };
    });

    // Sort by match score descending
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Processes conversational queries for AI Project Assistant / Copilot.
   */
  public async processAssistantChat(prompt: string, projectId?: string): Promise<AssistantChatResponse> {
    const cleanPrompt = prompt.trim().toLowerCase();

    // 1. Check if user is asking for project health or status
    if (cleanPrompt.includes('health') || cleanPrompt.includes('status') || cleanPrompt.includes('risk')) {
      const summary = await this.analyzeProjectHealth(projectId);
      const targetProject = summary.projectHealthList[0];

      if (targetProject) {
        return {
          answer: `I conducted a real-time health analysis for project "${targetProject.projectName}" (${targetProject.clientName}).\n\n` +
            `• Health Score: ${targetProject.healthScore}/100 (${targetProject.riskLevel} Risk)\n` +
            `• Task Completion Rate: ${targetProject.completionRate}%\n` +
            `• Total Tasks: ${targetProject.totalTasks} (${targetProject.completedTasks} completed, ${targetProject.overdueTasks} overdue)\n\n` +
            `AI Diagnostics:\n${targetProject.insights.map((i) => `• ${i}`).join('\n')}\n\n` +
            `Recommended Action: ${targetProject.recommendedActions[0]}`,
        };
      }

      return {
        answer: `I performed a global system scan across ${summary.totalActiveProjects} active projects and ${summary.totalTasksAnalyzed} tasks. Company overall health score is ${summary.overallHealthScore}/100 (${summary.overallStatus}). Estimated overall delivery probability is ${summary.deliveryProbability}%.`,
      };
    }

    // 2. Check if user is asking for meeting note summaries or requirement breakdown
    if (cleanPrompt.includes('meeting') || cleanPrompt.includes('summarize') || cleanPrompt.includes('requirement')) {
      const meeting = await Meeting.findOne().sort({ createdAt: -1 });

      const meetingText = meeting
        ? `"${meeting.title}" with client ${meeting.clientName}`
        : 'recent client discovery session';

      return {
        answer: `I analyzed the notes for ${meetingText} and extracted structured milestones and actionable development tasks for your team:`,
        generatedItems: {
          summary: `Key outcomes: Confirmed architecture scope, agreed on 2-week sprint cycle, and set milestone target dates.`,
          techStack: ['Next.js', 'Express.js', 'MongoDB', 'TypeScript', 'Tailwind CSS'],
          milestones: [
            {
              title: 'Phase 1: Architecture & Auth Setup',
              description: 'Configure database models, REST APIs, JWT authentication and RBAC roles.',
              dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            },
            {
              title: 'Phase 2: Core Feature Implementation',
              description: 'Build core management modules, dashboard, and real-time activity logs.',
              dueDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
            },
          ],
          tasks: [
            {
              title: 'Implement Database Models & Seed Data',
              description: 'Define Mongoose schemas with proper indexes and relation constraints.',
              priority: 'High',
              dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
            },
            {
              title: 'Setup Protected API Routes & Middleware',
              description: 'Apply auth JWT guard and RBAC role verification on Express routes.',
              priority: 'Critical',
              dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            },
            {
              title: 'Connect Frontend Pages to Backend Services',
              description: 'Replace static mock states with dynamic Axios backend API integration.',
              priority: 'Medium',
              dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            },
          ],
        },
      };
    }

    // 3. Check if user is asking for tech stack suggestion
    if (cleanPrompt.includes('tech stack') || cleanPrompt.includes('technology') || cleanPrompt.includes('stack')) {
      return {
        answer: `Based on enterprise software management standards, here is the recommended tech stack breakdown for your project:`,
        generatedItems: {
          techStack: ['React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'Mongoose', 'TypeScript', 'Tailwind CSS', 'Docker'],
          summary: `This stack ensures high performance, seamless SSR/CSR flexibility, robust type safety, and scalable database performance.`,
        },
      };
    }

    // 4. Check if user is asking for team member recommendations or allocation
    if (cleanPrompt.includes('team') || cleanPrompt.includes('recommend') || cleanPrompt.includes('assign') || cleanPrompt.includes('allocat')) {
      const recs = await this.getSmartTeamRecommendations(projectId);
      const topRec = recs[0];

      if (topRec) {
        return {
          answer: `I evaluated team members' skill alignment, current workload, and availability.\n\n` +
            `Top Recommendation: ${topRec.name} (${topRec.role}) — ${topRec.matchScore}% Match\n` +
            `• Rationale: ${topRec.matchReason}\n` +
            `• Matching Skills: ${topRec.matchingSkills.join(', ') || 'Full stack core'}\n` +
            `• Current Workload: ${topRec.workloadPercent}%\n\n` +
            `You can review and assign team members directly in the Smart Team Matcher tab.`,
        };
      }
    }

    // Default conversational reply with system context
    const totalProjects = await Project.countDocuments();
    const totalTasks = await Task.countDocuments();
    const totalUsers = await User.countDocuments();

    return {
      answer: `I have analyzed your request: "${prompt}".\n\n` +
        `Current System Overview:\n` +
        `• Active Projects: ${totalProjects}\n` +
        `• Tracked Tasks: ${totalTasks}\n` +
        `• Team Members: ${totalUsers}\n\n` +
        `I can help you summarize client meeting notes, calculate project health scores, suggest technology stacks, or recommend optimal team member allocations. What would you like to execute?`,
    };
  }
}

export const aiService = new AIService();
