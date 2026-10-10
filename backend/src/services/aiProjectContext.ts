import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { Milestone } from '../models/milestoneModel';
import { IUser } from '../types/auth';
import { IProject } from '../types/project';

export interface FreshProjectContext {
  id: string;
  name: string;
  clientName: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  healthScore?: number;
  riskLevel?: string;
  budget?: number;
  spent?: number;
  startDate: string;
  endDate: string;
  techStack: string[];
  managerName?: string;
  managerEmail?: string;
  teamMembers: Array<{
    id?: string;
    name: string;
    role: string;
    email?: string;
  }>;
  tasksCount: number;
  completedTasksCount: number;
  inProgressTasksCount: number;
  overdueTasks: Array<{
    id: string;
    title: string;
    dueDate?: string;
    priority: string;
    status: string;
    assigneeName?: string;
  }>;
  milestonesCount: number;
  achievedMilestonesCount: number;
  remainingMilestones: Array<{
    id: string;
    title: string;
    dueDate?: string;
    progress: number;
    status: string;
    ownerName?: string;
  }>;
}

export interface AccessibleProjectItem {
  id: string;
  name: string;
  status: string;
  clientName: string;
}

export interface ProjectResolutionResult {
  status: 'RESOLVED' | 'MULTIPLE_PROJECTS' | 'NO_PROJECTS' | 'UNAUTHORIZED';
  projectId?: string;
  project?: IProject;
  freshData?: FreshProjectContext;
  accessibleProjects?: AccessibleProjectItem[];
  unauthorizedProjectId?: string;
}

/**
 * Checks whether an authenticated user is authorized to view a given project.
 */
export const isUserAuthorizedForProject = (project: IProject, user: IUser): boolean => {
  if (!project || !user) return false;
  const role = user.role;
  const userIdStr = user._id ? user._id.toString() : '';
  const userEmailLower = user.email ? user.email.toLowerCase() : '';

  // Super Admin, Admin, and Project Manager have global project visibility
  if (['Super Admin', 'Admin', 'Project Manager'].includes(role)) {
    return true;
  }

  const pIdStr = project._id.toString();

  // User explicitly assigned to this project
  const isAssigned = (user.assignedProjects || []).some(
    (apId: any) => apId.toString() === pIdStr
  );
  if (isAssigned) return true;

  // User is manager
  const isManager = Boolean(
    project.manager &&
    ((project.manager.id && project.manager.id.toString() === userIdStr) ||
     (project.manager.email && project.manager.email.toLowerCase() === userEmailLower))
  );
  if (isManager) return true;

  // User is in project members list
  const isMember = (project.members || []).some(
    (m: any) =>
      (m.id && m.id.toString() === userIdStr) ||
      (m.email && m.email.toLowerCase() === userEmailLower)
  );
  if (isMember) return true;

  // Project created by user
  if ((project as any).createdBy && (project as any).createdBy.toString() === userIdStr) {
    return true;
  }

  // Client matching
  if (role === 'Client' && (project as any).clientId && (project as any).clientId.toString() === userIdStr) {
    return true;
  }

  return false;
};

/**
 * Retrieves all projects accessible to the authenticated user based on role and assignments.
 */
export const getAccessibleProjects = async (user: IUser): Promise<IProject[]> => {
  const allProjects = await Project.find().sort({ createdAt: -1 });
  if (['Super Admin', 'Admin', 'Project Manager'].includes(user.role)) {
    return allProjects;
  }

  const userIdStr = user._id ? user._id.toString() : '';
  const userTasks = await Task.find({
    $or: [{ 'assignee.id': userIdStr }, { 'assignee.email': user.email }],
  }).select('projectId');
  const taskProjectIds = new Set(userTasks.map((t) => t.projectId).filter(Boolean));

  return allProjects.filter((p) => {
    if (taskProjectIds.has(p._id.toString())) return true;
    return isUserAuthorizedForProject(p, user);
  });
};

/**
 * Retrieves fresh project data including tasks, overdue status, and milestones,
 * filtering task visibility strictly according to the user's role permissions.
 */
