import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { Milestone } from '../models/milestoneModel';
import { IProject, ITask, IMilestone, ISubtask } from '../types/project';
import { ApiError } from '../utils/errors';

export class ProjectService {
  // Seed initial mock project management data if collections are empty
  static async seedInitialData(): Promise<void> {
    try {
      const projectCount = await Project.countDocuments();
      if (projectCount === 0) {
        const dummyManager = {
          id: 'usr-001',
          name: 'Alex Morgan',
          email: 'alex.morgan@devflow.io',
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
            workloadPercent: 78,
          },
          {
            id: 'tm-2',
            name: 'Marcus Vance',
            email: 'marcus.v@devflow.io',
            role: 'Team Lead' as const,
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            workloadPercent: 92,
          },
          {
            id: 'tm-3',
            name: 'Elena Rostova',
            email: 'elena.r@devflow.io',
            role: 'Developer' as const,
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
            workloadPercent: 65,
          },
        ];

        const insertedProjects = await Project.insertMany([
          {
            name: 'FinTech Nexus Suite',
            clientName: 'Apex Capital Corp',
            description: 'Next-generation AI-driven financial portfolio analytics and real-time transaction processing platform.',
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
            healthScore: 92,
            riskLevel: 'Low',
          },
          {
            name: 'AI Knowledge Engine',
            clientName: 'Vanguard Systems',
            description: 'Enterprise RAG knowledge base synthesizer with semantic search & automated documentation generation.',
            manager: dummyManager,
            members: [dummyMembers[1], dummyMembers[2]],
            startDate: '2026-02-01',
            endDate: '2026-06-15',
            status: 'In Progress',
            priority: 'Critical',
            budget: 120000,
            spent: 45000,
            progress: 42,
            techStack: ['Python', 'FastAPI', 'LangChain', 'Pinecone', 'React', 'Tailwind'],
            healthScore: 78,
            riskLevel: 'Moderate',
          },
          {
            name: 'HealthPulse Mobile Platform',
            clientName: 'BioHealth Innovations',
            description: 'HIPAA-compliant telemedicine dashboard and patient monitoring mobile app ecosystem.',
            manager: dummyManager,
            members: [dummyMembers[0], dummyMembers[2]],
            startDate: '2025-11-01',
            endDate: '2026-04-30',
            status: 'Review',
            priority: 'Medium',
            budget: 95000,
            spent: 89000,
            progress: 88,
            techStack: ['React Native', 'Node.js', 'Express', 'MongoDB', 'AWS S3'],
            healthScore: 85,
            riskLevel: 'Low',
          },
        ]);

        const prj1Id = insertedProjects[0]._id.toString();
        const prj2Id = insertedProjects[1]._id.toString();
        const prj3Id = insertedProjects[2]._id.toString();

        await Task.insertMany([
          {
            projectId: prj1Id,
            projectName: 'FinTech Nexus Suite',
            title: 'Implement OAuth2 & Multi-Factor Auth JWT Pipeline',
            description: 'Set up HttpOnly session cookies, refreshToken rotation, and authenticator app TOTP verification.',
            assignee: dummyMembers[1],
            status: 'In Progress',
            priority: 'High',
            dueDate: '2026-09-30',
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
            projectName: 'FinTech Nexus Suite',
            title: 'Design Dashboard Dark Mode Glassmorphism System',
            description: 'Refine shadcn/ui components, CSS design tokens, typography, and contrast accessibility.',
            assignee: dummyMembers[0],
            status: 'Review',
            priority: 'Medium',
            dueDate: '2026-09-28',
            tags: ['Design', 'UI/UX', 'Tailwind'],
            subtasks: [
              { id: 'st-4', title: 'Create Figma design token library', completed: true },
              { id: 'st-5', title: 'Implement Tailwind globals.css custom theme', completed: true },
            ],
            commentsCount: 3,
          },
          {
            projectId: prj2Id,
            projectName: 'AI Knowledge Engine',
            title: 'Benchmark Vector Database Query Latency',
            description: 'Optimize Pinecone index hybrid search queries and measure response time under 100 QPS load.',
            assignee: dummyMembers[2],
            status: 'Todo',
            priority: 'Critical',
            dueDate: '2026-10-05',
            tags: ['AI', 'Performance', 'Python'],
            subtasks: [
              { id: 'st-6', title: 'Write load test script using Locust', completed: false },
              { id: 'st-7', title: 'Tune vector embedding dimensionality', completed: false },
            ],
            commentsCount: 2,
          },
        ]);

        await Milestone.insertMany([
          {
            projectId: prj1Id,
            projectName: 'FinTech Nexus Suite',
            title: 'Core Portfolio Engine & Real-time Analytics Beta',
            description: 'Deploy real-time stock websocket stream and basic transaction ledger to staging environment.',
            status: 'In Progress',
            startDate: '2026-08-01',
            dueDate: '2026-10-15',
            progress: 75,
            relatedTasksCount: 14,
            owner: dummyMembers[1],
          },
          {
            projectId: prj2Id,
            projectName: 'AI Knowledge Engine',
            title: 'RAG Pipeline & Custom Document Ingestion API',
            description: 'Support PDF, DOCX, and Markdown parsing with automatic chunking and embedding storage.',
            status: 'Upcoming',
            startDate: '2026-09-15',
            dueDate: '2026-11-01',
            progress: 35,
            relatedTasksCount: 9,
            owner: dummyMembers[2],
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

  static async getTaskById(id: string): Promise<ITask> {
    const task = await Task.findById(id);
    if (!task) throw new ApiError('Task not found', 404);
    return task;
  }

  static async createTask(data: Partial<ITask>, userId?: string): Promise<ITask> {
    if (!data.title || !data.projectName || !data.dueDate) {
      throw new ApiError('Please provide task title, project name, and due date', 400);
    }

    const defaultAssignee = data.assignee || {
      id: 'tm-1',
      name: 'Sarah Chen',
      email: 'sarah.c@devflow.io',
      role: 'Project Manager' as const,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    };

    const task = await Task.create({
      ...data,
      assignee: defaultAssignee,
      ...(userId && { createdBy: userId }),
    });

    return task;
  }

  static async updateTask(id: string, data: Partial<ITask>): Promise<ITask> {
    const task = await Task.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!task) throw new ApiError('Task not found', 404);
    return task;
  }

  static async deleteTask(id: string): Promise<void> {
    const task = await Task.findByIdAndDelete(id);
    if (!task) throw new ApiError('Task not found', 404);
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
    return await Milestone.find(query).sort({ createdAt: -1 });
  }

  static async getMilestoneById(id: string): Promise<IMilestone> {
    const milestone = await Milestone.findById(id);
    if (!milestone) throw new ApiError('Milestone not found', 404);
    return milestone;
  }

  static async createMilestone(data: Partial<IMilestone>, userId?: string): Promise<IMilestone> {
    if (!data.title || !data.projectName || !data.dueDate) {
      throw new ApiError('Please provide milestone title, project name, and due date', 400);
    }

    const defaultOwner = data.owner || {
      id: 'tm-1',
      name: 'Sarah Chen',
      email: 'sarah.c@devflow.io',
      role: 'Project Manager' as const,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    };

    const milestone = await Milestone.create({
      ...data,
      owner: defaultOwner,
      ...(userId && { createdBy: userId }),
    });

    return milestone;
  }

  static async updateMilestone(id: string, data: Partial<IMilestone>): Promise<IMilestone> {
    const milestone = await Milestone.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!milestone) throw new ApiError('Milestone not found', 404);
    return milestone;
  }

  static async deleteMilestone(id: string): Promise<void> {
    const milestone = await Milestone.findByIdAndDelete(id);
    if (!milestone) throw new ApiError('Milestone not found', 404);
  }
}
