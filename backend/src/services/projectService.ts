import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { Milestone } from '../models/milestoneModel';
import { User } from '../models/userModel';
import { IProject, ITask, IMilestone, ISubtask } from '../types/project';
import { ITeamMemberRef } from '../types/project';
import { ApiError } from '../utils/errors';

// Roles that can be assigned tasks (excludes Clients)
const NON_ASSIGNABLE_ROLES = ['Client'];

export class ProjectService {
  // Seed initial mock project management data if collections are empty
  static async seedInitialData(): Promise<void> {
    try {
      const projectCount = await Project.countDocuments();
      if (projectCount === 0) {
        const dummyManager = {
          id: 'usr-001',
          name: 'Alex Morgan',
          email: 'admin@devflow.local',
          role: 'Super Admin' as const,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };

        const dummyMembers = [
          {
            id: 'tm-1',
            name: 'Sarah Chen',
            email: 'sarah.c@devflow.io',
            role: 'Project Manager' as const,
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            workloadPercent: 75,
          },
          {
            id: 'tm-2',
            name: 'Marcus Vance',
            email: 'dev@devflow.local',
            role: 'Team Lead' as const,
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            workloadPercent: 88,
          },
          {
            id: 'tm-3',
            name: 'Elena Rostova',
            email: 'elena.r@devflow.io',
            role: 'Developer' as const,
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
            workloadPercent: 70,
          },
          {
            id: 'tm-4',
            name: 'David Kim',
            email: 'david.k@devflow.io',
            role: 'Designer' as const,
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
            workloadPercent: 55,
          },
          {
            id: 'tm-5',
            name: 'Priya Patel',
            email: 'priya.p@devflow.io',
            role: 'QA' as const,
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
            workloadPercent: 80,
          },
        ];

        const insertedProjects = await Project.insertMany([
          {
            name: 'Apex Enterprise Portal & Mobile App',
            clientName: 'Apex Capital Corp',
            description: 'Next-generation AI-driven financial portfolio analytics, real-time transaction processing, and secure mobile workspace.',
            manager: dummyManager,
            members: dummyMembers,
            startDate: '2026-01-10',
            endDate: '2026-08-30',
            status: 'In Progress',
            priority: 'High',
            budget: 180000,
            spent: 95000,
            progress: 68,
            techStack: ['Next.js', 'TypeScript', 'Node.js', 'MongoDB', 'Redis', 'Tailwind'],
            healthScore: 89,
            riskLevel: 'Low',
          },
          {
            name: 'Vanguard AI Knowledge Engine',
            clientName: 'Vanguard Health Systems',
            description: 'Enterprise RAG knowledge synthesizer with semantic search & automated medical document parsing.',
            manager: dummyManager,
            members: [dummyMembers[2], dummyMembers[1], dummyMembers[4]],
            startDate: '2026-02-01',
            endDate: '2026-06-15',
            status: 'In Progress',
            priority: 'Critical',
            budget: 120000,
            spent: 45000,
            progress: 42,
            techStack: ['Python', 'FastAPI', 'LangChain', 'Pinecone', 'React', 'Tailwind'],
            healthScore: 82,
            riskLevel: 'Moderate',
          },
        ]);

        const prj1Id = insertedProjects[0]._id.toString();
        const prj2Id = insertedProjects[1]._id.toString();

        const insertedMilestones = await Milestone.insertMany([
          {
            projectId: prj1Id,
            projectName: 'Apex Enterprise Portal & Mobile App',
            title: 'Planning & Architecture Specification',
            description: 'Complete business requirements, security audit, and system architecture blueprint.',
            status: 'Achieved',
            startDate: '2026-01-10',
            dueDate: '2026-02-28',
            progress: 100,
            relatedTasksCount: 1,
            owner: dummyMembers[1],
          },
          {
            projectId: prj1Id,
            projectName: 'Apex Enterprise Portal & Mobile App',
            title: 'UI/UX Design System & Frontend Implementation',
            description: 'Figma design system tokens, responsive web layouts, dark/light theme system, and client portal UI.',
            status: 'Achieved',
            startDate: '2026-03-01',
            dueDate: '2026-04-30',
            progress: 100,
            relatedTasksCount: 1,
            owner: dummyMembers[3],
          },
          {
            projectId: prj1Id,
            projectName: 'Apex Enterprise Portal & Mobile App',
            title: 'Backend API, Authentication & Integration',
            description: 'OAuth2 pipeline, JWT refreshToken rotation, MongoDB schemas, and real-time transaction streaming.',
            status: 'In Progress',
            startDate: '2026-05-01',
            dueDate: '2026-06-30',
            progress: 75,
            relatedTasksCount: 2,
            owner: dummyMembers[1],
          },
          {
            projectId: prj1Id,
            projectName: 'Apex Enterprise Portal & Mobile App',
            title: 'QA Testing, Performance & Production Deployment',
            description: 'Automated E2E regression testing, load testing, security review, and final production release.',
            status: 'Upcoming',
            startDate: '2026-07-01',
            dueDate: '2026-08-30',
            progress: 25,
            relatedTasksCount: 1,
            owner: dummyMembers[4],
          },
        ]);

        const ms1Id = insertedMilestones[0]._id.toString();
        const ms2Id = insertedMilestones[1]._id.toString();
        const ms3Id = insertedMilestones[2]._id.toString();
        const ms4Id = insertedMilestones[3]._id.toString();

        await Task.insertMany([
          {
            projectId: prj1Id,
            projectName: 'Apex Enterprise Portal & Mobile App',
            milestoneId: ms3Id,
            title: 'Implement OAuth2 & Multi-Factor Auth JWT Pipeline',
            description: 'Set up HttpOnly session cookies, refreshToken rotation, and authenticator app TOTP verification.',
            assignee: dummyMembers[1],
            status: 'In Progress',
            priority: 'High',
            dueDate: '2026-06-25',
            tags: ['Security', 'Backend', 'Auth'],
            subtasks: [
              { id: 'st-1', title: 'Setup JWT helper utilities', completed: true },
              { id: 'st-2', title: 'Implement refresh token rotation model', completed: true },
              { id: 'st-3', title: 'Integrate TOTP QR code generator', completed: false },
            ],
            commentsCount: 5,
          },
          {
            projectId: prj1Id,
            projectName: 'Apex Enterprise Portal & Mobile App',
            milestoneId: ms2Id,
            title: 'Design Enterprise Dark/Light Theme System',
            description: 'Refine UI components, CSS design tokens, typography, and contrast accessibility across all views.',
            assignee: dummyMembers[3],
            status: 'Completed',
            priority: 'Medium',
            dueDate: '2026-04-20',
            tags: ['Design', 'UI/UX', 'Tailwind'],
            subtasks: [
              { id: 'st-4', title: 'Create Figma design token library', completed: true },
              { id: 'st-5', title: 'Implement Tailwind globals.css custom theme', completed: true },
            ],
            commentsCount: 3,
          },
          {
            projectId: prj1Id,
            projectName: 'Apex Enterprise Portal & Mobile App',
            milestoneId: ms3Id,
            title: 'Real-Time WebSocket Transaction Stream API',
            description: 'Build Redis pub/sub socket connection to stream real-time financial ledger updates.',
            assignee: dummyMembers[2],
            status: 'In Progress',
            priority: 'Critical',
            dueDate: '2026-06-28',
            tags: ['Backend', 'WebSockets', 'Node.js'],
            subtasks: [
              { id: 'st-6', title: 'Build Redis pub/sub channel handler', completed: true },
              { id: 'st-7', title: 'Integrate client socket listener', completed: true },
              { id: 'st-8', title: 'Add rate limiting & failover protection', completed: false },
            ],
            commentsCount: 4,
          },
          {
            projectId: prj1Id,
            projectName: 'Apex Enterprise Portal & Mobile App',
            milestoneId: ms4Id,
            title: 'E2E Automated Regression Suite for Client Portal',
            description: 'Build automated regression scripts using Cypress to verify authentication and client portal flows.',
            assignee: dummyMembers[4],
            status: 'In Progress',
            priority: 'High',
            dueDate: '2026-08-15',
            tags: ['QA', 'Cypress', 'Testing'],
            subtasks: [
              { id: 'st-9', title: 'Write auth & portal login integration test cases', completed: true },
              { id: 'st-10', title: 'Configure Cypress CI pipeline runner', completed: true },
              { id: 'st-11', title: 'Load test API endpoints under 500 QPS load', completed: false },
            ],
            commentsCount: 2,
          },
          {
            projectId: prj1Id,
            projectName: 'Apex Enterprise Portal & Mobile App',
            milestoneId: ms1Id,
            title: 'Project Requirements & Architecture Specification Review',
            description: 'Draft comprehensive system architecture specification and obtain client sign-off.',
            assignee: dummyMembers[0],
            status: 'Completed',
            priority: 'Medium',
            dueDate: '2026-02-25',
            tags: ['Planning', 'Architecture', 'Documentation'],
            subtasks: [
              { id: 'st-12', title: 'Draft system architecture diagram', completed: true },
              { id: 'st-13', title: 'Finalize client sign-off agreement', completed: true },
            ],
            commentsCount: 6,
          },
        ]);
      }
    } catch (error) {
      console.warn('Project Seeding notice:', (error as Error).message);
    }
  }

