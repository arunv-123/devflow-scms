import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { Milestone } from '../models/milestoneModel';
import { User } from '../models/userModel';
import { Meeting } from '../models/meetingModel';
import { ProjectService } from './projectService';
import { IUser } from '../types/auth';
import { ActivityLogModel } from '../models/activityLogModel';
import { NotificationService } from './notificationService';
import { GoogleGenAI } from '@google/genai';
import {
  ProjectHealthReport,
  OverallHealthSummary,
  TeamMemberRecommendation,
  AssistantChatResponse,
  ProjectRequirementItem,
  SmartTeamMatcherResponse,
  RoleRecommendationGroup,
  ProjectRoleCoverage,
  AutoLinkMilestoneItem,
  AutoLinkSummary,
  AutoLinkMilestoneResponse,
  ChatMessageHistoryItem,
} from '../types/ai';
import { groqProvider } from './groqProvider';
import {
  resolveUserProjectContext,
  getAccessibleProjects,
  formatProjectContextForPrompt,
  formatMultipleProjectsList,
  detectProjectQueryIntent,
  buildProjectIdResponse,
  buildProjectDetailsResponse,
  buildProjectProgressResponse,
  buildProjectOverdueResponse,
  buildProjectMilestonesResponse,
} from './aiProjectContext';

const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const geminiTools = [
  {
    functionDeclarations: [
      {
        name: 'analyze_project_health',
        description: 'Analyze health score, risk level, completion rate, overdue tasks, and diagnostic insights for a project or overall company.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectId: { type: 'STRING', description: 'Optional project ID to analyze' },
          },
        },
      },
      {
        name: 'get_smart_team_recommendations',
        description: 'Generate smart team allocation recommendations based on skill alignment, availability, and workload capacity.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectId: { type: 'STRING', description: 'Optional project ID' },
            skills: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Target required skills' },
          },
        },
      },
      {
        name: 'get_my_tasks',
        description: 'Retrieve assigned tasks, priority, due dates, and task descriptions for the current user.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectId: { type: 'STRING', description: 'Optional project ID' },
          },
        },
      },
      {
        name: 'break_down_task',
        description: 'Generate a proposed technical subtask breakdown for a specific task.',
        parameters: {
          type: 'OBJECT',
          properties: {
            taskId: { type: 'STRING', description: 'ID of the task to break down' },
            taskTitle: { type: 'STRING', description: 'Title of the task' },
          },
        },
      },
      {
        name: 'suggest_tech_stack',
        description: 'Analyze project requirements and suggest optimal technology stack recommendations.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectId: { type: 'STRING', description: 'Optional project ID' },
          },
        },
      },
      {
        name: 'summarize_meeting_notes',
        description: 'Summarize client meeting notes and generate milestone and task blueprint suggestions.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectId: { type: 'STRING', description: 'Optional project ID' },
          },
        },
      },
      {
        name: 'get_team_workload_analysis',
        description: 'Analyze workload percentages, availability status, and capacity across team members.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectId: { type: 'STRING', description: 'Optional project ID' },
          },
        },
      },
      {
        name: 'get_project_details',
        description: 'Retrieve real-time project details, progress, remaining milestones, and overdue tasks for an authorized project.',
        parameters: {
          type: 'OBJECT',
          properties: {
            projectId: { type: 'STRING', description: 'Optional project ID to inspect' },
          },
        },
      },
      {
        name: 'list_accessible_projects',
        description: 'List all authorized projects accessible to the authenticated user.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
    ],
  },
];

const isToolAuthorizedForRole = (toolName: string, role: string): boolean => {
  const allowedMap: Record<string, string[]> = {
    'analyze_project_health': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead'],
    'get_smart_team_recommendations': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead'],
    'suggest_tech_stack': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead'],
    'summarize_meeting_notes': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead'],
    'get_team_workload_analysis': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead'],
    'get_my_tasks': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead', 'Developer', 'Designer', 'QA', 'Client'],
    'break_down_task': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead', 'Developer', 'Designer', 'QA'],
    'get_project_details': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead', 'Developer', 'Designer', 'QA', 'Client'],
    'list_accessible_projects': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead', 'Developer', 'Designer', 'QA', 'Client'],
  };
  const roles = allowedMap[toolName];
  return !!roles && roles.includes(role);
};


export type AIProviderState =
  | 'GEMINI_ACTIVE'
  | 'GEMINI_TEMPORARILY_UNAVAILABLE'
  | 'FALLBACK_ACTIVE'
  | 'GEMINI_RECOVERED';

export interface AIProviderStatus {
  state: AIProviderState;
  lastFailureTime: number | null;
  lastFailureReason: string | null;
  consecutiveFailures: number;
  cooldownMs: number;
  simulatedFailure: boolean;
}

export class AIService {
  private providerStatus: AIProviderStatus = {
    state: 'GEMINI_ACTIVE',
    lastFailureTime: null,
    lastFailureReason: null,
    consecutiveFailures: 0,
    cooldownMs: 60_000,
    simulatedFailure: false,
  };

  public getProviderStatus(): AIProviderStatus {
    return { ...this.providerStatus };
  }

  public resetProviderStatus(): void {
    this.providerStatus = {
      state: 'GEMINI_ACTIVE',
      lastFailureTime: null,
      lastFailureReason: null,
      consecutiveFailures: 0,
      cooldownMs: 60_000,
      simulatedFailure: false,
    };
    console.log('[AI Provider] State reset to GEMINI_ACTIVE.');
  }

  public simulateGeminiFailure(reason: string = '429 Rate limit exceeded / Quota exhausted'): void {
    this.providerStatus = {
      state: 'GEMINI_TEMPORARILY_UNAVAILABLE',
      lastFailureTime: Date.now(),
      lastFailureReason: reason,
      consecutiveFailures: (this.providerStatus.consecutiveFailures || 0) + 1,
      cooldownMs: 60_000,
      simulatedFailure: true,
    };
    console.log(`[AI Provider] Simulated Gemini failure enabled: ${reason}`);
  }

  public simulateGeminiRecovery(): void {
    this.providerStatus = {
      state: 'GEMINI_RECOVERED',
      lastFailureTime: null,
      lastFailureReason: null,
      consecutiveFailures: 0,
      cooldownMs: 60_000,
      simulatedFailure: false,
    };
    console.log('[AI Provider] Simulated Gemini recovery enabled.');
  }

  private getValidGeminiModel(): string {
    const raw = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    if (!raw || raw.trim() === '') {
      return 'gemini-3.8-flash';
    }
    return raw.trim();
  }