export const getFreshProjectContextData = async (
  project: IProject,
  user: IUser
): Promise<FreshProjectContext> => {
  const pIdStr = project._id.toString();
  const role = user.role;
  const userIdStr = user._id ? user._id.toString() : '';

  // Retrieve project tasks from database
  const allTasks = await Task.find({ projectId: pIdStr }).sort({ dueDate: 1 });

  // Developers, Designers, and QA only see their assigned tasks
  let viewableTasks = allTasks;
  if (['Developer', 'Designer', 'QA'].includes(role)) {
    viewableTasks = allTasks.filter(
      (t) =>
        (t.assignee?.id && t.assignee.id === userIdStr) ||
        (t.assignee?.email && t.assignee.email.toLowerCase() === user.email.toLowerCase())
    );
  }

  const tasksCount = viewableTasks.length;
  const completedTasksCount = viewableTasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasksCount = viewableTasks.filter((t) => t.status === 'In Progress').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = viewableTasks
    .filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'Completed')
    .map((t) => ({
      id: t._id.toString(),
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      assigneeName: t.assignee?.name,
    }));

  // Retrieve project milestones from database
  const allMilestones = await Milestone.find({ projectId: pIdStr }).sort({ dueDate: 1 });
  const milestonesCount = allMilestones.length;
  const achievedMilestonesCount = allMilestones.filter((m) => m.status === 'Achieved').length;

  const remainingMilestones = allMilestones
    .filter((m) => m.status !== 'Achieved')
    .map((m) => ({
      id: m._id.toString(),
      title: m.title,
      dueDate: m.dueDate,
      progress: m.progress,
      status: m.status,
      ownerName: m.owner?.name,
    }));

  return {
    id: pIdStr,
    name: project.name,
    clientName: project.clientName,
    description: project.description,
    status: project.status,
    priority: project.priority,
    progress: project.progress,
    healthScore: project.healthScore,
    riskLevel: project.riskLevel,
    budget: project.budget,
    spent: project.spent,
    startDate: project.startDate,
    endDate: project.endDate,
    techStack: project.techStack || [],
    managerName: project.manager?.name,
    managerEmail: project.manager?.email,
    teamMembers: (project.members || []).map((m: any) => ({
      id: m.id ? m.id.toString() : m._id ? m._id.toString() : '',
      name: m.name || 'Team Member',
      role: m.role || 'Contributor',
      email: m.email,
    })),
    tasksCount,
    completedTasksCount,
    inProgressTasksCount,
    overdueTasks,
    milestonesCount,
    achievedMilestonesCount,
    remainingMilestones,
  };
};

/**
 * Resolves project context:
 * - If projectId provided: validates existence & user permission.
 * - If no projectId provided: inspects user accessible projects.
 *   - 0 projects -> NO_PROJECTS
 *   - 1 project -> automatically resolves as single context
 *   - >1 projects -> MULTIPLE_PROJECTS
 */
export const resolveUserProjectContext = async (input: {
  projectId?: string;
  user: IUser;
}): Promise<ProjectResolutionResult> => {
  const { projectId, user } = input;

  if (projectId && projectId.trim() !== '') {
    const cleanId = projectId.trim();
    let projectDoc: IProject | null = null;
    try {
      projectDoc = await Project.findById(cleanId);
    } catch (_) {}

    if (!projectDoc) {
      return {
        status: 'NO_PROJECTS',
        unauthorizedProjectId: cleanId,
      };
    }

    const authorized = isUserAuthorizedForProject(projectDoc, user);
    if (!authorized) {
      const hasTask = await Task.exists({
        projectId: projectDoc._id.toString(),
        $or: [{ 'assignee.id': user._id.toString() }, { 'assignee.email': user.email }],
      });
      if (!hasTask) {
        return {
          status: 'UNAUTHORIZED',
          unauthorizedProjectId: cleanId,
        };
      }
    }

    const freshData = await getFreshProjectContextData(projectDoc, user);
    return {
      status: 'RESOLVED',
      projectId: projectDoc._id.toString(),
      project: projectDoc,
      freshData,
    };
  }

  // When no projectId is provided
  const accessible = await getAccessibleProjects(user);

  if (accessible.length === 0) {
    return {
      status: 'NO_PROJECTS',
    };
  }

  if (accessible.length === 1) {
    const singleProject = accessible[0];
    const freshData = await getFreshProjectContextData(singleProject, user);
    return {
      status: 'RESOLVED',
      projectId: singleProject._id.toString(),
      project: singleProject,
      freshData,
    };
  }

  return {
    status: 'MULTIPLE_PROJECTS',
    accessibleProjects: accessible.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      status: p.status,
      clientName: p.clientName,
    })),
  };
};

