import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { asyncHandler } from '../utils/errors';
import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { Lead } from '../models/leadModel';
import { Client } from '../models/clientModel';
import { Milestone } from '../models/milestoneModel';
import { Meeting } from '../models/meetingModel';
import { User } from '../models/userModel';

export const globalSearch = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const rawQuery = String(req.query.q || '').trim();
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    if (!rawQuery || rawQuery.length < 1) {
      res.status(200).json({
        query: rawQuery,
        total: 0,
        results: {
          projects: [],
          tasks: [],
          leads: [],
          clients: [],
          milestones: [],
          meetings: [],
          team: [],
        },
      });
      return;
    }

    // Escape regex special characters
    const escapedQ = rawQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQ, 'i');

    const canViewCRM = ['Super Admin', 'Admin', 'Project Manager'].includes(user.role);
    const isClient = user.role === 'Client';

    const limit = 5;

    // 1. Projects Query
    let projectFilter: any = {
      $or: [
        { name: regex },
        { clientName: regex },
        { description: regex },
        { techStack: regex },
      ],
    };
    if (isClient) {
      projectFilter = {
        $and: [
          projectFilter,
          { $or: [{ clientName: user.name }, { clientName: user.email }] },
        ],
      };
    }

    // 2. Tasks Query
    const taskFilter: any = {
      $or: [
        { title: regex },
        { description: regex },
        { projectName: regex },
        { tags: regex },
        { 'subtasks.title': regex },
      ],
    };

    // 3. Milestones Query
    const milestoneFilter: any = {
      $or: [
        { title: regex },
        { description: regex },
        { projectName: regex },
        { 'owner.name': regex },
      ],
    };

    // 4. Meetings Query
    let meetingFilter: any = {
      $or: [
        { title: regex },
        { clientName: regex },
        { notes: regex },
        { outcome: regex },
        { nextSteps: regex },
      ],
    };
    if (isClient) {
      meetingFilter = {
        $and: [
          meetingFilter,
          { $or: [{ clientName: user.name }, { clientName: user.email }] },
        ],
      };
    }

    // Execute database queries in parallel
    const [projects, tasks, leads, clients, milestones, meetings, team] = await Promise.all([
      Project.find(projectFilter).limit(limit).select('_id name clientName status priority progress').lean(),
      Task.find(taskFilter).limit(limit).select('_id title projectName status priority dueDate').lean(),
      canViewCRM
        ? Lead.find({
            $or: [
              { name: regex },
              { company: regex },
              { email: regex },
              { source: regex },
              { assignedTo: regex },
            ],
          })
            .limit(limit)
            .select('_id name company email status value')
            .lean()
        : Promise.resolve([]),
      canViewCRM
        ? Client.find({
            $or: [{ name: regex }, { company: regex }, { email: regex }, { phone: regex }],
          })
            .limit(limit)
            .select('_id name company email status phone')
            .lean()
        : Promise.resolve([]),
      Milestone.find(milestoneFilter).limit(limit).select('_id title projectName status dueDate progress').lean(),
      Meeting.find(meetingFilter).limit(limit).select('_id title clientName date time status').lean(),
      !isClient
        ? User.find({
            $or: [{ name: regex }, { email: regex }, { role: regex }, { department: regex }, { skills: regex }],
          })
            .limit(limit)
            .select('_id name email role department avatar availability')
            .lean()
        : Promise.resolve([]),
    ]);

    const formattedProjects = projects.map((p: any) => ({
      id: p._id.toString(),
      title: p.name,
      subtitle: `Client: ${p.clientName} • Status: ${p.status}`,
      type: 'project',
      url: `/projects?projectId=${p._id.toString()}`,
    }));

    const formattedTasks = tasks.map((t: any) => ({
      id: t._id.toString(),
      title: t.title,
      subtitle: `Project: ${t.projectName} • ${t.status}`,
      type: 'task',
      url: `/tasks?taskId=${t._id.toString()}`,
    }));

    const formattedLeads = leads.map((l: any) => ({
      id: l._id.toString(),
      title: l.name,
      subtitle: `${l.company} • ${l.status} • $${(l.value || 0).toLocaleString()}`,
      type: 'lead',
      url: `/crm/leads`,
    }));

    const formattedClients = clients.map((c: any) => ({
      id: c._id.toString(),
      title: c.name,
      subtitle: `${c.company} (${c.email})`,
      type: 'client',
      url: `/crm/clients`,
    }));

    const formattedMilestones = milestones.map((m: any) => ({
      id: m._id.toString(),
      title: m.title,
      subtitle: `Project: ${m.projectName} • Due: ${m.dueDate}`,
      type: 'milestone',
      url: `/milestones?milestoneId=${m._id.toString()}`,
    }));

    const formattedMeetings = meetings.map((m: any) => ({
      id: m._id.toString(),
      title: m.title,
      subtitle: `Client: ${m.clientName} • ${m.date} at ${m.time}`,
      type: 'meeting',
      url: `/crm/meetings?meetingId=${m._id.toString()}`,
    }));

    const formattedTeam = team.map((u: any) => ({
      id: u._id.toString(),
      title: u.name,
      subtitle: `${u.role} (${u.department || 'Engineering'})`,
      type: 'team',
      avatar: u.avatar,
      url: `/team`,
    }));

    const total =
      formattedProjects.length +
      formattedTasks.length +
      formattedLeads.length +
      formattedClients.length +
      formattedMilestones.length +
      formattedMeetings.length +
      formattedTeam.length;

    res.status(200).json({
      query: rawQuery,
      total,
      results: {
        projects: formattedProjects,
        tasks: formattedTasks,
        leads: formattedLeads,
        clients: formattedClients,
        milestones: formattedMilestones,
        meetings: formattedMeetings,
        team: formattedTeam,
      },
    });
  }
);