  private async callGeminiWithTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Gemini API request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const res = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timer!);
      return res;
    } catch (err) {
      clearTimeout(timer!);
      throw err;
    }
  }

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
   * Generates smart team recommendations based on project requirements, skills, role compatibility, availability, and workload.
   */
  public async getSmartTeamRecommendations(
    projectId?: string,
    targetSkills?: string[]
  ): Promise<SmartTeamMatcherResponse> {
    let projectTechStack: string[] = [];
    let existingMemberIds = new Set<string>();
    let existingMembersList: Array<{ id: string; name: string; role: string; avatar: string }> = [];
    let projectName = '';

    if (projectId) {
      const project = await Project.findById(projectId);
      if (project) {
        projectName = project.name;
        projectTechStack = project.techStack || [];

        // Collect existing team members & manager IDs
        if (project.manager && project.manager.id) {
          const mId = project.manager.id.toString();
          existingMemberIds.add(mId);
          existingMembersList.push({
            id: mId,
            name: project.manager.name || 'Manager',
            role: project.manager.role || 'Project Manager',
            avatar: project.manager.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          });
        }

        if (Array.isArray(project.members)) {
          project.members.forEach((m) => {
            if (m.id) {
              const mId = m.id.toString();
              if (!existingMemberIds.has(mId)) {
                existingMemberIds.add(mId);
                existingMembersList.push({
                  id: mId,
                  name: m.name || 'Team Member',
                  role: m.role || 'Developer',
                  avatar: m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                });
              }
            }
          });
        }
      }
    }

    const effectiveTechStack = targetSkills && targetSkills.length > 0 ? targetSkills : projectTechStack;

    // Define Project Team Requirements based on project tech stack & standard engineering composition
    const devSkills = effectiveTechStack.length > 0
      ? effectiveTechStack
      : ['Next.js', 'React', 'TypeScript', 'Node.js', 'MongoDB', 'Python'];

    const roleRequirements = [
      {
        role: 'Developer',
        requiredCount: 2,
        skills: devSkills.slice(0, 4),
      },
      {
        role: 'QA',
        requiredCount: 1,
        skills: ['Testing', 'Cypress', 'Jest', 'Automation', 'QA'],
      },
      {
        role: 'Designer',
        requiredCount: 1,
        skills: ['UI/UX', 'Figma', 'Tailwind CSS', 'Design System'],
      },
    ];

    // Compute role coverage based on existing members
    const roleCoverage = roleRequirements.map((req) => {
      const currentCount = existingMembersList.filter((m) => {
        const rLower = (m.role || '').toLowerCase();
        if (req.role.toLowerCase() === 'developer') {
          return rLower.includes('developer') || rLower.includes('engineer') || rLower.includes('lead');
        }
        if (req.role.toLowerCase() === 'qa') {
          return rLower.includes('qa') || rLower.includes('tester') || rLower.includes('quality');
        }
        if (req.role.toLowerCase() === 'designer') {
          return rLower.includes('designer') || rLower.includes('ui') || rLower.includes('ux');
        }
        return rLower.includes(req.role.toLowerCase());
      }).length;

      return {
        role: req.role,
        requiredCount: req.requiredCount,
        currentCount,
        isFilled: currentCount >= req.requiredCount,
        skills: req.skills,
      };
    });

    const totalRequiredCount = roleCoverage.reduce((acc, curr) => acc + curr.requiredCount, 0);
    const totalCurrentCount = existingMembersList.length;

    // Fetch all non-client users
    const users = await User.find({ role: { $ne: 'Client' } });

    // Evaluate all candidate scores
    const candidateRecommendations: TeamMemberRecommendation[] = [];

    for (const u of users) {
      const uIdStr = u._id.toString();
      const isExistingMember = existingMemberIds.has(uIdStr);

      const userSkills = u.skills || [];
      const userRole = u.role || 'Developer';
      const availability = u.availability || 'Available';
      const workloadPercent = u.workloadPercent || 0;

      // Determine target matching role requirement
      let targetReqRole = 'Developer';
      const uRoleLower = userRole.toLowerCase();
      if (uRoleLower.includes('qa') || uRoleLower.includes('tester')) {
        targetReqRole = 'QA';
      } else if (uRoleLower.includes('designer') || uRoleLower.includes('ui') || uRoleLower.includes('ux')) {
        targetReqRole = 'Designer';
      } else if (uRoleLower.includes('admin') || uRoleLower.includes('manager')) {
        targetReqRole = 'Admin';
      }

      // Avoid irrelevant recommendations (Admin, PM) unless explicitly required
      const isAdminOrPM = ['Super Admin', 'Admin', 'Project Manager'].includes(userRole);
      if (isAdminOrPM && !roleRequirements.some((r) => r.role.toLowerCase() === userRole.toLowerCase())) {
        continue;
      }

      const targetCoverage = roleCoverage.find((rc) => rc.role.toLowerCase() === targetReqRole.toLowerCase());

      // --- 1. Role Match Score (0 - 100) ---
      let roleScore = 40;
      if (targetCoverage) {
        if (!targetCoverage.isFilled) {
          roleScore = 100; // Prioritize candidates who fill an open role
        } else {
          roleScore = 70; // Matching role, but slot already filled
        }
      } else if (['Developer', 'Designer', 'QA', 'Team Lead'].includes(userRole)) {
        roleScore = 75;
      }

      // --- 2. Tech Stack Alignment Score (0 - 100) ---
      const searchStack = effectiveTechStack.length > 0
        ? effectiveTechStack
        : ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Python', 'Figma', 'Testing', 'QA'];

      const matchingSkills = userSkills.filter((s) =>
        searchStack.some(
          (req) =>
            req.toLowerCase() === s.toLowerCase() ||
            req.toLowerCase().includes(s.toLowerCase()) ||
            s.toLowerCase().includes(req.toLowerCase())
        )
      );

      let techStackScore = 30;
      if (matchingSkills.length >= 3) {
        techStackScore = 100;
      } else if (matchingSkills.length === 2) {
        techStackScore = 85;
      } else if (matchingSkills.length === 1) {
        techStackScore = 70;
      }

      // --- 3. Required Role Technical Skill Score (0 - 100) ---
      const targetReqSkills = targetCoverage?.skills || [];
      const roleSkillMatches = userSkills.filter((s) =>
        targetReqSkills.some(
          (rs) => rs.toLowerCase() === s.toLowerCase() || s.toLowerCase().includes(rs.toLowerCase())
        )
      );

      let skillScore = 50;
      if (roleSkillMatches.length >= 2) {
        skillScore = 100;
      } else if (roleSkillMatches.length === 1) {
        skillScore = 80;
      } else if (matchingSkills.length > 0) {
        skillScore = 65;
      }

      // --- 4. Workload Capacity Score (0 - 100) ---
      let workloadScore = 85;
      if (workloadPercent < 40) {
        workloadScore = 100;
      } else if (workloadPercent <= 70) {
        workloadScore = 85;
      } else if (workloadPercent <= 85) {
        workloadScore = 50;
      } else {
        workloadScore = 20;
      }

      // --- 5. Availability Score (0 - 100) ---
      let availabilityScore = 100;
      if (availability === 'Busy') {
        availabilityScore = 60;
      } else if (availability === 'On Leave') {
        availabilityScore = 10;
      }

      // Weighted Final Compatibility Score
      const matchScore = Math.min(
        98,
        Math.max(
          40,
          Math.round(
            0.35 * roleScore +
            0.25 * skillScore +
            0.25 * techStackScore +
            0.10 * workloadScore +
            0.05 * availabilityScore
          )
        )
      );

      // Formulate detailed Match Rationale
      let matchReason = '';
      if (isExistingMember) {
        matchReason = `Active team member of "${projectName || 'Project'}". Eligible for task assignment.`;
      } else if (targetCoverage && !targetCoverage.isFilled) {
        matchReason = `Strong ${userRole} candidate filling open ${targetReqRole} slot (${targetCoverage.currentCount}/${targetCoverage.requiredCount}). Matching stack: ${matchingSkills.join(', ') || userSkills.slice(0, 2).join(', ')}.`;
      } else if (matchingSkills.length > 0) {
        matchReason = `High ${userRole} alignment with project tech stack (${matchingSkills.join(', ')}). Workload at ${workloadPercent}%.`;
      } else {
        matchReason = `Qualified ${userRole} candidate with ${workloadPercent}% workload capacity.`;
      }

      candidateRecommendations.push({
        memberId: uIdStr,
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
        isExistingMember,
        breakdown: {
          roleScore,
          skillScore,
          techStackScore,
          workloadScore,
          availabilityScore,
        },
      });
    }

    // Sort candidate recommendations by matchScore descending
    candidateRecommendations.sort((a, b) => b.matchScore - a.matchScore);

    // Group recommendations by required role (all suitable candidates for each role)
    const roleGroupedRecommendations: RoleRecommendationGroup[] = [];

    for (const req of roleRequirements) {
      const candidatesForRole = candidateRecommendations.filter((c) => {
        const rLower = c.role.toLowerCase();
        if (req.role.toLowerCase() === 'developer') {
          return rLower.includes('developer') || rLower.includes('engineer') || rLower.includes('lead');
        }
        if (req.role.toLowerCase() === 'qa') {
          return rLower.includes('qa') || rLower.includes('tester') || rLower.includes('quality');
        }
        if (req.role.toLowerCase() === 'designer') {
          return rLower.includes('designer') || rLower.includes('ui') || rLower.includes('ux');
        }
        return rLower.includes(req.role.toLowerCase());
      });

      const coverageItem = roleCoverage.find((rc) => rc.role === req.role);

      roleGroupedRecommendations.push({
        role: req.role,
        requiredCount: req.requiredCount,
        currentCount: coverageItem?.currentCount || 0,
        candidates: candidatesForRole, // Includes ALL suitable candidates ranked by match score!
      });
    }

    // Primary recommendations (unassigned candidates)
    const primaryRecommendations = candidateRecommendations.filter((c) => !c.isExistingMember);

    // Alternatives (other suitable candidates)
    const alternativeCandidates = candidateRecommendations.filter((c) => !c.isExistingMember && c.matchScore < 70);

    return {
      totalRequiredCount,
      totalCurrentCount,
      roleCoverage,
      roleGroupedRecommendations,
      primaryRecommendations,
      alternativeCandidates,
      existingMembers: existingMembersList,
      requirements: roleRequirements.map((r) => ({ role: r.role, count: r.requiredCount, skills: r.skills })),
      recommendations: primaryRecommendations,
      existingMembersCount: totalCurrentCount,
    };
  }

  /**
   * Generates AI task assignee recommendations exclusively for members of the given project's team.
   */
  public async getTaskAssigneeRecommendations(
    projectId: string,
    targetSkills?: string[]
  ): Promise<TeamMemberRecommendation[]> {
    if (!projectId) return [];

    const project = await Project.findById(projectId);
    if (!project) return [];

    const eligibleRefs = await ProjectService.getEligibleAssignees(projectId);
    if (!eligibleRefs || eligibleRefs.length === 0) return [];

    const projectTechStack = project.techStack || [];
    const searchStack = targetSkills && targetSkills.length > 0 ? targetSkills : projectTechStack;

    const recommendations: TeamMemberRecommendation[] = [];

    for (const ref of eligibleRefs) {
      if (!ref.id || ref.id === 'unassigned') continue;

      let userSkills: string[] = (ref as any).skills || [];
      let userRole: string = ref.role || 'Developer';
      let workloadPercent: number = ref.workloadPercent ?? 30;
      let availability: string = 'Available';
      let avatar: string = ref.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

      try {
        const user = await User.findById(ref.id).select('-password');
        if (user) {
          if (user.skills && user.skills.length > 0) userSkills = user.skills;
          if (user.role) userRole = user.role;
          if (user.workloadPercent !== undefined) workloadPercent = user.workloadPercent;
          if (user.availability) availability = user.availability;
          if (user.avatar) avatar = user.avatar;
        }
      } catch (_) { }

      // 1. Tech Stack / Skills match against task skills or project tech stack
      const matchingSkills = userSkills.filter((s) =>
        searchStack.some(
          (req) =>
            req.toLowerCase() === s.toLowerCase() ||
            req.toLowerCase().includes(s.toLowerCase()) ||
            s.toLowerCase().includes(req.toLowerCase())
        )
      );

      let skillScore = 40;
      if (matchingSkills.length >= 3) skillScore = 100;
      else if (matchingSkills.length === 2) skillScore = 85;
      else if (matchingSkills.length === 1) skillScore = 70;

      // 2. Role Match Score
      let roleScore = 75;
      const rLower = userRole.toLowerCase();
      if (searchStack.some((s) => ['qa', 'testing', 'cypress', 'jest', 'automation'].includes(s.toLowerCase()))) {
        if (rLower.includes('qa') || rLower.includes('tester')) roleScore = 100;
      } else if (searchStack.some((s) => ['ui', 'ux', 'figma', 'design', 'tailwind'].includes(s.toLowerCase()))) {
        if (rLower.includes('designer') || rLower.includes('ui') || rLower.includes('ux')) roleScore = 100;
      } else if (rLower.includes('developer') || rLower.includes('engineer') || rLower.includes('lead')) {
        roleScore = 90;
      }

      // 3. Workload Capacity Score
      let workloadScore = 85;
      if (workloadPercent < 40) workloadScore = 100;
      else if (workloadPercent <= 70) workloadScore = 85;
      else if (workloadPercent <= 85) workloadScore = 50;
      else workloadScore = 20;

      // 4. Availability Score
      let availabilityScore = 100;
      if (availability === 'Busy') availabilityScore = 60;
      else if (availability === 'On Leave') availabilityScore = 10;

      // Weighted compatibility score
      const matchScore = Math.min(
        98,
        Math.max(
          45,
          Math.round(
            0.40 * skillScore +
            0.30 * roleScore +
            0.20 * workloadScore +
            0.10 * availabilityScore
          )
        )
      );

      const matchReason = matchingSkills.length > 0
        ? `Project team member with matching skills (${matchingSkills.join(', ')}) and ${workloadPercent}% workload capacity.`
        : `Project team member with ${userRole} background and ${workloadPercent}% workload capacity.`;

      recommendations.push({
        memberId: ref.id,
        name: ref.name,
        role: userRole,
        email: ref.email,
        avatar,
        skills: userSkills,
        matchScore,
        workloadPercent,
        availability: availability as any,
        matchReason,
        matchingSkills,
        isExistingMember: true,
        breakdown: {
          roleScore,
          skillScore,
          techStackScore: skillScore,
          workloadScore,
          availabilityScore,
        },
      });
    }

    // Sort candidates by matchScore descending
    recommendations.sort((a, b) => b.matchScore - a.matchScore);
    return recommendations;
  }

  /**
   * Analyzes unlinked tasks against project milestones using semantic matching on:
   * task title, description, tags, project requirements, milestone title/description, tech stack.
   * Confidence scores:
   * - 90%+ -> auto_assigned (automatically saves milestoneId to MongoDB & updates stats)
   * - 75-89% -> requires_approval (requires coordinator review)
   * - <75% -> unassigned
   */
  public async autoLinkTasksToMilestones(projectId?: string): Promise<AutoLinkMilestoneResponse> {
    const taskQuery: any = {
      $or: [{ milestoneId: { $exists: false } }, { milestoneId: null }, { milestoneId: '' }],
    };
    if (projectId) {
      taskQuery.projectId = projectId;
    }

    const unlinkedTasks = await Task.find(taskQuery);

    let autoLinkedCount = 0;
    let requiresApprovalCount = 0;
    let unassignedCount = 0;
    const recommendations: AutoLinkMilestoneItem[] = [];

    const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'setup', 'system', 'build', 'create', 'task', 'project', 'implement']);

    const extractKeywords = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));

    for (const task of unlinkedTasks) {
      const pId = task.projectId;
      if (!pId) {
        unassignedCount++;
        continue;
      }

      const project = await Project.findById(pId);
      const milestones = await Milestone.find({ projectId: pId });

      if (!milestones || milestones.length === 0) {
        unassignedCount++;
        recommendations.push({
          taskId: task._id.toString(),
          taskTitle: task.title,
          taskDescription: task.description,
          taskTags: task.tags,
          currentMilestoneId: '',
          recommendedMilestoneId: '',
          recommendedMilestoneTitle: 'No Milestones Found',
          confidenceScore: 0,
          status: 'unassigned',
          matchReason: 'No milestones exist for this project.',
        });
        continue;
      }

      const taskText = `${task.title} ${task.description || ''} ${(task.tags || []).join(' ')}`;
      const taskKw = extractKeywords(taskText);
      const taskTagsLower = (task.tags || []).map((t) => t.toLowerCase());

      let bestMilestone = milestones[0];
      let bestScore = 0;
      let bestReason = '';

      for (const ms of milestones) {
        const msText = `${ms.title} ${ms.description || ''}`;
        const msKw = extractKeywords(msText);

        // 1. Keyword Overlap (0 - 45 pts)
        let kwMatches = 0;
        taskKw.forEach((w) => {
          if (msKw.includes(w)) kwMatches++;
        });
        const kwScore = Math.min(45, kwMatches * 15);

        // 2. Specialized Tag & Topic Matching (0 - 35 pts)
        let tagScore = 0;
        const msTextLower = msText.toLowerCase();

        if (taskTagsLower.some((t) => ['auth', 'security', 'login', 'jwt'].includes(t)) && msTextLower.includes('auth')) {
          tagScore += 35;
        } else if (taskTagsLower.some((t) => ['design', 'ui', 'ux', 'frontend', 'tailwind', 'css'].includes(t)) && (msTextLower.includes('ui') || msTextLower.includes('design') || msTextLower.includes('dashboard') || msTextLower.includes('frontend'))) {
          tagScore += 35;
        } else if (taskTagsLower.some((t) => ['backend', 'api', 'database', 'mongo', 'sql', 'performance'].includes(t)) && (msTextLower.includes('backend') || msTextLower.includes('api') || msTextLower.includes('engine') || msTextLower.includes('ingestion') || msTextLower.includes('core'))) {
          tagScore += 35;
        } else if (taskTagsLower.some((t) => ['ai', 'rag', 'ml', 'vector', 'search'].includes(t)) && (msTextLower.includes('ai') || msTextLower.includes('rag') || msTextLower.includes('vector'))) {
          tagScore += 35;
        }

        // 3. Project Requirements & Tech Stack Semantic Alignment (0 - 20 pts)
        let reqScore = 0;
        const techStack = project?.techStack || [];
        if (techStack.some((tech) => taskText.toLowerCase().includes(tech.toLowerCase()) && msTextLower.includes(tech.toLowerCase()))) {
          reqScore += 20;
        } else if (ms.title.toLowerCase().includes('phase 1') || ms.title.toLowerCase().includes('core')) {
          reqScore += 15;
        }

        let totalScore = kwScore + tagScore + reqScore;

        if (kwMatches >= 2) {
          totalScore = Math.max(totalScore, 92);
        } else if (kwMatches === 1 && tagScore > 0) {
          totalScore = Math.max(totalScore, 85);
        }

        totalScore = Math.min(98, Math.max(40, totalScore));

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestMilestone = ms;

          if (totalScore >= 90) {
            bestReason = `High title & tag semantic match (${taskTagsLower.join(', ') || 'core terms'}) with "${ms.title}".`;
          } else if (totalScore >= 75) {
            bestReason = `Moderate domain requirement alignment with "${ms.title}".`;
          } else {
            bestReason = `Low semantic keyword overlap with milestone scope.`;
          }
        }
      }

      let status: 'auto_assigned' | 'requires_approval' | 'unassigned' = 'unassigned';

      if (bestScore >= 90) {
        status = 'auto_assigned';
        autoLinkedCount++;
      } else if (bestScore >= 75) {
        status = 'requires_approval';
        requiresApprovalCount++;
      } else {
        status = 'unassigned';
        unassignedCount++;
      }

      recommendations.push({
        taskId: task._id.toString(),
        taskTitle: task.title,
        taskDescription: task.description,
        taskTags: task.tags,
        currentMilestoneId: task.milestoneId || '',
        recommendedMilestoneId: bestMilestone._id.toString(),
        recommendedMilestoneTitle: bestMilestone.title,
        confidenceScore: bestScore,
        status,
        matchReason: bestReason,
        approved: status === 'auto_assigned',
      });
    }

    return {
      summary: {
        totalAnalyzed: unlinkedTasks.length,
        autoLinkedCount,
        requiresApprovalCount,
        unassignedCount,
      },
      recommendations,
    };
  }

  /**
   * Finalizes coordinator-approved task milestone link recommendations in MongoDB.
   */
  public async confirmTaskMilestoneLinks(
    updates: Array<{ taskId: string; milestoneId: string; approved: boolean }>
  ): Promise<{ updatedCount: number }> {
    let updatedCount = 0;
    const affectedMilestoneIds = new Set<string>();

    for (const update of updates) {
      if (update.approved && update.milestoneId && update.taskId) {
        const task = await Task.findById(update.taskId);
        if (task) {
          const prevMId = task.milestoneId;
          task.milestoneId = update.milestoneId;
          await task.save();
          updatedCount++;

          affectedMilestoneIds.add(update.milestoneId);
          if (prevMId) affectedMilestoneIds.add(prevMId);

          try {
            const milestone = await Milestone.findById(update.milestoneId);
            if (milestone) {
              await NotificationService.notifyTaskLinkedToMilestone({
                taskTitle: task.title,
                taskId: task._id.toString(),
                milestoneTitle: milestone.title,
                milestoneId: milestone._id.toString(),
                projectId: task.projectId,
                assigneeUserId: task.assignee?.id,
              });
            }
          } catch (e) {
            console.error('Failed to notify task milestone link confirmation:', e);
          }
        }
      }
    }

    for (const mId of affectedMilestoneIds) {
      await ProjectService.syncMilestoneStats(mId);
    }

    return { updatedCount };
  }

  /**
   * Persists confirmed subtasks for a task after explicit confirmation from a Developer/User.
   */
  public async confirmSubtasks(
    taskId: string,
    subtasks: Array<{ id?: string; title: string; completed?: boolean }>,
    user: IUser
  ): Promise<any> {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const userIdStr = user._id.toString();
    const role = user.role;

    // Check authorization: Developer/QA can only confirm subtasks for assigned tasks or tasks in their projects
    if (['Developer', 'Designer', 'QA'].includes(role)) {
      const isAssigned = task.assignee && task.assignee.id === userIdStr;
      const isMember = user.assignedProjects && user.assignedProjects.some((pId) => pId.toString() === task.projectId);
      if (!isAssigned && !isMember) {
        throw new Error('Unauthorized: You can only break down and confirm subtasks for your assigned tasks or projects.');
      }
    }

    const formattedSubtasks = subtasks.map((st, idx) => ({
      id: st.id || `sub-${Date.now()}-${idx}`,
      title: st.title.trim(),
      completed: !!st.completed,
    }));

    task.subtasks = formattedSubtasks;
    await task.save();

    // Log Activity
    try {
      await ActivityLogModel.create({
        user: user.name,
        userRole: user.role,
        userAvatar: user.avatar,
        action: 'Updated Subtasks via AI Copilot',
        target: task.title,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        projectId: task.projectId,
      });
    } catch (_) { }

    // Send AI Action Committed Notification
    try {
      await NotificationService.notifyAiActionCommitted({
        userId: userIdStr,
        title: 'AI Action Approved: Subtask Breakdown',
        message: `Saved ${formattedSubtasks.length} AI-generated subtasks for task "${task.title}".`,
        entityId: task._id.toString(),
        entityType: 'task',
        projectId: task.projectId,
        actionUrl: `/tasks?taskId=${task._id.toString()}&projectId=${task.projectId}`,
      });
    } catch (e) {
      console.error('Failed to send AI subtasks confirmation notification:', e);
    }

    return task;
  }

  /**
   * Processes conversational queries & explicit actions for AI Project Assistant / Copilot,
   * combining Google Gemini SDK tool calling with strict backend RBAC and rule-engine fallbacks.
   */
  public async processAssistantChat(input: {
    prompt: string;
    projectId?: string;
    action?: string;
    taskId?: string;
    messages?: ChatMessageHistoryItem[];
    user: IUser;
  }): Promise<AssistantChatResponse> {
    const selectedProvider = (process.env.AI_PROVIDER || 'gemini').toLowerCase().trim();
    console.log(`[AI Provider Selection] AI_PROVIDER="${selectedProvider}" | Request from ${input.user.name} (${input.user.role}): "${(input.prompt || input.action || '').slice(0, 50)}"`);

    if (selectedProvider === 'groq') {
      console.log(`[AI Provider Selection] Routing request to GROQ provider (Model: ${groqProvider.getGroqModel()} | Endpoint: https://api.groq.com/openai/v1)...`);
      return groqProvider.processAssistantChat(input);
    }

    console.log(`[AI Provider Selection] Routing request to GEMINI provider (Model: ${this.getValidGeminiModel()})...`);
    const isFallbackEnabled = process.env.AI_FALLBACK_ENABLED !== 'false';
    const ai = getGeminiClient();

    // Check if simulated failure is active for testing
    if (this.providerStatus.simulatedFailure) {
      if (isFallbackEnabled) {
        console.warn(`[AI Provider] Simulated Gemini failure active (${this.providerStatus.lastFailureReason}). Switching to Fallback Engine immediately.`);
        this.providerStatus.state = 'FALLBACK_ACTIVE';
        return this.processRuleEngineAssistantChat(input);
      } else {
        console.warn(`[AI Provider] Simulated Gemini failure active (${this.providerStatus.lastFailureReason}), but AI_FALLBACK_ENABLED=false. Attempting real Gemini API call anyway...`);
      }
    }

    // Check if Gemini is in cooldown/unavailable state
    if (
      this.providerStatus.state === 'GEMINI_TEMPORARILY_UNAVAILABLE' ||
      this.providerStatus.state === 'FALLBACK_ACTIVE'
    ) {
      const elapsed = Date.now() - (this.providerStatus.lastFailureTime || 0);
      if (elapsed < this.providerStatus.cooldownMs) {
        const remainingSec = Math.ceil((this.providerStatus.cooldownMs - elapsed) / 1000);
        if (isFallbackEnabled) {
          console.warn(`[AI Provider] Gemini temporarily unavailable (cooldown active, ${remainingSec}s remaining). Switching to Fallback Engine immediately.`);
          return this.processRuleEngineAssistantChat(input);
        } else {
          console.warn(`[AI Provider] Gemini in cooldown (${remainingSec}s remaining), but AI_FALLBACK_ENABLED=false. Forcing attempt to real Gemini API...`);
        }
      } else {
        console.log(`[AI Provider] Cooldown expired (${Math.round(elapsed / 1000)}s elapsed). Testing Gemini recovery check...`);
        this.providerStatus.state = 'GEMINI_RECOVERED';
      }
    }

    if (ai) {
      const modelName = this.getValidGeminiModel();
      try {
        console.log(`[AI Provider] Attempting Gemini LLM request (Model: ${modelName})...`);
        const llmRes = await this.processLLMAssistantChat({
          ai,
          prompt: input.prompt,
          projectId: input.projectId,
          action: input.action,
          taskId: input.taskId,
          messages: input.messages,
          user: input.user,
        });

        if (llmRes) {
          if (this.providerStatus.state === 'GEMINI_RECOVERED' || this.providerStatus.consecutiveFailures > 0) {
            console.log('[AI Provider] Gemini recovered! Switching back to GEMINI_ACTIVE state.');
          } else {
            console.log('[AI Provider] Gemini LLM request successful.');
          }
          this.providerStatus.state = 'GEMINI_ACTIVE';
          this.providerStatus.consecutiveFailures = 0;
          this.providerStatus.lastFailureTime = null;
          this.providerStatus.lastFailureReason = null;
          return llmRes;
        }
      } catch (err: any) {
        const rawErrMsg = err?.message || String(err);
        const sanitizedErrMsg = rawErrMsg.replace(/key=[^&\s]+/gi, 'key=[REDACTED]');

        const status = err?.status || err?.code || 503;
        const isQuota = status === 429 || /quota|429|resource_exhausted|rate_limit|limit_exceeded|token/i.test(rawErrMsg);
        const reason = isQuota
          ? '429 Rate limit / Quota exhausted'
          : `Provider error (${status}: ${sanitizedErrMsg.slice(0, 100)})`;

        // Update provider status & compute backoff: 60s, 90s, 135s up to 300s max
        const nextFailures = (this.providerStatus.consecutiveFailures || 0) + 1;
        const nextCooldown = Math.min(300_000, Math.round(60_000 * Math.pow(1.5, nextFailures - 1)));

        this.providerStatus = {
          state: 'FALLBACK_ACTIVE',
          lastFailureTime: Date.now(),
          lastFailureReason: reason,
          consecutiveFailures: nextFailures,
          cooldownMs: nextCooldown,
          simulatedFailure: false,
        };

        console.warn(`[AI Provider] Gemini unavailable (${reason}). Setting state to FALLBACK_ACTIVE. Cooldown: ${Math.round(nextCooldown / 1000)}s.`);

        if (!isFallbackEnabled) {
          console.warn('[AI Provider] AI_FALLBACK_ENABLED=false. Rule Engine fallback is disabled.');
          return {
            answer: `⚠️ **Gemini API Direct Request Failed (${status})**\n\n**Reason / Details:** ${sanitizedErrMsg}\n\n*Note: Fallback to Rule Engine is currently disabled via \`AI_FALLBACK_ENABLED=false\` configuration.*`,
          };
        }

        console.log('[AI Provider] Switching to Fallback Engine immediately.');

        try {
          const fallbackRes = await this.processRuleEngineAssistantChat(input);
          if (fallbackRes && fallbackRes.answer) {
            console.log('[AI Provider] Fallback Engine processed request successfully.');
            return fallbackRes;
          }
        } catch (ruleEngineErr: any) {
          console.error('[AI Provider] Rule Engine fallback error:', ruleEngineErr);
        }

        return {
          answer: `⚠️ **AI temporarily operating with limited capacity**\n\nBoth primary and fallback AI engines encountered an exception. Please try your request again shortly.`,
        };
      }
    }

    if (!isFallbackEnabled) {
      console.warn('[AI Provider] No valid Gemini API key configured and AI_FALLBACK_ENABLED=false.');
      return {
        answer: `⚠️ **Gemini API Key Missing or Invalid**\n\n\`GEMINI_API_KEY\` is not properly configured in \`backend/.env\`. Rule Engine fallback is disabled (\`AI_FALLBACK_ENABLED=false\`).`,
      };
    }

    console.log('[AI Provider] No Gemini API key configured. Routing directly to Fallback Engine.');
    return this.processRuleEngineAssistantChat(input);
  }

  /**
   * Google Gemini Generative LLM Assistant with Tool Calling & Strict Backend RBAC Verification.
   */
  private async processLLMAssistantChat(input: {
    ai: GoogleGenAI;
    prompt: string;
    projectId?: string;
    action?: string;
    taskId?: string;
    messages?: ChatMessageHistoryItem[];
    user: IUser;
  }): Promise<AssistantChatResponse | null> {
    const { ai, prompt, projectId, action, taskId, messages, user } = input;
    const role = user.role;
    const userIdStr = user._id.toString();

    // Resolve project context & verify user permissions
    const projectResolution = await resolveUserProjectContext({ projectId, user });
    const resolvedProjectId = projectResolution.projectId || projectId;

    // Check if the user is asking a general project inquiry (details, progress, overdue, milestones)
    const intent = detectProjectQueryIntent(prompt || '');
    if (intent) {
      if (projectResolution.status === 'UNAUTHORIZED') {
        return {
          answer: `⚠️ **Permission Denied**\n\nYou do not have authorization to view project ID \`${projectResolution.unauthorizedProjectId}\`. Please select an authorized project.`,
        };
      }
      if (projectResolution.status === 'NO_PROJECTS') {
        return {
          answer: `I could not find any accessible projects for your account in DevFlow. You are currently not assigned to any projects, or no projects exist in the system.`,
        };
      }
      if (projectResolution.status === 'MULTIPLE_PROJECTS' && projectResolution.accessibleProjects) {
        return {
          answer: formatMultipleProjectsList(projectResolution.accessibleProjects),
        };
      }
      if (projectResolution.status === 'RESOLVED' && projectResolution.freshData) {
        const fresh = projectResolution.freshData;
        if (intent === 'PROJECT_ID') {
          return { answer: buildProjectIdResponse(fresh) };
        }
        if (intent === 'DETAILS') {
          return { answer: buildProjectDetailsResponse(fresh) };
        }
        if (intent === 'PROGRESS') {
          return { answer: buildProjectProgressResponse(fresh) };
        }
        if (intent === 'OVERDUE') {
          return { answer: buildProjectOverdueResponse(fresh) };
        }
        if (intent === 'MILESTONES') {
          return { answer: buildProjectMilestonesResponse(fresh) };
        }
      }
    }

    let projectContextNotice = '';
    if (projectResolution.status === 'RESOLVED' && projectResolution.freshData) {
      projectContextNotice = `\n\n${formatProjectContextForPrompt(projectResolution.freshData)}\n`;
    } else if (projectResolution.status === 'MULTIPLE_PROJECTS' && projectResolution.accessibleProjects) {
      projectContextNotice = `\n\nAuthorized Accessible Projects for User:\n${formatMultipleProjectsList(projectResolution.accessibleProjects)}\n`;
    } else if (projectResolution.status === 'UNAUTHORIZED') {
      projectContextNotice = `\n\nUnauthorized Access Notice: User requested project ID '${projectResolution.unauthorizedProjectId}', which they are NOT authorized to view.\n`;
    } else if (projectResolution.status === 'NO_PROJECTS') {
      projectContextNotice = `\n\nProject Context Notice: No accessible projects were found for this user in the database.\n`;
    }

    const systemInstruction = `You are DevFlow AI Assistant, an intelligent hybrid AI copilot for DevFlow SCMS, software engineering, and general technical guidance.
Authenticated User Context:
- Name: ${user.name}
- Email: ${user.email}
- Role: ${user.role}
- User ID: ${userIdStr}${projectContextNotice}

Core Behavior & Hybrid Guidelines:
1. HYBRID SCOPE & GENERAL KNOWLEDGE:
   - For identity questions ("Who are you?"): Introduce yourself as "DevFlow AI Assistant, an AI copilot for DevFlow and software engineering. I can help with your DevFlow projects as well as general technical and programming questions."
   - For general software engineering/technical questions (e.g. "What is React?", "Explain JWT", "REST vs GraphQL", "How does Docker work?", "MongoDB indexing", "Binary search tree", "async/await", "machine learning"): Answer naturally using model knowledge. Do NOT force these general questions into DevFlow project context unless the user specifically asks about their DevFlow project.
   - For reasonable general knowledge or learning questions (e.g. "What is the capital of Japan?", "How do I learn Python?"): Answer normally and helpfully.
   - For DevFlow/project-specific operations (health, tasks, subtasks, milestones, team recommendations, workload, meeting summaries, tech stack suggestions): Use project context or call the appropriate tool.

2. REAL-TIME & LIVE DATA LIMITATIONS:
   - For questions requiring real-time or current external information (such as live weather, current stock/crypto prices, live sports scores, breaking news, current exchange rates, or live external availability):
     • Do not provide estimated, typical, historical, or guessed information as if it were current.
     • If no live-data tool is available, clearly state that live information is currently unavailable.
     • Do not fabricate or hallucinate current conditions.

3. PROJECT DATA INTEGRITY & CONTEXT RESOLUTION (NO HALLUCINATIONS):
   - When Active Project Context is provided above:
     • For general questions regarding project details (e.g. "Give me the current project details", "Can you give the current project details?", "Tell me about my project"): Answer thoroughly and accurately using the Active Project Context (project name, client, status, priority, progress, health score, budget, dates, tech stack, overdue tasks, and remaining milestones).
     • For progress questions (e.g. "How is my project progressing?"): Report overall progress percentage, task completion ratio, active status, and delivery health score.
     • For overdue task questions (e.g. "What tasks are overdue?"): Detail all overdue tasks with title, due date, priority, and status, or confirm that no tasks are overdue.
     • For milestone questions (e.g. "What milestones are remaining?"): Detail all remaining milestones with target due dates, progress, and status, or confirm that all milestones have been achieved.
     • NEVER ask the user to provide a project ID or exact project name when an Active Project Context is already present above.
   - When the user asks about project details, progress, overdue tasks, or milestones but NO Active Project Context is resolved:
     • If multiple accessible projects are listed above: Politely ask the user to select or specify which project they want information for, and present the list of authorized projects provided in the context above.
     • If no accessible projects exist: Explain clearly that no projects exist or they are not assigned to any project, without inventing data.
     • If the user requested an unauthorized project: Inform them that their role (${user.role}) is not authorized to access that project.
   - Never invent or hallucinate project data (project names, task names, statuses, milestone dates, client info, team assignments, health scores, database records).

4. SECURITY & PERMISSIONS:
   - If a tool call returns a PERMISSION DENIED result, inform the user politely that their role (${user.role}) is not authorized for that action and state which roles possess authorization. Never override or bypass permissions.
   - Do not allow model-assumed project IDs to bypass authorization checks.

5. RESPONSE FORMATTING & ID POLICY:
   - Provide clean, professional responses formatted in GitHub Markdown. Never reveal API keys, secret tokens, or internal database connection strings.
   - Do NOT display or quote internal MongoDB project IDs (or database object IDs) in conversational greetings, project overviews, summaries, or progress reports. Refer to projects by their human-readable name.
   - ONLY provide the project ID if the user explicitly asks for the project ID (e.g. "What is the project ID?"). When requested, return it inline (e.g. The project ID for "**Project**" is \`ID\`. ), without breaking it into standalone blocks or inserting stray punctuation.`;

    const contents: any[] = [];

    if (Array.isArray(messages)) {
      messages.forEach((m) => {
        if (m.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: m.content }] });
        } else if (m.role === 'assistant') {
          contents.push({ role: 'model', parts: [{ text: m.content }] });
        }
      });
    }

    let userPromptContent = prompt || '';
    if (projectResolution.status === 'RESOLVED' && projectResolution.freshData) {
      userPromptContent = `[Active Project: "${projectResolution.freshData.name}"]\n${userPromptContent}`;
    }
    if (action) {
      userPromptContent = `[Action: ${action}] ${userPromptContent}`;
    }
    if (taskId) {
      userPromptContent += ` (Target Task ID: ${taskId})`;
    }

    if (userPromptContent.trim()) {
      contents.push({ role: 'user', parts: [{ text: userPromptContent }] });
    }

    const modelName = this.getValidGeminiModel();

    const firstResponse = await this.callGeminiWithTimeout(
      ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          tools: geminiTools as any,
          temperature: 0.7,
        },
      }),
      10000
    );

    let extraArtifacts: {
      action?: string;
      taskId?: string;
      taskTitle?: string;
      suggestedSubtasks?: Array<{ id: string; title: string; completed?: boolean }>;
      generatedItems?: any;
    } = {};

    if (firstResponse.functionCalls && firstResponse.functionCalls.length > 0) {
      if (firstResponse.candidates && firstResponse.candidates[0]?.content) {
        contents.push(firstResponse.candidates[0].content);
      }

      for (const toolCall of firstResponse.functionCalls) {
        const toolName = toolCall.name || '';
        if (!toolName) continue;
        const args: any = toolCall.args || {};

        // --- STRICT RBAC VERIFICATION BEFORE TOOL EXECUTION ---
        if (!isToolAuthorizedForRole(toolName, role)) {
          contents.push({
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name: toolName,
                  response: {
                    error: `PERMISSION DENIED: User role '${role}' is not authorized to execute tool '${toolName}'. Inform the user politely that this operation requires appropriate Project Manager permissions.`,
                  },
                },
              },
            ],
          });
          continue;
        }

        // --- AUTHORIZED TOOL EXECUTION ---
        let toolOutput: any = {};

        if (toolName === 'get_project_details') {
          const targetPid = args.projectId || resolvedProjectId;
          const res = await resolveUserProjectContext({ projectId: targetPid, user });
          if (res.status === 'UNAUTHORIZED') {
            toolOutput = { error: `PERMISSION DENIED: User role '${role}' is not authorized to access project ID '${targetPid}'.` };
          } else if (res.status === 'NO_PROJECTS') {
            toolOutput = { error: 'Project not found or no accessible projects exist.' };
          } else if (res.status === 'MULTIPLE_PROJECTS') {
            toolOutput = { status: 'MULTIPLE_PROJECTS', projects: res.accessibleProjects };
          } else {
            toolOutput = res.freshData;
          }
        } else if (toolName === 'list_accessible_projects') {
          const projects = await getAccessibleProjects(user);
          toolOutput = {
            projects: projects.map((p) => ({
              id: p._id.toString(),
              name: p.name,
              status: p.status,
              clientName: p.clientName,
            })),
          };
        } else if (toolName === 'analyze_project_health') {
          const targetPid = args.projectId || resolvedProjectId;
          if (targetPid) {
            const chk = await resolveUserProjectContext({ projectId: targetPid, user });
            if (chk.status === 'UNAUTHORIZED') {
              toolOutput = { error: `PERMISSION DENIED: User is not authorized to access project ID '${targetPid}'.` };
            } else {
              toolOutput = await this.analyzeProjectHealth(targetPid);
            }
          } else {
            toolOutput = await this.analyzeProjectHealth();
          }
        } else if (toolName === 'get_smart_team_recommendations') {
          const targetPid = args.projectId || resolvedProjectId;
          toolOutput = await this.getSmartTeamRecommendations(targetPid, args.skills);
        } else if (toolName === 'get_my_tasks') {
          let query: any = { 'assignee.id': userIdStr };
          const targetPid = args.projectId || resolvedProjectId;
          if (targetPid) {
            query.projectId = targetPid;
          }
          let userTasks = await Task.find(query).sort({ dueDate: 1 });
          if (userTasks.length === 0 && targetPid) {
            userTasks = await Task.find({ projectId: targetPid }).limit(5);
          }
          toolOutput = { tasksCount: userTasks.length, tasks: userTasks };
        } else if (toolName === 'break_down_task') {
          let targetTask: any = null;
          const targetId = args.taskId || taskId;
          if (targetId) {
            targetTask = await Task.findById(targetId);
          } else {
            targetTask = await Task.findOne({ 'assignee.id': userIdStr, status: { $ne: 'Completed' } });
          }

          if (targetTask) {
            const titleLower = targetTask.title.toLowerCase();
            let suggestedSubtasks = [
              { id: `sub-1-${Date.now()}`, title: `Analyze technical requirements for "${targetTask.title}"`, completed: false },
              { id: `sub-2-${Date.now()}`, title: `Set up component logic and data schemas`, completed: false },
              { id: `sub-3-${Date.now()}`, title: `Implement core feature handlers and error checks`, completed: false },
              { id: `sub-4-${Date.now()}`, title: `Write automated tests and conduct peer code review`, completed: false },
            ];

            if (titleLower.includes('auth') || titleLower.includes('security')) {
              suggestedSubtasks = [
                { id: `sub-1-${Date.now()}`, title: 'Define JWT token validation and cookie handlers', completed: false },
                { id: `sub-2-${Date.now()}`, title: 'Implement RBAC middleware authorization check', completed: false },
                { id: `sub-3-${Date.now()}`, title: 'Add error handling for invalid or expired tokens', completed: false },
                { id: `sub-4-${Date.now()}`, title: 'Test protected endpoints with test tokens', completed: false },
              ];
            }

            extraArtifacts.action = 'breakdown_task';
            extraArtifacts.taskId = targetTask._id.toString();
            extraArtifacts.taskTitle = targetTask.title;
            extraArtifacts.suggestedSubtasks = suggestedSubtasks;

            toolOutput = {
              status: 'PROPOSED',
              taskTitle: targetTask.title,
              suggestedSubtasks,
              note: 'Subtasks generated for user confirmation.',
            };
          } else {
            toolOutput = { error: 'Task not found or unavailable' };
          }
        } else if (toolName === 'suggest_tech_stack') {
          const targetPid = args.projectId || resolvedProjectId;
          let existingStack: string[] = ['React', 'Node.js', 'TypeScript', 'MongoDB'];
          if (targetPid) {
            const p = await Project.findById(targetPid);
            if (p && p.techStack && p.techStack.length > 0) existingStack = p.techStack;
          }
          const recStack = Array.from(new Set([...existingStack, 'Next.js', 'Express', 'Mongoose', 'Tailwind CSS', 'Docker']));
          extraArtifacts.generatedItems = {
            techStack: recStack,
            summary: 'Recommended modern stack for type-safe, scalable web applications.',
          };
          toolOutput = { existingStack, recommendedStack: recStack };
        } else if (toolName === 'summarize_meeting_notes') {
          const meeting = (await Meeting.findOne({ status: 'Completed' }).sort({ updatedAt: -1 })) || (await Meeting.findOne().sort({ createdAt: -1 }));
          const ms1Title = 'Phase 1: Architecture & Security Setup';
          const ms1Desc = 'Establish foundational database schemas, API authentication, and security middleware.';
          const ms1Tasks = [
            {
              title: 'Implement Database Schemas & Data Constraints',
              description: 'Define Mongoose schemas with proper indexes and relation constraints.',
              priority: 'High' as const,
              dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
              milestoneTitle: ms1Title,
            },
            {
              title: 'Setup Protected Auth Pipeline & RBAC Guards',
              description: 'Apply auth JWT guard and RBAC role verification on Express routes.',
              priority: 'Critical' as const,
              dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
              milestoneTitle: ms1Title,
            },
          ];

          const ms2Title = 'Phase 2: Core Feature Implementation & Metrics Integration';
          const ms2Desc = 'Build core management modules, dashboard workflows, and real-time activity metrics.';
          const ms2Tasks = [
            {
              title: 'Connect Management Pages to Backend API Endpoints',
              description: 'Replace static mock states with dynamic Axios backend API integration.',
              priority: 'Medium' as const,
              dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
              milestoneTitle: ms2Title,
            },
            {
              title: 'Implement Real-Time Activity Tracking & Health Diagnostics',
              description: 'Build automated health recalculation and activity log event feeds.',
              priority: 'High' as const,
              dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
              milestoneTitle: ms2Title,
            },
          ];

          extraArtifacts.generatedItems = {
            summary: meeting?.notes || 'Executive Summary:\nConfirmed architecture scope, agreed on 2-week sprint cycle, and set milestone target dates.',
            milestones: [
              { title: ms1Title, description: ms1Desc, dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], suggestedTasks: ms1Tasks },
              { title: ms2Title, description: ms2Desc, dueDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0], suggestedTasks: ms2Tasks },
            ],
            tasks: [...ms1Tasks, ...ms2Tasks],
          };
          toolOutput = extraArtifacts.generatedItems;
        } else if (toolName === 'get_team_workload_analysis') {
          const users = await User.find({ role: { $in: ['Developer', 'Designer', 'QA', 'Team Lead'] } }).select('-password');
          toolOutput = users.map((u) => ({ name: u.name, role: u.role, workloadPercent: u.workloadPercent, availability: u.availability }));
        }

        contents.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: toolName,
                response: { result: toolOutput },
              },
            },
          ],
        });
      }

      // Second completion call to synthesize final conversational response
      const secondResponse = await this.callGeminiWithTimeout(
        ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        }),
        10000
      );

      return {
        answer: secondResponse.text || 'Analysis complete.',
        action: extraArtifacts.action,
        taskId: extraArtifacts.taskId,
        taskTitle: extraArtifacts.taskTitle,
        suggestedSubtasks: extraArtifacts.suggestedSubtasks,
        generatedItems: extraArtifacts.generatedItems,
      };
    }

    return {
      answer: firstResponse.text || 'I processed your request.',
    };
  }

  /**
   * Internal Rule-Engine Assistant Chat implementation (used when LLM key is unconfigured or unavailable).
   */
  private async processRuleEngineAssistantChat(input: {
    prompt: string;
    projectId?: string;
    action?: string;
    taskId?: string;
    user: IUser;
  }): Promise<AssistantChatResponse> {
    const { prompt, projectId, action, taskId, user } = input;
    const cleanPrompt = (prompt || '').trim().toLowerCase();
    const role = user.role;
    const userIdStr = user._id.toString();

    // Resolve project context & authorization
    const projectResolution = await resolveUserProjectContext({ projectId, user });
    const resolvedProjectId = projectResolution.projectId || projectId;

    // --- GENERAL PROJECT-RELATED INQUIRIES ---
    const intent = detectProjectQueryIntent(prompt || '');
    if (intent) {
      if (projectResolution.status === 'UNAUTHORIZED') {
        return {
          answer: `⚠️ **Permission Denied**\n\nYou do not have authorization to view project ID \`${projectResolution.unauthorizedProjectId}\`. Please select an authorized project.`,
        };
      }
      if (projectResolution.status === 'NO_PROJECTS') {
        return {
          answer: `I could not find any accessible projects for your account in DevFlow. You are currently not assigned to any projects, or no projects exist in the system.`,
        };
      }
      if (projectResolution.status === 'MULTIPLE_PROJECTS' && projectResolution.accessibleProjects) {
        return {
          answer: formatMultipleProjectsList(projectResolution.accessibleProjects),
        };
      }
      if (projectResolution.status === 'RESOLVED' && projectResolution.freshData) {
        const fresh = projectResolution.freshData;
        if (intent === 'PROJECT_ID') {
          return { answer: buildProjectIdResponse(fresh) };
        }
        if (intent === 'DETAILS') {
          return { answer: buildProjectDetailsResponse(fresh) };
        }
        if (intent === 'PROGRESS') {
          return { answer: buildProjectProgressResponse(fresh) };
        }
        if (intent === 'OVERDUE') {
          return { answer: buildProjectOverdueResponse(fresh) };
        }
        if (intent === 'MILESTONES') {
          return { answer: buildProjectMilestonesResponse(fresh) };
        }
      }
    }

    // --- DEVELOPER & DESIGNER ROLES ---
    if (['Developer', 'Designer'].includes(role)) {
      // 1. Explain My Tasks
      if (action === 'explain_my_tasks' || cleanPrompt.includes('explain') || cleanPrompt.includes('my task')) {
        let query: any = { 'assignee.id': userIdStr };
        if (resolvedProjectId) {
          query.projectId = resolvedProjectId;
        }

        let userTasks = await Task.find(query).sort({ dueDate: 1 });
        if (userTasks.length === 0 && projectId) {
          userTasks = await Task.find({ projectId }).limit(5);
        }

        if (userTasks.length === 0) {
          return {
            answer: `You currently have no tasks assigned. Check back once your Project Manager assigns tasks to you, or select a different project context.`,
          };
        }

        const taskSummaries = userTasks.map((t) =>
          `• **${t.title}** (${t.priority} Priority, Due: ${t.dueDate || 'N/A'}, Status: ${t.status})\n  *Description*: ${t.description || 'No detailed description provided.'}`
        ).join('\n\n');

        return {
          answer: `Here is an explanation of your current assigned tasks:\n\n${taskSummaries}\n\n*Need a breakdown? Use the "Break Down Task" action to split a task into actionable subtasks.*`,
        };
      }

      // 2. Break Down My Task
      if (action === 'breakdown_task' || cleanPrompt.includes('break down') || cleanPrompt.includes('subtask')) {
        let targetTask: any = null;
        if (taskId) {
          targetTask = await Task.findById(taskId);
        } else {
          targetTask = await Task.findOne({ 'assignee.id': userIdStr, status: { $ne: 'Completed' } });
        }

        if (!targetTask) {
          return {
            answer: `Could not find an active task to break down. Please select a specific task from your assigned list.`,
          };
        }

        // Verify authorized access to task
        const isAssigned = targetTask.assignee && targetTask.assignee.id === userIdStr;
        const isMember = user.assignedProjects && user.assignedProjects.some((pId) => pId.toString() === targetTask.projectId);
        if (!isAssigned && !isMember) {
          return {
            answer: `You are only authorized to break down tasks assigned to you or within your assigned project scope.`,
          };
        }

        // Generate proposed subtasks based on task title & description
        const titleLower = targetTask.title.toLowerCase();
        let suggestedSubtasks = [
          { id: `sub-1-${Date.now()}`, title: `Analyze technical requirements for "${targetTask.title}"`, completed: false },
          { id: `sub-2-${Date.now()}`, title: `Set up component logic and data schemas`, completed: false },
          { id: `sub-3-${Date.now()}`, title: `Implement core feature handlers and error checks`, completed: false },
          { id: `sub-4-${Date.now()}`, title: `Write automated tests and conduct peer code review`, completed: false },
        ];

        if (titleLower.includes('auth') || titleLower.includes('security')) {
          suggestedSubtasks = [
            { id: `sub-1-${Date.now()}`, title: 'Define JWT token validation and cookie handlers', completed: false },
            { id: `sub-2-${Date.now()}`, title: 'Implement RBAC middleware authorization check', completed: false },
            { id: `sub-3-${Date.now()}`, title: 'Add error handling for invalid or expired tokens', completed: false },
            { id: `sub-4-${Date.now()}`, title: 'Test protected endpoints with test tokens', completed: false },
          ];
        } else if (titleLower.includes('ui') || titleLower.includes('kanban') || titleLower.includes('frontend')) {
          suggestedSubtasks = [
            { id: `sub-1-${Date.now()}`, title: 'Build visual UI layout and role-aware buttons', completed: false },
            { id: `sub-2-${Date.now()}`, title: 'Wire client-side event handlers and state management', completed: false },
            { id: `sub-3-${Date.now()}`, title: 'Integrate backend API requests with Axios', completed: false },
            { id: `sub-4-${Date.now()}`, title: 'Verify responsive CSS layout and loading indicators', completed: false },
          ];
        }

        return {
          answer: `I generated a proposed technical task breakdown for **"${targetTask.title}"**.\n\n` +
            `*Note: Subtasks require explicit confirmation before being saved to your task.*`,
          action: 'breakdown_task',
          taskId: targetTask._id.toString(),
          taskTitle: targetTask.title,
          suggestedSubtasks,
        };
      }

      // 3. Technical Assistant / Debugging / Requirement Clarification
      if (
        action === 'technical_assistant' ||
        action === 'debugging_assistance' ||
        action === 'requirement_clarification' ||
        cleanPrompt.includes('technical') ||
        cleanPrompt.includes('debug') ||
        cleanPrompt.includes('code') ||
        cleanPrompt.includes('requirement') ||
        cleanPrompt.includes('how')
      ) {
        return {
          answer: `**DevFlow Technical Assistant Guidance:**\n\n` +
            `1. **Architecture & Scope**: Ensure code follows standard modular separation (Controllers → Services → Models).\n` +
            `2. **Backend Security**: Validate user authorization on every route using authenticated session/token (\`req.user\`).\n` +
            `3. **Frontend Integration**: Always wrap async API calls in try-catch blocks and provide subtle visual feedback.\n` +
            `4. **Debugging Strategy**: Inspect HTTP network logs and backend terminal stack traces to isolate exceptions before changing code.\n\n` +
            `Let me know if you need specific advice on your assigned tasks!`,
        };
      }

      // Prohibited management attempts by Developer
      if (
        cleanPrompt.includes('team') ||
        cleanPrompt.includes('allocat') ||
        cleanPrompt.includes('health') ||
        cleanPrompt.includes('milestone') ||
        cleanPrompt.includes('stack')
      ) {
        return {
          answer: `As a Developer, your AI Copilot is focused on technical execution, task explanation, and subtask breakdowns. Management actions such as team allocation, milestone approvals, project health scans, and tech stack configuration are reserved for Project Managers.`,
        };
      }

      // Developer Default Summary
      return {
        answer: `I am your Technical & Development Copilot.\n\n` +
          `Here is what I can help you with:\n` +
          `• **Explain My Tasks**: Summarize your assigned tasks, deadlines, and requirements\n` +
          `• **Break Down My Task**: Generate actionable subtasks for explicit confirmation\n` +
          `• **Technical Assistant**: Provide programming, debugging, and architecture guidance\n` +
          `• **Requirement Clarification**: Clarify specifications for your assigned work`,
      };
    }

    // --- QA ROLE ---
    if (role === 'QA') {
      if (action === 'breakdown_test_cases' || cleanPrompt.includes('test case') || cleanPrompt.includes('break down')) {
        return {
          answer: `**QA Test Scenario Breakdown:**\n\n` +
            `1. **Positive Validation Case**: Verify successful user authentication and authorized route navigation.\n` +
            `2. **Negative Boundary Case**: Test invalid payload structures, missing JWT headers, and expired tokens.\n` +
            `3. **RBAC Authorization Case**: Verify 403 Forbidden rejection when unauthorized roles call restricted endpoints.\n` +
            `4. **UI State Integrity**: Ensure buttons and loading states reflect real-time API responses without page reload.`,
        };
      }

      if (cleanPrompt.includes('team') || cleanPrompt.includes('allocat') || cleanPrompt.includes('health') || cleanPrompt.includes('milestone')) {
        return {
          answer: `As a QA Engineer, your AI Copilot is optimized for test task review, scenario generation, and acceptance criteria verification. Administrative and project management actions are restricted.`,
        };
      }

      return {
        answer: `I am your QA & Testing AI Assistant.\n\n` +
          `I can help you:\n` +
          `• Review assigned test tasks and bug reports\n` +
          `• Break down user stories into comprehensive test scenarios\n` +
          `• Verify acceptance criteria and test coverage for sprint releases`,
      };
    }

    // --- TEAM LEAD ROLE ---
    if (role === 'Team Lead') {
      if (action === 'team_workload_analysis' || cleanPrompt.includes('workload') || cleanPrompt.includes('capacity')) {
        const users = await User.find({ role: { $in: ['Developer', 'Designer', 'QA', 'Team Lead'] } }).select('-password');
        const workloadList = users.map((u) => `• **${u.name}** (${u.role}): ${u.workloadPercent}% workload — ${u.availability}`).join('\n');

        return {
          answer: `**Team Workload & Capacity Analysis:**\n\n${workloadList}\n\n*Recommendation*: Developers above 80% capacity should be relieved of non-critical sprint backlog tasks.`,
        };
      }

      if (action === 'task_distribution' || cleanPrompt.includes('distribut') || cleanPrompt.includes('assign')) {
        return {
          answer: `**Task Distribution Recommendations:**\n\n` +
            `• High Priority Technical Tasks → Senior Developers with < 70% workload\n` +
            `• QA & Automated Test Creation → Dedicated QA Engineers\n` +
            `• Frontend Visual Updates → Designers and UI Developers\n\n` +
            `You can assign tasks directly from the Kanban Board or Task List.`,
        };
      }

      if (cleanPrompt.includes('admin') || cleanPrompt.includes('system analytics')) {
        return {
          answer: `System-level administrative analytics are reserved for Admins. As a Team Lead, you can analyze team workload, task distribution, project progress, and technical task breakdowns.`,
        };
      }
    }

    // --- PROJECT MANAGER / PROJECT COORDINATOR / ADMIN / SUPER ADMIN ---

    // 1. Check if user is asking for project health or status
    if (action === 'project_health' || cleanPrompt.includes('health') || cleanPrompt.includes('status') || cleanPrompt.includes('risk')) {
      const summary = await this.analyzeProjectHealth(resolvedProjectId);
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

    // 2. Check if user is asking for tech stack suggestion
    if (action === 'suggest_tech_stack' || cleanPrompt.includes('tech stack') || cleanPrompt.includes('technology') || cleanPrompt.includes('stack')) {
      let existingStack: string[] = ['React', 'Node.js', 'TypeScript', 'MongoDB'];
      if (resolvedProjectId) {
        const p = await Project.findById(resolvedProjectId);
        if (p && p.techStack && p.techStack.length > 0) existingStack = p.techStack;
      }

      return {
        answer: `I analyzed project requirements and existing tech stack. Here is the recommended technology stack for your project:`,
        generatedItems: {
          techStack: Array.from(new Set([...existingStack, 'Next.js', 'Express', 'Mongoose', 'Tailwind CSS', 'Docker'])),
          summary: `This stack ensures high performance, seamless SSR/CSR flexibility, robust type safety, and scalable database performance.`,
        },
      };
    }

    // 3. Check if user is asking for meeting note summaries, milestones, or requirement breakdown
    if (
      action === 'summarize_meetings' ||
      cleanPrompt.includes('meeting') ||
      cleanPrompt.includes('summarize') ||
      cleanPrompt.includes('action item') ||
      cleanPrompt.includes('milestone') ||
      cleanPrompt.includes('roadmap') ||
      cleanPrompt.includes('plan')
    ) {
      const meeting =
        (await Meeting.findOne({ status: 'Completed' }).sort({ updatedAt: -1 })) ||
        (await Meeting.findOne().sort({ createdAt: -1 }));

      const meetingText = meeting
        ? `"${meeting.title}" with client ${meeting.clientName}`
        : 'recent client discovery session';

      let summaryText = meeting?.outcome
        ? `Executive Summary:\n${meeting.outcome}`
        : meeting?.notes
          ? `Executive Summary:\n${meeting.notes}`
          : `Executive Summary:\nConfirmed architecture scope, agreed on 2-week sprint cycle, and set milestone target dates.`;

      if (meeting?.nextSteps) {
        summaryText += `\n\nKey Requirements & Decisions:\n${meeting.nextSteps}`;
      } else {
        summaryText += `\n\nKey Requirements & Decisions:\nStandardize database models, enforce RBAC role authorization, and integrate real-time project metrics.`;
      }

      const ms1Title = 'Phase 1: Architecture & Security Setup';
      const ms1Desc = 'Establish foundational database schemas, API authentication, and security middleware.';
      const ms1Tasks = [
        {
          title: 'Implement Database Schemas & Data Constraints',
          description: 'Define Mongoose schemas with proper indexes and relation constraints.',
          priority: 'High' as const,
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          milestoneTitle: ms1Title,
        },
        {
          title: 'Setup Protected Auth Pipeline & RBAC Guards',
          description: 'Apply auth JWT guard and RBAC role verification on Express routes.',
          priority: 'Critical' as const,
          dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          milestoneTitle: ms1Title,
        },
      ];

      const ms2Title = 'Phase 2: Core Feature Implementation & Metrics Integration';
      const ms2Desc = 'Build core management modules, dashboard workflows, and real-time activity metrics.';
      const ms2Tasks = [
        {
          title: 'Connect Management Pages to Backend API Endpoints',
          description: 'Replace static mock states with dynamic Axios backend API integration.',
          priority: 'Medium' as const,
          dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          milestoneTitle: ms2Title,
        },
        {
          title: 'Implement Real-Time Activity Tracking & Health Diagnostics',
          description: 'Build automated health recalculation and activity log event feeds.',
          priority: 'High' as const,
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          milestoneTitle: ms2Title,
        },
      ];

      const allTasks = [...ms1Tasks, ...ms2Tasks];

      return {
        answer: `I analyzed ${meetingText} and generated structured milestone blueprints along with directly associated, actionable development tasks:`,
        generatedItems: {
          summary: summaryText,
          milestones: [
            {
              title: ms1Title,
              description: ms1Desc,
              dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
              suggestedTasks: ms1Tasks,
            },
            {
              title: ms2Title,
              description: ms2Desc,
              dueDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
              suggestedTasks: ms2Tasks,
            },
          ],
          tasks: allTasks,
        },
      };
    }

    // 4. Check if user is asking for team member recommendations or allocation
    if (action === 'smart_team_matcher' || cleanPrompt.includes('team') || cleanPrompt.includes('recommend') || cleanPrompt.includes('assign') || cleanPrompt.includes('allocat')) {
      const recs = await this.getSmartTeamRecommendations(resolvedProjectId);
      const topRec = recs.recommendations[0];

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

    // Role-specific fallback for management/admin roles
    const totalProjects = await Project.countDocuments();
    const totalTasks = await Task.countDocuments();
    const totalUsers = await User.countDocuments();

    if (['Super Admin', 'Admin'].includes(role)) {
      return {
        answer: `I am your Admin AI Intelligence Assistant.\n\n` +
          `Organization System Status:\n` +
          `• Total Projects: ${totalProjects}\n` +
          `• Total Active Tasks: ${totalTasks}\n` +
          `• Total Platform Users: ${totalUsers}\n\n` +
          `I can assist you with organization overviews, project health diagnostics, workload analytics, and team member management insights. Select an action above to get started.`,
      };
    }

    return {
      answer: `I am your DevFlow AI Project Copilot.\n\n` +
        `Current System Overview:\n` +
        `• Active Projects: ${totalProjects}\n` +
        `• Tracked Tasks: ${totalTasks}\n` +
        `• Team Members: ${totalUsers}\n\n` +
        `I can help you summarize client meeting notes, calculate project health scores, suggest technology stacks, or recommend optimal team member allocations. What would you like to execute?`,
    };
  }
}

export const aiService = new AIService();