export const formatProjectContextForPrompt = (ctx: FreshProjectContext): string => {
  return [
    `Active Project Context:`,
    `- Project Name: "${ctx.name}" (ID: ${ctx.id})`,
    `- Client: ${ctx.clientName}`,
    `- Description: ${ctx.description}`,
    `- Status: ${ctx.status} | Priority: ${ctx.priority} | Overall Progress: ${ctx.progress}%`,
    `- Health Score: ${ctx.healthScore ?? 'N/A'}/100 (${ctx.riskLevel ?? 'N/A'} Risk)`,
    `- Budget: $${ctx.budget?.toLocaleString() ?? 0} (Spent: $${ctx.spent?.toLocaleString() ?? 0})`,
    `- Timeline: ${ctx.startDate} to ${ctx.endDate}`,
    `- Tech Stack: ${ctx.techStack.length > 0 ? ctx.techStack.join(', ') : 'None specified'}`,
    `- Manager: ${ctx.managerName || 'Unassigned'}`,
    `- Tasks Overview: ${ctx.tasksCount} total (${ctx.completedTasksCount} completed, ${ctx.inProgressTasksCount} in progress, ${ctx.overdueTasks.length} overdue)`,
    `- Overdue Tasks: ${
      ctx.overdueTasks.length > 0
        ? ctx.overdueTasks.map((t) => `"${t.title}" (Due: ${t.dueDate || 'N/A'}, Priority: ${t.priority})`).join('; ')
        : 'None (no overdue tasks)'
    }`,
    `- Milestones Overview: ${ctx.milestonesCount} total (${ctx.achievedMilestonesCount} achieved, ${ctx.remainingMilestones.length} remaining)`,
    `- Remaining Milestones: ${
      ctx.remainingMilestones.length > 0
        ? ctx.remainingMilestones.map((m) => `"${m.title}" (Due: ${m.dueDate || 'N/A'}, Progress: ${m.progress}%, Status: ${m.status})`).join('; ')
        : 'None (all milestones achieved)'
    }`,
  ].join('\n');
};

export const formatMultipleProjectsList = (
  projects: AccessibleProjectItem[]
): string => {
  const items = projects
    .map((p) => `• **${p.name}** (${p.status} • Client: ${p.clientName})`)
    .join('\n');
  return `You have access to multiple projects. Please select or specify which project you'd like to inspect:\n\n${items}\n\n*Tip: You can select a project from the Target Project dropdown or specify the project name in your message.*`;
};

export const detectProjectQueryIntent = (
  rawPrompt: string
): 'PROJECT_ID' | 'DETAILS' | 'PROGRESS' | 'OVERDUE' | 'MILESTONES' | null => {
  const clean = (rawPrompt || '').trim().toLowerCase();
  if (!clean) return null;

  // Explicit project ID queries
  if (
    clean.includes('project id') ||
    clean.includes('project identifier') ||
    clean === 'id' ||
    clean === 'id?' ||
    clean.includes('id of the project') ||
    clean.includes('id of this project') ||
    clean.includes('what is the id') ||
    clean.includes("what's the id") ||
    clean.includes('what is its id') ||
    clean.includes("what's its id") ||
    clean.includes('give me the id') ||
    clean.includes('show the id') ||
    clean.includes('get the id') ||
    clean.includes('get project id')
  ) {
    return 'PROJECT_ID';
  }

  // Overdue queries
  if (
    clean.includes('overdue') ||
    clean.includes('past due') ||
    clean.includes('late task') ||
    clean.includes('behind schedule task')
  ) {
    return 'OVERDUE';
  }

  // Milestones queries
  if (
    clean.includes('remaining milestone') ||
    clean.includes('milestones remaining') ||
    clean.includes('what milestones') ||
    clean.includes('pending milestone') ||
    (clean.includes('milestone') && (clean.includes('remain') || clean.includes('left') || clean.includes('pending') || clean.includes('status')))
  ) {
    return 'MILESTONES';
  }

  // Progress queries
  if (
    clean.includes('progressing') ||
    clean.includes('how is my project') ||
    clean.includes('how is the project') ||
    clean.includes('project progress') ||
    clean.includes('progress of the project') ||
    clean.includes('completion rate')
  ) {
    return 'PROGRESS';
  }

  // Project details / overview queries
  if (
    clean.includes('project detail') ||
    clean.includes('project details') ||
    clean.includes('current project') ||
    clean.includes('about the project') ||
    clean.includes('about my project') ||
    clean.includes('project overview') ||
    clean.includes('project information') ||
    clean.includes('project summary') ||
    clean.includes('project info')
  ) {
    return 'DETAILS';
  }

  return null;
};