  // --- PROJECTS ---
  static async getProjects(): Promise<IProject[]> {
    await this.seedInitialData();
    return await Project.find().sort({ createdAt: -1 });
  }

  static async getProjectById(id: string): Promise<IProject> {
    await this.seedInitialData();
    let project = await Project.findById(id);
    if (!project) {
      // Fallback search by name or custom id matching
      project = await Project.findOne({ _id: id });
    }
    if (!project) throw new ApiError('Project not found', 404);
    return project;
  }

  static async createProject(data: Partial<IProject>, userId?: string): Promise<IProject> {
    if (!data.name || !data.clientName || !data.description) {
      throw new ApiError('Please provide project name, client name, and description', 400);
    }
    const defaultManager = data.manager || {
      id: userId || 'usr-001',
      name: 'Alex Morgan',
      email: 'alex.morgan@devflow.io',
      role: 'Super Admin' as const,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };

    const project = await Project.create({
      ...data,
      manager: defaultManager,
      ...(userId && { createdBy: userId }),
    });

    return project;
  }

  static async updateProject(id: string, data: Partial<IProject>): Promise<IProject> {
    const project = await Project.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!project) throw new ApiError('Project not found', 404);
    return project;
  }

  static async deleteProject(id: string): Promise<void> {
    const project = await Project.findByIdAndDelete(id);
    if (!project) throw new ApiError('Project not found', 404);
  }

  // --- TASKS ---
  static async getTasks(projectId?: string): Promise<ITask[]> {
    await this.seedInitialData();
    const query = projectId ? { projectId } : {};
    return await Task.find(query).sort({ createdAt: -1 });
  }

  /**
   * Returns eligible assignees for a task in the given project.
   * Eligibility: project members + manager, excluding any user with Client role.
   * Enriches workload/availability from live User collection where the user exists.
   */
  static async getEligibleAssignees(projectId: string): Promise<ITeamMemberRef[]> {
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError('Project not found', 404);

    const candidates: ITeamMemberRef[] = [];

    // Collect all project participants (manager + members)
    const allRefs: ITeamMemberRef[] = [];
    if (project.manager && !NON_ASSIGNABLE_ROLES.includes(project.manager.role)) {
      allRefs.push(project.manager);
    }
    if (Array.isArray(project.members)) {
      project.members.forEach((m) => {
        if (!NON_ASSIGNABLE_ROLES.includes(m.role) && !allRefs.some((r) => r.id === m.id)) {
          allRefs.push(m);
        }
      });
    }

    // Enrich with live data from User collection
    for (const ref of allRefs) {
      try {
        const liveUser = await User.findById(ref.id).select('-password');
        if (liveUser) {
          candidates.push({
            id: liveUser._id.toString(),
            name: liveUser.name,
            email: liveUser.email,
            role: liveUser.role,
            avatar: liveUser.avatar || ref.avatar,
            workloadPercent: liveUser.workloadPercent ?? ref.workloadPercent,
          });
        } else {
          // User doc not found (e.g. seeded ref): use project ref as-is
          candidates.push(ref);
        }
      } catch (_) {
        candidates.push(ref);
      }
    }

    return candidates;
  }

  static async getTaskById(id: string): Promise<ITask> {
    const task = await Task.findById(id);
    if (!task) throw new ApiError('Task not found', 404);
    return task;
  }

  static async createTask(data: Partial<ITask>, userId?: string): Promise<ITask> {
    if (!data.title || !data.title.trim()) {
      throw new ApiError('Please provide a task title', 400);
    }

    const title = data.title.trim();
    const description = data.description && data.description.trim() ? data.description.trim() : title;
    const dueDate = data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    let project;
    if (data.projectId) {
      project = await Project.findById(data.projectId);
      if (!project) {
        try {
          project = await Project.findOne({ _id: data.projectId });
        } catch (_) {}
      }
    }

    if (!project && data.projectName) {
      project = await Project.findOne({ name: data.projectName });
      if (!project) {
        project = await Project.findOne({ name: { $regex: new RegExp(data.projectName, 'i') } });
      }
    }

    if (!project) {
      project = await Project.findOne();
    }

    if (!project) {
      throw new ApiError('Please select a valid existing project', 400);
    }

    data.projectId = project._id.toString();
    data.projectName = project.name;

    // Resolve assignee:
    let assignee = data.assignee;

    if (assignee && assignee.id && assignee.id !== 'unassigned') {
      if (NON_ASSIGNABLE_ROLES.includes(assignee.role)) {
        throw new ApiError(`Cannot assign a task to a user with role '${assignee.role}'.`, 400);
      }
    } else if (!assignee || assignee.id === 'unassigned') {
      assignee = {
        id: 'unassigned',
        name: 'Unassigned',
        email: 'unassigned@devflow.io',
        role: 'Developer' as const,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
    }

    // Duplicate Prevention Check: Check if an exact task title already exists in this project
    const existingTask = await Task.findOne({
      projectId: data.projectId,
      title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existingTask) {
      return existingTask;
    }

    // Default milestoneId if not provided but project has a milestone
    let milestoneId = data.milestoneId || '';
    if (!milestoneId && data.projectId) {
      const existingMilestone = await Milestone.findOne({ projectId: data.projectId });
      if (existingMilestone) {
        milestoneId = existingMilestone._id.toString();
      }
    }

    const task = await Task.create({
      ...data,
      projectId: data.projectId,
      projectName: data.projectName,
      title,
      description,
      dueDate,
      assignee,
      status: data.status || 'Todo',
      priority: data.priority || 'Medium',
      milestoneId,
      ...(userId && { createdBy: userId }),
    });

    if (milestoneId) {
      await this.syncMilestoneStats(milestoneId);
    }

    return task;
  }

  static async updateTask(id: string, data: Partial<ITask>): Promise<ITask> {
    const prevTask = await Task.findById(id);
    const task = await Task.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!task) throw new ApiError('Task not found', 404);

    if (prevTask && prevTask.milestoneId && prevTask.milestoneId !== task.milestoneId) {
      await this.syncMilestoneStats(prevTask.milestoneId);
    }
    if (task.milestoneId) {
      await this.syncMilestoneStats(task.milestoneId);
    }
    if (task.projectId) {
      await this.syncProjectStats(task.projectId);
    }
    return task;
  }

  static async deleteTask(id: string): Promise<void> {
    const task = await Task.findById(id);
    if (!task) throw new ApiError('Task not found', 404);

    await Task.findByIdAndDelete(id);
    if (task.milestoneId) {
      await this.syncMilestoneStats(task.milestoneId);
    }
    if (task.projectId) {
      await this.syncProjectStats(task.projectId);
    }
  }

  static async syncProjectStats(projectId: string): Promise<void> {
    if (!projectId) return;
    try {
      const project = await Project.findById(projectId);
      if (!project) return;

      const pIdStr = project._id.toString();
      const idsToMatch = Array.from(new Set([projectId, pIdStr, project.id].filter(Boolean)));

      const tasks = await Task.find({ projectId: { $in: idsToMatch } });
      if (tasks.length > 0) {
        let sum = 0;
        for (const t of tasks) {
          if (t.status === 'Completed') sum += 100;
          else if (t.status === 'Review') sum += 75;
          else if (t.status === 'In Progress') sum += 50;
        }
        const progress = Math.round(sum / tasks.length);
        project.progress = progress;
        await project.save();
      }
    } catch (err) {
      console.error(`Error syncing project stats for ${projectId}:`, err);
    }
  }

  static async syncMilestoneStats(milestoneId: string): Promise<void> {
    if (!milestoneId) return;
    try {
      const milestone = await Milestone.findById(milestoneId);
      if (!milestone) return;

      const mIdStr = milestone._id.toString();
      const idsToMatch = Array.from(new Set([milestoneId, mIdStr, milestone.id].filter(Boolean)));

      const linkedTasks = await Task.find({ milestoneId: { $in: idsToMatch } });
      const totalTasks = linkedTasks.length;

      let progress = milestone.progress || 0;
      let status = milestone.status;

      if (totalTasks > 0) {
        let taskProgressSum = 0;
        let hasActiveTasks = false;

        for (const t of linkedTasks) {
          let tProg = 0;
          if (t.status === 'Completed') {
            tProg = 100;
            hasActiveTasks = true;
          } else if (t.status === 'Review') {
            tProg = 75;
            hasActiveTasks = true;
          } else if (t.status === 'In Progress') {
            tProg = 50;
            hasActiveTasks = true;
          }

          if (t.subtasks && t.subtasks.length > 0) {
            const completedSub = t.subtasks.filter((st) => st.completed).length;
            const subProg = Math.round((completedSub / t.subtasks.length) * 100);
            tProg = Math.max(tProg, subProg);
          }
          taskProgressSum += tProg;
        }

        progress = Math.round(taskProgressSum / totalTasks);

        const todayStr = new Date().toISOString().split('T')[0];

        if (progress === 100) {
          status = 'Achieved';
        } else if (milestone.dueDate && milestone.dueDate < todayStr && progress < 100) {
          status = 'Overdue';
        } else if (progress > 0 || hasActiveTasks) {
          status = 'In Progress';
        } else {
          status = 'Upcoming';
        }
      }

      await Milestone.findByIdAndUpdate(milestone._id, {
        relatedTasksCount: totalTasks,
        progress,
        status,
      });
    } catch (err) {
      console.error(`Error syncing milestone stats for ${milestoneId}:`, err);
    }
  }

  // --- SUBTASKS ---
  static async addSubtask(taskId: string, title: string): Promise<ITask> {
    const task = await Task.findById(taskId);
    if (!task) throw new ApiError('Task not found', 404);

    const subtaskId = `st-${Date.now()}`;
    task.subtasks.push({ id: subtaskId, title, completed: false });
    await task.save();
    return task;
  }

  static async updateSubtask(
    taskId: string,
    subtaskId: string,
    completed?: boolean,
    title?: string
  ): Promise<ITask> {
    const task = await Task.findById(taskId);
    if (!task) throw new ApiError('Task not found', 404);

    const subtask = task.subtasks.find((st) => st.id === subtaskId);
    if (!subtask) throw new ApiError('Subtask not found', 404);

    if (typeof completed === 'boolean') subtask.completed = completed;
    if (title) subtask.title = title;

    await task.save();
    return task;
  }

  static async deleteSubtask(taskId: string, subtaskId: string): Promise<ITask> {
    const task = await Task.findById(taskId);
    if (!task) throw new ApiError('Task not found', 404);

    task.subtasks = task.subtasks.filter((st) => st.id !== subtaskId);
    await task.save();
    return task;
  }

  // --- MILESTONES ---
  static async getMilestones(projectId?: string): Promise<IMilestone[]> {
    await this.seedInitialData();
    const query = projectId ? { projectId } : {};
    const milestones = await Milestone.find(query).sort({ createdAt: -1 });

    const todayStr = new Date().toISOString().split('T')[0];

    for (const milestone of milestones) {
      const mIdStr = milestone._id.toString();
      const idsToMatch = Array.from(new Set([mIdStr, milestone.id].filter(Boolean)));

      const linkedTasks = await Task.find({ milestoneId: { $in: idsToMatch } });
      const totalLinked = linkedTasks.length;

      let progress = milestone.progress || 0;
      let status = milestone.status;

      if (totalLinked > 0) {
        let taskProgressSum = 0;
        let hasActiveTasks = false;

        for (const t of linkedTasks) {
          let tProg = 0;
          if (t.status === 'Completed') {
            tProg = 100;
            hasActiveTasks = true;
          } else if (t.status === 'Review') {
            tProg = 75;
            hasActiveTasks = true;
          } else if (t.status === 'In Progress') {
            tProg = 50;
            hasActiveTasks = true;
          }

          if (t.subtasks && t.subtasks.length > 0) {
            const completedSub = t.subtasks.filter((st) => st.completed).length;
            const subProg = Math.round((completedSub / t.subtasks.length) * 100);
            tProg = Math.max(tProg, subProg);
          }
          taskProgressSum += tProg;
        }

        progress = Math.round(taskProgressSum / totalLinked);

        if (progress === 100) {
          status = 'Achieved';
        } else if (milestone.dueDate && milestone.dueDate < todayStr && progress < 100) {
          status = 'Overdue';
        } else if (progress > 0 || hasActiveTasks) {
          status = 'In Progress';
        } else {
          status = 'Upcoming';
        }
      }

      if (milestone.relatedTasksCount !== totalLinked || milestone.progress !== progress || milestone.status !== status) {
        milestone.relatedTasksCount = totalLinked;
        milestone.progress = progress;
        milestone.status = status;
        await Milestone.findByIdAndUpdate(milestone._id, {
          relatedTasksCount: totalLinked,
          progress,
          status,
        });
      }
    }

    return milestones;
  }

  static async getMilestoneById(id: string): Promise<IMilestone> {
    const milestone = await Milestone.findById(id);
    if (!milestone) throw new ApiError('Milestone not found', 404);
    return milestone;
  }

  static async createMilestone(
    data: Partial<IMilestone> & {
      linkedTaskIds?: string[];
      initialTasks?: Array<{ title: string; description?: string; priority?: string; dueDate?: string }>;
    },
    userId?: string
  ): Promise<IMilestone> {
    const { linkedTaskIds, initialTasks, ...milestoneData } = data;

    if (milestoneData.projectId && !milestoneData.projectName) {
      const project = await Project.findById(milestoneData.projectId);
      if (project) {
        milestoneData.projectName = project.name;
      }
    }

    if (!milestoneData.title || !milestoneData.projectName || !milestoneData.dueDate) {
      throw new ApiError('Please provide milestone title, project name, and due date', 400);
    }

    const title = milestoneData.title.trim();

    // Duplicate Prevention Check: Check if an exact milestone title already exists in this project
    const existingMilestone = await Milestone.findOne({
      projectId: milestoneData.projectId,
      title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existingMilestone) {
      return existingMilestone;
    }

    const defaultOwner = milestoneData.owner || {
      id: 'tm-1',
      name: 'Sarah Chen',
      email: 'sarah.c@devflow.io',
      role: 'Project Manager' as const,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    };

    const milestone = await Milestone.create({
      ...milestoneData,
      title,
      owner: defaultOwner,
      ...(userId && { createdBy: userId }),
    });

    const mIdStr = milestone._id.toString();

    if (Array.isArray(linkedTaskIds) && linkedTaskIds.length > 0) {
      await Task.updateMany(
        { _id: { $in: linkedTaskIds }, projectId: milestone.projectId },
        { milestoneId: mIdStr }
      );
    }

    if (Array.isArray(initialTasks) && initialTasks.length > 0) {
      for (const t of initialTasks) {
        if (!t.title || !t.title.trim()) continue;
        await Task.create({
          projectId: milestone.projectId,
          projectName: milestone.projectName,
          title: t.title.trim(),
          description: t.description || `Action item for milestone "${milestone.title}"`,
          priority: (t.priority as any) || 'Medium',
          dueDate: t.dueDate || milestone.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          status: 'Todo',
          milestoneId: mIdStr,
          assignee: {
            id: 'unassigned',
            name: 'Unassigned',
            email: 'unassigned@devflow.io',
            role: 'Developer',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            skills: [],
            assignedProjects: [],
            workloadPercent: 0,
            availability: 'Available',
            performanceRating: 5.0,
            joinedDate: new Date().toISOString().split('T')[0],
          },
          tags: [milestone.title.split(':')[0].trim()],
          subtasks: [],
          commentsCount: 0,
        });
      }
    }

    await this.syncMilestoneStats(mIdStr);
    const updated = await Milestone.findById(mIdStr);
    return updated || milestone;
  }

  static async updateMilestone(
    id: string,
    data: Partial<IMilestone> & { linkedTaskIds?: string[] }
  ): Promise<IMilestone> {
    const { linkedTaskIds, ...milestoneData } = data;
    const milestone = await Milestone.findByIdAndUpdate(id, milestoneData, { new: true, runValidators: true });
    if (!milestone) throw new ApiError('Milestone not found', 404);

    if (Array.isArray(linkedTaskIds)) {
      const currentlyLinkedTasks = await Task.find({ milestoneId: id });
      const currentlyLinkedIds = currentlyLinkedTasks.map((t) => t._id.toString());

      // Tasks removed from this milestone: set milestoneId = ''
      const removedTaskIds = currentlyLinkedIds.filter((tId) => !linkedTaskIds.includes(tId));
      if (removedTaskIds.length > 0) {
        await Task.updateMany({ _id: { $in: removedTaskIds } }, { milestoneId: '' });
      }

      // Tasks added to this milestone: set milestoneId = id (ensure same project)
      const addedTaskIds = linkedTaskIds.filter((tId) => !currentlyLinkedIds.includes(tId));
      if (addedTaskIds.length > 0) {
        const addedTasksDocs = await Task.find({ _id: { $in: addedTaskIds } });
        const prevMilestoneIds = Array.from(new Set(addedTasksDocs.map((t) => t.milestoneId).filter(Boolean)));

        await Task.updateMany(
          { _id: { $in: addedTaskIds }, projectId: milestone.projectId },
          { milestoneId: id }
        );

        for (const prevMId of prevMilestoneIds) {
          if (prevMId && prevMId !== id) {
            await this.syncMilestoneStats(prevMId);
          }
        }
      }
    }

    await this.syncMilestoneStats(id);
    const updated = await Milestone.findById(id);
    return updated || milestone;
  }

  static async deleteMilestone(id: string): Promise<void> {
    // Unlink tasks before deleting milestone (do not delete tasks)
    await Task.updateMany({ milestoneId: id }, { milestoneId: '' });

    const milestone = await Milestone.findByIdAndDelete(id);
    if (!milestone) throw new ApiError('Milestone not found', 404);
  }
}
