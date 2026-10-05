import { api } from './api';
import { Project, Task, Milestone, Subtask, AssigneeRef } from '@/types';

export const projectApi = {
  // --- PROJECTS ---
  async getProjects(): Promise<Project[]> {
    const res = await api.get<{ success: boolean; projects: any[] }>('/projects');
    return res.data.projects.map((p) => ({
      id: p._id || p.id,
      clientId: p.clientId,
      name: p.name,
      clientName: p.clientName,
      description: p.description,
      manager: p.manager,
      members: p.members || [],
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      priority: p.priority,
      budget: p.budget || 0,
      spent: p.spent || 0,
      progress: p.progress || 0,
      techStack: p.techStack || [],
      healthScore: p.healthScore || 100,
      riskLevel: p.riskLevel || 'Low',
    }));
  },

  async getProjectById(id: string): Promise<Project> {
    const res = await api.get<{ success: boolean; project: any }>(`/projects/${id}`);
    const p = res.data.project;
    return {
      id: p._id || p.id,
      clientId: p.clientId,
      name: p.name,
      clientName: p.clientName,
      description: p.description,
      manager: p.manager,
      members: p.members || [],
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      priority: p.priority,
      budget: p.budget || 0,
      spent: p.spent || 0,
      progress: p.progress || 0,
      techStack: p.techStack || [],
      healthScore: p.healthScore || 100,
      riskLevel: p.riskLevel || 'Low',
    };
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const res = await api.post<{ success: boolean; project: any }>('/projects', data);
    const p = res.data.project;
    return {
      id: p._id || p.id,
      clientId: p.clientId,
      name: p.name,
      clientName: p.clientName,
      description: p.description,
      manager: p.manager,
      members: p.members || [],
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      priority: p.priority,
      budget: p.budget || 0,
      spent: p.spent || 0,
      progress: p.progress || 0,
      techStack: p.techStack || [],
      healthScore: p.healthScore || 100,
      riskLevel: p.riskLevel || 'Low',
    };
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const res = await api.put<{ success: boolean; project: any }>(`/projects/${id}`, data);
    const p = res.data.project;
    return {
      id: p._id || p.id,
      clientId: p.clientId,
      name: p.name,
      clientName: p.clientName,
      description: p.description,
      manager: p.manager,
      members: p.members || [],
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      priority: p.priority,
      budget: p.budget || 0,
      spent: p.spent || 0,
      progress: p.progress || 0,
      techStack: p.techStack || [],
      healthScore: p.healthScore || 100,
      riskLevel: p.riskLevel || 'Low',
    };
  },

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  // --- TASKS ---
  async getTasks(projectId?: string): Promise<Task[]> {
    const url = projectId ? `/tasks?projectId=${projectId}` : '/tasks';
    const res = await api.get<{ success: boolean; tasks: any[] }>(url);
    return res.data.tasks.map((t) => ({
      id: t._id || t.id,
      projectId: t.projectId,
      projectName: t.projectName,
      title: t.title,
      description: t.description || '',
      assignee: t.assignee,
      createdBy: t.createdBy,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      milestoneId: t.milestoneId || '',
      tags: t.tags || [],
      subtasks: t.subtasks || [],
      commentsCount: t.commentsCount || 0,
      createdAt: t.createdAt,
    }));
  },

  async createTask(data: Partial<Task>): Promise<Task> {
    const res = await api.post<{ success: boolean; task: any }>('/tasks', data);
    const t = res.data.task;
    return {
      id: t._id || t.id,
      projectId: t.projectId,
      projectName: t.projectName,
      title: t.title,
      description: t.description || '',
      assignee: t.assignee,
      createdBy: t.createdBy,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      milestoneId: t.milestoneId || '',
      tags: t.tags || [],
      subtasks: t.subtasks || [],
      commentsCount: t.commentsCount || 0,
      createdAt: t.createdAt,
    };
  },

  async getEligibleAssignees(projectId: string): Promise<AssigneeRef[]> {
    const res = await api.get<{ success: boolean; assignees: AssigneeRef[] }>('/tasks/eligible-assignees', {
      params: { projectId },
    });
    return res.data.assignees;
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const res = await api.put<{ success: boolean; task: any }>(`/tasks/${id}`, data);
    const t = res.data.task;
    return {
      id: t._id || t.id,
      projectId: t.projectId,
      projectName: t.projectName,
      title: t.title,
      description: t.description || '',
      assignee: t.assignee,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      milestoneId: t.milestoneId || '',
      tags: t.tags || [],
      subtasks: t.subtasks || [],
      commentsCount: t.commentsCount || 0,
      createdAt: t.createdAt,
    };
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  // --- SUBTASKS ---
  async addSubtask(taskId: string, title: string): Promise<Task> {
    const res = await api.post<{ success: boolean; task: any }>(`/tasks/${taskId}/subtasks`, { title });
    const t = res.data.task;
    return {
      id: t._id || t.id,
      projectId: t.projectId,
      projectName: t.projectName,
      title: t.title,
      description: t.description || '',
      assignee: t.assignee,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      tags: t.tags || [],
      subtasks: t.subtasks || [],
      commentsCount: t.commentsCount || 0,
      createdAt: t.createdAt,
    };
  },

  async updateSubtask(taskId: string, subtaskId: string, completed?: boolean, title?: string): Promise<Task> {
    const res = await api.put<{ success: boolean; task: any }>(`/tasks/${taskId}/subtasks/${subtaskId}`, { completed, title });
    const t = res.data.task;
    return {
      id: t._id || t.id,
      projectId: t.projectId,
      projectName: t.projectName,
      title: t.title,
      description: t.description || '',
      assignee: t.assignee,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      tags: t.tags || [],
      subtasks: t.subtasks || [],
      commentsCount: t.commentsCount || 0,
      createdAt: t.createdAt,
    };
  },

  async deleteSubtask(taskId: string, subtaskId: string): Promise<Task> {
    const res = await api.delete<{ success: boolean; task: any }>(`/tasks/${taskId}/subtasks/${subtaskId}`);
    const t = res.data.task;
    return {
      id: t._id || t.id,
      projectId: t.projectId,
      projectName: t.projectName,
      title: t.title,
      description: t.description || '',
      assignee: t.assignee,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      tags: t.tags || [],
      subtasks: t.subtasks || [],
      commentsCount: t.commentsCount || 0,
      createdAt: t.createdAt,
    };
  },

  // --- MILESTONES ---
  async getMilestones(projectId?: string): Promise<Milestone[]> {
    const url = projectId ? `/milestones?projectId=${projectId}` : '/milestones';
    const res = await api.get<{ success: boolean; milestones: any[] }>(url);
    return res.data.milestones.map((m) => ({
      id: m._id || m.id,
      projectId: m.projectId,
      projectName: m.projectName,
      title: m.title,
      description: m.description || '',
      status: m.status,
      startDate: m.startDate,
      dueDate: m.dueDate,
      progress: m.progress || 0,
      relatedTasksCount: m.relatedTasksCount || 0,
      owner: m.owner,
    }));
  },

  async createMilestone(
    data: Partial<Milestone> & {
      linkedTaskIds?: string[];
      initialTasks?: Array<{ title: string; description?: string; priority?: string; dueDate?: string }>;
    }
  ): Promise<Milestone> {
    const res = await api.post<{ success: boolean; milestone: any }>('/milestones', data);
    const m = res.data.milestone;
    return {
      id: m._id || m.id,
      projectId: m.projectId,
      projectName: m.projectName,
      title: m.title,
      description: m.description || '',
      status: m.status,
      startDate: m.startDate,
      dueDate: m.dueDate,
      progress: m.progress || 0,
      relatedTasksCount: m.relatedTasksCount || 0,
      owner: m.owner,
    };
  },

  async updateMilestone(id: string, data: Partial<Milestone> & { linkedTaskIds?: string[] }): Promise<Milestone> {
    const res = await api.put<{ success: boolean; milestone: any }>(`/milestones/${id}`, data);
    const m = res.data.milestone;
    return {
      id: m._id || m.id,
      projectId: m.projectId,
      projectName: m.projectName,
      title: m.title,
      description: m.description || '',
      status: m.status,
      startDate: m.startDate,
      dueDate: m.dueDate,
      progress: m.progress || 0,
      relatedTasksCount: m.relatedTasksCount || 0,
      owner: m.owner,
    };
  },

  async deleteMilestone(id: string): Promise<void> {
    await api.delete(`/milestones/${id}`);
  },
};