export const buildProjectIdResponse = (ctx: FreshProjectContext): string => {
  return `The project ID for **"${ctx.name}"** is \`${ctx.id}\`.`;
};

export const buildProjectDetailsResponse = (ctx: FreshProjectContext): string => {
  const teamList =
    ctx.teamMembers && ctx.teamMembers.length > 0
      ? ctx.teamMembers
          .map((m) => `• **${m.name}** (${m.role})${m.email ? ` – \`${m.email}\`` : ''}`)
          .join('\n')
      : '• No assigned team members listed in project records.';

  const overdueList =
    ctx.overdueTasks.length > 0
      ? ctx.overdueTasks
          .map(
            (t) =>
              `• **${t.title}** (${t.priority} Priority, Due: \`${t.dueDate || 'N/A'}\`, Status: ${t.status}${t.assigneeName ? `, Assignee: ${t.assigneeName}` : ''})`
          )
          .join('\n')
      : '• No overdue tasks currently recorded.';

  const milestonesList =
    ctx.remainingMilestones.length > 0
      ? ctx.remainingMilestones
          .map(
            (m) =>
              `• **${m.title}** (Target: \`${m.dueDate || 'N/A'}\`, Progress: ${m.progress}%, Status: ${m.status}${m.ownerName ? `, Owner: ${m.ownerName}` : ''})`
          )
          .join('\n')
      : '• All project milestones have been achieved.';

  // Build tailored next steps clearly distinguished from existing project data
  const nextSteps: string[] = [];
  if (ctx.healthScore !== undefined && ctx.healthScore < 50) {
    nextSteps.push(
      `**Health Risk Remediation**: The project health score is at ${ctx.healthScore}/100 (${ctx.riskLevel || 'High'} Risk). Immediate triage should focus on unblocking the ${ctx.overdueTasks.length} overdue task(s).`
    );
  }
  if (ctx.overdueTasks.length > 0) {
    const topCritical = ctx.overdueTasks.find((t) => t.priority === 'Critical') || ctx.overdueTasks[0];
    nextSteps.push(
      `**Critical Task Focus**: Prioritize immediate resolution for **"${topCritical.title}"** (Due: \`${topCritical.dueDate || 'Past Due'}\`).`
    );
  }
  if (ctx.remainingMilestones.length > 0) {
    const nextMilestone = ctx.remainingMilestones[0];
    nextSteps.push(
      `**Upcoming Milestone Delivery**: Align team sprint efforts around delivering **"${nextMilestone.title}"** (Current Progress: ${nextMilestone.progress}%).`
    );
  }
  if (nextSteps.length === 0) {
    nextSteps.push(
      `**Sustain Velocity**: Project execution is on schedule with no overdue tasks. Maintain current sprint cadence towards the target deadline.`
    );
  }

  const nextStepsSection = nextSteps.map((step) => `• ${step}`).join('\n');

  return (
    `**Project Overview: "${ctx.name}"**\n\n` +
    `• **Client**: ${ctx.clientName}\n` +
    `• **Description**: ${ctx.description}\n` +
    `• **Status & Priority**: ${ctx.status} • ${ctx.priority} Priority\n` +
    `• **Timeline**: \`${ctx.startDate}\` to \`${ctx.endDate}\`\n` +
    `• **Overall Progress**: ${ctx.progress}%\n` +
    `• **Health Score**: ${ctx.healthScore ?? 'N/A'}/100 (${ctx.riskLevel ?? 'N/A'} Risk)\n` +
    `• **Budget**: $${ctx.budget?.toLocaleString() ?? 0} (Spent: $${ctx.spent?.toLocaleString() ?? 0})\n` +
    `• **Technology Stack**: ${ctx.techStack.length > 0 ? ctx.techStack.join(', ') : 'None specified'}\n` +
    `• **Project Manager**: ${ctx.managerName || 'Unassigned'}\n\n` +
    `### Assigned Team Members (${ctx.teamMembers?.length ?? 0})\n` +
    `${teamList}\n\n` +
    `### Tasks Overview (${ctx.tasksCount} Total)\n` +
    `• **Completed**: ${ctx.completedTasksCount}\n` +
    `• **In Progress**: ${ctx.inProgressTasksCount}\n` +
    `• **Overdue**: ${ctx.overdueTasks.length}\n\n` +
    `#### Overdue Tasks Breakdown\n` +
    `${overdueList}\n\n` +
    `### Milestones Overview (${ctx.milestonesCount} Total)\n` +
    `• **Achieved**: ${ctx.achievedMilestonesCount}\n` +
    `• **Remaining**: ${ctx.remainingMilestones.length}\n\n` +
    `#### Remaining Milestones\n` +
    `${milestonesList}\n\n` +
    `### Recommended Next Steps\n` +
    `${nextStepsSection}`
  );
};

export const buildProjectProgressResponse = (ctx: FreshProjectContext): string => {
  return (
    `**Project Progress: "${ctx.name}"** (${ctx.clientName})\n\n` +
    `• **Overall Progress**: ${ctx.progress}%\n` +
    `• **Status & Priority**: ${ctx.status} (${ctx.priority} Priority)\n` +
    `• **Health Score**: ${ctx.healthScore ?? 'N/A'}/100 (${ctx.riskLevel ?? 'N/A'} Risk)\n` +
    `• **Tasks**: ${ctx.completedTasksCount} of ${ctx.tasksCount} completed (${ctx.overdueTasks.length} overdue)\n` +
    `• **Milestones**: ${ctx.achievedMilestonesCount} of ${ctx.milestonesCount} achieved (${ctx.remainingMilestones.length} remaining)\n` +
    `• **Timeline**: \`${ctx.startDate}\` to \`${ctx.endDate}\`\n\n` +
    `### Recommended Next Steps\n` +
    `• Maintain focus on resolving the ${ctx.overdueTasks.length} overdue task(s) to safeguard overall project completion.`
  );
};

export const buildProjectOverdueResponse = (ctx: FreshProjectContext): string => {
  if (ctx.overdueTasks.length === 0) {
    return `Great news! There are currently no overdue tasks for project **"${ctx.name}"**. All tasks are progressing on schedule!`;
  }
  const overdueList = ctx.overdueTasks
    .map(
      (t) =>
        `• **${t.title}** (${t.priority} Priority, Due: \`${t.dueDate || 'N/A'}\`, Status: ${t.status}${t.assigneeName ? `, Assignee: ${t.assigneeName}` : ''})`
    )
    .join('\n');
  return (
    `Here are the overdue tasks for project **"${ctx.name}"** (${ctx.overdueTasks.length} total):\n\n` +
    `${overdueList}\n\n` +
    `### Recommended Next Steps\n` +
    `• Reassign or prioritize these overdue tasks to recover sprint milestones and elevate project health.`
  );
};

export const buildProjectMilestonesResponse = (ctx: FreshProjectContext): string => {
  if (ctx.remainingMilestones.length === 0) {
    return `All ${ctx.milestonesCount} milestones have been achieved for project **"${ctx.name}"**!`;
  }
  const milestonesList = ctx.remainingMilestones
    .map(
      (m) =>
        `• **${m.title}** (${m.status}, Target: \`${m.dueDate || 'N/A'}\`, Progress: ${m.progress}%${m.ownerName ? `, Owner: ${m.ownerName}` : ''})`
    )
    .join('\n');
  return (
    `Here are the remaining milestones for project **"${ctx.name}"** (${ctx.remainingMilestones.length} remaining of ${ctx.milestonesCount} total):\n\n` +
    `${milestonesList}\n\n` +
    `### Recommended Next Steps\n` +
    `• Align upcoming sprint deliverables to achieve the nearest milestone on target.`
  );
};

