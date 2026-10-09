'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  ListTodo,
  Flag,
  Code2,
  Pencil,
  Trash2,
  CheckSquare,
  Square,
  X,
  AlertCircle,
  AlertTriangle,
  Building,
  Plus,
  User as UserIcon,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { aiApi, GeneratedTaskSpec } from '@/services/aiApi';
import { projectApi } from '@/services/projectApi';
import { Project, Milestone, Task, PriorityLevel } from '@/types';
import { classifySuggestion, ClassificationType, computeTechStackDiff } from '@/utils/duplicateDetector';
import { useAuth } from '@/context/AuthContext';
import { getAvatarUrl } from '@/lib/avatar';
import { MarkdownMessage } from '@/components/common/MarkdownMessage';

export interface GeneratedMilestoneItem {
  tempId: string;
  title: string;
  description: string;
  dueDate: string;
  suggestedTasks?: GeneratedTaskSpec[];
  classification: ClassificationType;
  matchedTitle?: string;
  selected: boolean;
  approved: boolean;
}

export interface GeneratedTaskItem {
  tempId: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  dueDate?: string;
  milestoneTitle?: string;
  milestoneId?: string;
  classification: ClassificationType;
  matchedTitle?: string;
  selected: boolean;
  approved: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  action?: string;
  taskId?: string;
  taskTitle?: string;
  suggestedSubtasks?: Array<{ id: string; title: string; completed?: boolean }>;
  subtasksConfirmed?: boolean;
  generatedItems?: {
    summary?: string;
    techStack?: string[];
    techStackStatus?: 'pending' | 'applied' | 'kept';
    appliedTechStack?: string[];
    milestones?: GeneratedMilestoneItem[];
    tasks?: GeneratedTaskItem[];
  };
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const isAuthorizedPM = !user || ['Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Project Coordinator'].includes(user.role);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Track existing milestones & tasks for duplicate classification
  const [existingMilestones, setExistingMilestones] = useState<Milestone[]>([]);
  const [existingTasks, setExistingTasks] = useState<Task[]>([]);

  // Creation feedback & error messages
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Modals State
  const [editingMilestone, setEditingMilestone] = useState<{ msgId: string; item: GeneratedMilestoneItem } | null>(null);
  const [editingTask, setEditingTask] = useState<{ msgId: string; item: GeneratedTaskItem } | null>(null);
  const [editingTechStack, setEditingTechStack] = useState<{
    msgId: string;
    stack: string[];
    newTechInput: string;
  } | null>(null);

  // Creating action loading states
  const [creatingMilestonesMsgId, setCreatingMilestonesMsgId] = useState<string | null>(null);
  const [creatingTasksMsgId, setCreatingTasksMsgId] = useState<string | null>(null);
  const [updatingTechStackMsgId, setUpdatingTechStackMsgId] = useState<string | null>(null);
  const [confirmingSubtasksMsgId, setConfirmingSubtasksMsgId] = useState<string | null>(null);

  // Input & Scroll Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatically refocus chat input when AI response completes or page loads
  useEffect(() => {
    if (!loading && !editingMilestone && !editingTask && !editingTechStack) {
      inputRef.current?.focus();
    }
  }, [loading, editingMilestone, editingTask, editingTechStack]);

  // Smoothly scroll message container to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Dynamic role-aware initial welcome message
  useEffect(() => {
    let initialText = 'Hello! I am your DevFlow AI Copilot. Select an action below to get started.';

    if (!user || ['Developer', 'Designer'].includes(user?.role || '')) {
      initialText = `Hello${user?.name ? ' ' + user.name : ''}! I am your Technical & Development Copilot. I can explain your assigned tasks, break down complex tasks into subtasks, clarify requirements, and provide programming guidance.`;
    } else if (user?.role === 'QA') {
      initialText = `Hello${user?.name ? ' ' + user.name : ''}! I am your QA & Testing AI Assistant. I can assist with test task breakdown, test scenario generation, acceptance criteria review, and QA workflow guidance.`;
    } else if (user?.role === 'Team Lead') {
      initialText = `Hello${user?.name ? ' ' + user.name : ''}! I am your Team Lead AI Copilot. I can assist with team workload analysis, task distribution recommendations, technical planning, and project progress tracking.`;
    } else if (['Super Admin', 'Admin'].includes(user?.role || '')) {
      initialText = `Hello${user?.name ? ' ' + user.name : ''}! I am your Admin AI Intelligence Assistant. I can provide organizational overviews, project health diagnostics, team workload insights, and system analytics.`;
    } else {
      initialText = `Hello${user?.name ? ' ' + user.name : ''}! I am your DevFlow AI Project Copilot. I can analyze project health, summarize meeting notes & generate tasks, suggest tech stacks, and recommend team allocations.`;
    }

    setMessages([
      {
        id: '1',
        sender: 'ai',
        text: initialText,
      },
    ]);
  }, [user?.role, user?.name]);

  // --- TECH STACK WORKFLOW HANDLERS ---
  const handleApplyTechStack = async (msgId: string, newStack: string[]) => {
    const targetProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
    if (!targetProject) {
      setNotification({ type: 'error', message: 'Please select a valid target project context first.' });
      return;
    }

    if (!isAuthorizedPM) {
      setNotification({
        type: 'error',
        message: 'Only Project Managers and Admins are authorized to update project tech stacks.',
      });
      return;
    }

    setUpdatingTechStackMsgId(msgId);
    setNotification(null);

    try {
      await projectApi.updateProject(targetProject.id, { techStack: newStack });

      // Update local projects list so it refreshes immediately everywhere
      setProjects((prev) =>
        prev.map((p) => (p.id === targetProject.id ? { ...p, techStack: newStack } : p))
      );

      // Update message state
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== msgId || !msg.generatedItems) return msg;
          return {
            ...msg,
            generatedItems: {
              ...msg.generatedItems,
              techStackStatus: 'applied',
              appliedTechStack: newStack,
            },
          };
        })
      );

      setNotification({
        type: 'success',
        message: 'Project tech stack updated successfully.',
      });
    } catch (err: any) {
      console.error('Failed to update project tech stack', err);
      const errorMsg =
        err.response?.data?.error || err.message || 'Failed to update project tech stack.';
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setUpdatingTechStackMsgId(null);
      setEditingTechStack(null);
    }
  };

  const handleKeepCurrentTechStack = (msgId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId || !msg.generatedItems) return msg;
        return {
          ...msg,
          generatedItems: {
            ...msg.generatedItems,
            techStackStatus: 'kept',
          },
        };
      })
    );
    setNotification({
      type: 'success',
      message: 'Project tech stack kept unchanged.',
    });
  };

  // Load projects list
  useEffect(() => {
    projectApi
      .getProjects()
      .then((data) => {
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to fetch projects context:', err));
  }, []);

  // Load existing milestones and tasks for current selected project
  const loadExistingProjectData = (projectId: string) => {
    if (!projectId) return;
    Promise.all([projectApi.getMilestones(projectId), projectApi.getTasks(projectId)])
      .then(([msList, taskList]) => {
        setExistingMilestones(msList);
        setExistingTasks(taskList);
      })
      .catch((err) => console.error('Failed to load project milestones/tasks:', err));
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadExistingProjectData(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleConfirmSubtasks = async (
    msgId: string,
    taskId: string,
    subtasks: Array<{ id: string; title: string; completed?: boolean }>
  ) => {
    if (!taskId || subtasks.length === 0) return;
    setConfirmingSubtasksMsgId(msgId);
    setNotification(null);

    try {
      await aiApi.confirmSubtasks(taskId, subtasks);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === msgId ? { ...msg, subtasksConfirmed: true } : msg))
      );
      setNotification({
        type: 'success',
        message: 'Task subtasks confirmed and saved to task document in MongoDB successfully.',
      });
      if (selectedProjectId) {
        loadExistingProjectData(selectedProjectId);
      }
    } catch (err: any) {
      console.error('Failed to confirm subtasks:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to confirm subtasks.';
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setConfirmingSubtasksMsgId(null);
    }
  };

  const handleSendPrompt = async (textToSend: string, actionToSend?: string, taskIdToSend?: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const targetTaskId = taskIdToSend || selectedTaskId;
      const historyPayload = messages.slice(-10).map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));
      const res = await aiApi.askAssistant(
        textToSend,
        selectedProjectId || undefined,
        actionToSend,
        targetTaskId || undefined,
        historyPayload
      );

      // Fetch fresh project context items for accurate duplicate classification
      let currentMilestones = existingMilestones;
      let currentTasks = existingTasks;
      if (selectedProjectId) {
        try {
          const [msList, taskList] = await Promise.all([
            projectApi.getMilestones(selectedProjectId),
            projectApi.getTasks(selectedProjectId),
          ]);
          currentMilestones = msList;
          currentTasks = taskList;
          setExistingMilestones(msList);
          setExistingTasks(taskList);
        } catch (_) {}
      }

      // Classify raw generated milestones against existing project data
      const mappedMilestones: GeneratedMilestoneItem[] =
        res.generatedItems?.milestones?.map((m, idx) => {
          const classResult = classifySuggestion(m.title, currentMilestones);
          return {
            tempId: `ms-${Date.now()}-${idx}`,
            title: m.title,
            description: m.description || '',
            dueDate: m.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            suggestedTasks: m.suggestedTasks || [],
            classification: classResult.classification,
            matchedTitle: classResult.matchedTitle,
            selected: classResult.classification === 'NEW',
            approved: false,
          };
        }) || [];

      // Classify raw generated tasks against existing project data
      const mappedTasks: GeneratedTaskItem[] =
        res.generatedItems?.tasks?.map((t, idx) => {
          const classResult = classifySuggestion(t.title, currentTasks);
          return {
            tempId: `tsk-${Date.now()}-${idx}`,
            title: t.title,
            description: t.description || '',
            priority: (t.priority as PriorityLevel) || 'Medium',
            dueDate: t.dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
            milestoneTitle: t.milestoneTitle || '',
            classification: classResult.classification,
            matchedTitle: classResult.matchedTitle,
            selected: classResult.classification === 'NEW',
            approved: false,
          };
        }) || [];

      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer,
        action: res.action,
        taskId: res.taskId,
        taskTitle: res.taskTitle,
        suggestedSubtasks: res.suggestedSubtasks,
        subtasksConfirmed: false,
        generatedItems: {
          summary: res.generatedItems?.summary,
          techStack: res.generatedItems?.techStack,
          milestones: mappedMilestones,
          tasks: mappedTasks,
        },
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      const rawMsg = err.response?.data?.data?.answer || err.response?.data?.message || err.response?.data?.error || err.message || 'Sorry, I encountered an issue analyzing your request. Please ensure the backend server is active and try again.';
      const formattedMsg = rawMsg.startsWith('⚠️') ? rawMsg : `⚠️ **Gemini API / System Error**\n\n${rawMsg}`;
      const errorReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: formattedMsg,
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(input);
  };

  // --- MILESTONE INTERACTION HANDLERS ---
  const handleToggleMilestoneSelect = (msgId: string, tempId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId || !msg.generatedItems?.milestones) return msg;
        const updatedMs = msg.generatedItems.milestones.map((ms) =>
          ms.tempId === tempId && ms.classification !== 'EXISTS' ? { ...ms, selected: !ms.selected } : ms
        );
        return { ...msg, generatedItems: { ...msg.generatedItems, milestones: updatedMs } };
      })
    );
  };

  const handleRemoveMilestone = (msgId: string, tempId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId || !msg.generatedItems?.milestones) return msg;
        const updatedMs = msg.generatedItems.milestones.filter((ms) => ms.tempId !== tempId);
        return { ...msg, generatedItems: { ...msg.generatedItems, milestones: updatedMs } };
      })
    );
  };

  const handleSaveEditedMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;

    const { msgId, item } = editingMilestone;
    // Re-evaluate classification after manual editing
    const reClassified = classifySuggestion(item.title, existingMilestones);
    const updatedItem: GeneratedMilestoneItem = {
      ...item,
      classification: reClassified.classification,
      matchedTitle: reClassified.matchedTitle,
      selected: reClassified.classification === 'NEW' || item.selected,
    };

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId || !msg.generatedItems?.milestones) return msg;
        const updatedMs = msg.generatedItems.milestones.map((ms) =>
          ms.tempId === item.tempId ? updatedItem : ms
        );
        return { ...msg, generatedItems: { ...msg.generatedItems, milestones: updatedMs } };
      })
    );
    setEditingMilestone(null);
  };

  const handleApproveCreateMilestones = async (msgId: string, milestones: GeneratedMilestoneItem[]) => {
    const toCreate = milestones.filter((ms) => ms.selected && ms.classification !== 'EXISTS' && !ms.approved);
    if (toCreate.length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one new or approved similar milestone to create.' });
      return;
    }

    const targetProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
    if (!targetProject) {
      setNotification({ type: 'error', message: 'Please select a valid target project context first.' });
      return;
    }

    setCreatingMilestonesMsgId(msgId);
    setNotification(null);

    try {
      const currentMsg = messages.find((m) => m.id === msgId);
      const generatedTasksInMsg = currentMsg?.generatedItems?.tasks || [];
      const approvedTaskTempIds = new Set<string>();

      let createdCount = 0;
      for (const ms of toCreate) {
        // Collect relevant tasks for this milestone
        const relevantTasks = (ms.suggestedTasks && ms.suggestedTasks.length > 0)
          ? ms.suggestedTasks
          : generatedTasksInMsg.filter(
              (t) => t.milestoneTitle && t.milestoneTitle.toLowerCase() === ms.title.toLowerCase()
            );

        await projectApi.createMilestone({
          projectId: targetProject.id,
          projectName: targetProject.name,
          title: ms.title,
          description: ms.description,
          dueDate: ms.dueDate,
          status: 'Upcoming',
          initialTasks: relevantTasks.map((t) => ({
            title: t.title,
            description: t.description,
            priority: t.priority,
            dueDate: t.dueDate,
          })),
        });
        createdCount++;

        // Track associated task temp IDs
        generatedTasksInMsg.forEach((t) => {
          if (t.milestoneTitle && t.milestoneTitle.toLowerCase() === ms.title.toLowerCase()) {
            approvedTaskTempIds.add(t.tempId);
          }
        });
      }

      // Mark milestone & associated tasks as approved in state
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== msgId || !msg.generatedItems) return msg;
          const updatedMs = (msg.generatedItems.milestones || []).map((ms) =>
            toCreate.some((tc) => tc.tempId === ms.tempId) ? { ...ms, approved: true } : ms
          );
          const updatedTasks = (msg.generatedItems.tasks || []).map((t) =>
            approvedTaskTempIds.has(t.tempId) ? { ...t, approved: true } : t
          );
          return {
            ...msg,
            generatedItems: {
              ...msg.generatedItems,
              milestones: updatedMs,
              tasks: updatedTasks,
            },
          };
        })
      );

      // Refresh existing milestones and tasks list
      await loadExistingProjectData(targetProject.id);

      setNotification({
        type: 'success',
        message: `${createdCount} milestone${createdCount > 1 ? 's' : ''} with associated tasks created successfully in project "${targetProject.name}".`,
      });
    } catch (err: any) {
      console.error('Failed to create milestones', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create milestones. Please check your connection.';
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setCreatingMilestonesMsgId(null);
    }
  };

  // --- TASK INTERACTION HANDLERS ---
  const handleToggleTaskSelect = (msgId: string, tempId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId || !msg.generatedItems?.tasks) return msg;
        const updatedTasks = msg.generatedItems.tasks.map((t) =>
          t.tempId === tempId && t.classification !== 'EXISTS' ? { ...t, selected: !t.selected } : t
        );
        return { ...msg, generatedItems: { ...msg.generatedItems, tasks: updatedTasks } };
      })
    );
  };

  const handleRemoveTask = (msgId: string, tempId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId || !msg.generatedItems?.tasks) return msg;
        const updatedTasks = msg.generatedItems.tasks.filter((t) => t.tempId !== tempId);
        return { ...msg, generatedItems: { ...msg.generatedItems, tasks: updatedTasks } };
      })
    );
  };

  const handleSaveEditedTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const { msgId, item } = editingTask;
    // Re-evaluate classification after manual editing
    const reClassified = classifySuggestion(item.title, existingTasks);
    const updatedItem: GeneratedTaskItem = {
      ...item,
      classification: reClassified.classification,
      matchedTitle: reClassified.matchedTitle,
      selected: reClassified.classification === 'NEW' || item.selected,
    };

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId || !msg.generatedItems?.tasks) return msg;
        const updatedTasks = msg.generatedItems.tasks.map((t) =>
          t.tempId === item.tempId ? updatedItem : t
        );
        return { ...msg, generatedItems: { ...msg.generatedItems, tasks: updatedTasks } };
      })
    );
    setEditingTask(null);
  };

  const handleApproveCreateTasks = async (msgId: string, tasks: GeneratedTaskItem[]) => {
    const toCreate = tasks.filter((t) => t.selected && t.classification !== 'EXISTS' && !t.approved);
    if (toCreate.length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one new or approved similar task to create.' });
      return;
    }

    const targetProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
    if (!targetProject) {
      setNotification({ type: 'error', message: 'Please select a valid target project context first.' });
      return;
    }

    setCreatingTasksMsgId(msgId);
    setNotification(null);

    try {
      let createdCount = 0;
      const targetMilestones = await projectApi.getMilestones(targetProject.id);
      const defaultMilestoneId = targetMilestones.length > 0 ? targetMilestones[0].id : undefined;

      for (const t of toCreate) {
        let taskMilestoneId = defaultMilestoneId;
        if (t.milestoneTitle) {
          const matchedMs = targetMilestones.find(
            (m) => m.title.toLowerCase() === t.milestoneTitle!.toLowerCase()
          );
          if (matchedMs) {
            taskMilestoneId = matchedMs.id;
          }
        }

        await projectApi.createTask({
          projectId: targetProject.id,
          projectName: targetProject.name,
          title: t.title,
          description: t.description,
          priority: t.priority,
          dueDate: t.dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          status: 'Todo',
          milestoneId: taskMilestoneId,
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
        });
        createdCount++;
      }

      // Mark as approved in state
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== msgId || !msg.generatedItems?.tasks) return msg;
          const updatedTasks = msg.generatedItems.tasks.map((t) =>
            toCreate.some((tc) => tc.tempId === t.tempId) ? { ...t, approved: true } : t
          );
          return { ...msg, generatedItems: { ...msg.generatedItems, tasks: updatedTasks } };
        })
      );

      // Refresh existing tasks list
      await loadExistingProjectData(targetProject.id);

      setNotification({
        type: 'success',
        message: `${createdCount} task${createdCount > 1 ? 's' : ''} created successfully in project "${targetProject.name}".`,
      });
    } catch (err: any) {
      console.error('Failed to create tasks', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create tasks. Please check your connection.';
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setCreatingTasksMsgId(null);
    }
  };

  const selectedProjectObj = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 flex flex-col h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-8rem)] min-h-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 sm:size-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Bot className="size-5 sm:size-6 text-purple-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 truncate">
                <span>AI Project Copilot Assistant</span>
                <Sparkles className="size-3.5 sm:size-4 text-purple-400 animate-pulse shrink-0" />
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">Context-aware AI for software requirement analysis & duplicate-safe task creation.</p>
            </div>
          </div>

          {/* Context Selectors */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Task Selector for Developer / QA / Team Lead */}
            {(!user || ['Developer', 'Designer', 'QA', 'Team Lead'].includes(user?.role || '')) && existingTasks.length > 0 && (
              <div className="flex items-center gap-2 w-full xs:w-auto">
                <span className="text-xs text-slate-400 font-medium shrink-0">Target Task:</span>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="h-9 px-3 text-xs bg-[#0b0f19] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 w-full xs:max-w-[180px] sm:max-w-[200px] truncate"
                >
                  <option value="">-- All Assigned Tasks --</option>
                  {existingTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.priority})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Project Context Selector */}
            <div className="flex items-center gap-2 w-full xs:w-auto">
              <span className="text-xs text-slate-400 font-medium shrink-0">Target Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-9 px-3 text-xs bg-[#0b0f19] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 w-full xs:w-auto font-medium"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="size-4 text-rose-400 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none sm:flex-wrap sm:pb-0 shrink-0">
          {(!user || ['Developer', 'Designer'].includes(user?.role || '')) && (
            <>
              <button
                onClick={() => handleSendPrompt('Explain my assigned tasks, deadlines and priorities', 'explain_my_tasks')}
                className="px-3 py-1.5 rounded-lg text-xs bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Sparkles className="size-3 text-purple-400" />
                <span>Explain My Tasks</span>
              </button>
              <button
                onClick={() => handleSendPrompt('Break down my task into actionable subtasks', 'breakdown_task', selectedTaskId)}
                className="px-3 py-1.5 rounded-lg text-xs bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <ListTodo className="size-3 text-sky-400" />
                <span>Break Down Task</span>
              </button>
              <button
                onClick={() => handleSendPrompt('Provide technical assistance and architectural guidance', 'technical_assistant')}
                className="px-3 py-1.5 rounded-lg text-xs bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Code2 className="size-3 text-emerald-400" />
                <span>Technical Assistant</span>
              </button>
              <button
                onClick={() => handleSendPrompt('Provide step-by-step debugging strategies', 'debugging_assistance')}
                className="px-3 py-1.5 rounded-lg text-xs bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <AlertTriangle className="size-3 text-amber-400" />
                <span>Debugging Assistance</span>
              </button>
            </>
          )}

          {user?.role === 'QA' && (
            <>
              <button
                onClick={() => handleSendPrompt('Explain test tasks and bug reports', 'explain_my_tasks')}
                className="px-3 py-1.5 rounded-lg text-xs bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Sparkles className="size-3 text-purple-400" />
                <span>Explain Test Tasks</span>
              </button>
              <button
                onClick={() => handleSendPrompt('Break down user story into test scenarios', 'breakdown_test_cases')}
                className="px-3 py-1.5 rounded-lg text-xs bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <ListTodo className="size-3 text-sky-400" />
                <span>Break Down Test Cases</span>
              </button>
              <button
                onClick={() => handleSendPrompt('Review acceptance criteria for current deliverables', 'requirement_clarification')}
                className="px-3 py-1.5 rounded-lg text-xs bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <CheckCircle2 className="size-3 text-emerald-400" />
                <span>Acceptance Criteria Review</span>
              </button>
            </>
          )}

          {user?.role === 'Team Lead' && (
            <>
              <button
                onClick={() => handleSendPrompt('Analyze team workload and capacity', 'team_workload_analysis')}
                className="px-3 py-1.5 rounded-lg text-xs bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Sparkles className="size-3 text-purple-400" />
                <span>Team Workload Analysis</span>
              </button>
              <button
                onClick={() => handleSendPrompt('Recommend task distribution across team members', 'task_distribution')}
                className="px-3 py-1.5 rounded-lg text-xs bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <ListTodo className="size-3 text-sky-400" />
                <span>Task Distribution Recommendations</span>
              </button>
              <button
                onClick={() => handleSendPrompt('Break down task into actionable subtasks', 'breakdown_task', selectedTaskId)}
                className="px-3 py-1.5 rounded-lg text-xs bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Code2 className="size-3 text-emerald-400" />
                <span>Task Breakdown</span>
              </button>
            </>
          )}

          {user && ['Project Manager', 'Project Coordinator'].includes(user.role) && (
            <>
              <button
                onClick={() => handleSendPrompt('Analyze overall company project health and risks', 'project_health')}
                className="px-3 py-1.5 rounded-lg text-xs bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Sparkles className="size-3 text-purple-400" />
                <span>Analyze Project Health</span>
              </button>
              <button
                onClick={() => handleSendPrompt('Summarize recent meeting notes and generate sprint tasks', 'summarize_meetings')}
                className="px-3 py-1.5 rounded-lg text-xs bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <ListTodo className="size-3 text-sky-400" />
                <span>Summarize Meeting & Generate Tasks</span>
              </button>
              <button
                onClick={() => handleSendPrompt('Suggest optimal tech stack for project architecture', 'suggest_tech_stack')}
                className="px-3 py-1.5 rounded-lg text-xs bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Code2 className="size-3 text-emerald-400" />
                <span>Suggest Tech Stack</span>
              </button>
            </>
          )}

          {user && ['Super Admin', 'Admin'].includes(user.role) && (
            <>
              <button
                onClick={() => handleSendPrompt('Analyze overall company project health and risks', 'project_health')}
                className="px-3 py-1.5 rounded-lg text-xs bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Sparkles className="size-3 text-purple-400" />
                <span>Analyze Project Health</span>
              </button>
              <button
                onClick={() => handleSendPrompt('Analyze organization team workload and capacity', 'team_workload_analysis')}
                className="px-3 py-1.5 rounded-lg text-xs bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <ListTodo className="size-3 text-sky-400" />
                <span>Team Workload Insights</span>
              </button>
              <button
                onClick={() => handleSendPrompt('Summarize meeting notes and generate sprint tasks', 'summarize_meetings')}
                className="px-3 py-1.5 rounded-lg text-xs bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Code2 className="size-3 text-emerald-400" />
                <span>Summarize Meeting & Tasks</span>
              </button>
            </>
          )}
        </div>

        {/* Chat Messages Panel */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-4 rounded-2xl bg-[#0b0f19] border border-slate-800">
          {messages.map((m) => {
            const milestonesList = m.generatedItems?.milestones || [];
            const tasksList = m.generatedItems?.tasks || [];

            const validMilestonesToCreate = milestonesList.filter(
              (ms) => ms.selected && ms.classification !== 'EXISTS' && !ms.approved
            );
            const validTasksToCreate = tasksList.filter(
              (t) => t.selected && t.classification !== 'EXISTS' && !t.approved
            );

            const isUser = m.sender === 'user';

            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 devflow-ai-message ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {/* Sender Badge / Identity Indicator */}
                {isUser ? (
                  <div
                    className="size-8 rounded-full bg-gradient-to-br from-cyan-950/90 via-slate-900 to-blue-950/90 border border-cyan-400/40 text-cyan-300 font-extrabold text-[10px] tracking-wider flex items-center justify-center shrink-0 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/20 select-none overflow-hidden"
                    title={user?.name || 'You'}
                  >
                    <img src={getAvatarUrl(user?.avatar, user)} alt={user?.name || 'You'} className="size-full object-cover rounded-full" />
                  </div>
                ) : (
                  <div className="size-8 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-md shadow-purple-950/40">
                    <Bot className="size-4 text-purple-400" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={
                    isUser
                      ? 'px-4.5 py-3 sm:px-5 sm:py-3.5 rounded-2xl rounded-tr-xs bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 text-white font-normal text-xs sm:text-[13px] leading-relaxed shadow-md shadow-sky-950/30 border border-cyan-300/30 hover:border-cyan-200/50 transition-all duration-200 select-text max-w-[85%] sm:max-w-xl md:max-w-2xl break-words whitespace-pre-wrap'
                      : 'p-4 sm:p-5 rounded-2xl rounded-tl-xs bg-[#060913] text-slate-200 border border-slate-800 text-xs sm:text-[13px] leading-relaxed max-w-2xl w-full'
                  }
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  ) : (
                    <MarkdownMessage content={m.text} />
                  )}

                  {/* AI GENERATED SUBTASKS CONFIRMATION PANEL */}
                  {m.suggestedSubtasks && m.suggestedSubtasks.length > 0 && m.taskId && (
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-sky-500/30 space-y-3.5 shadow-inner mt-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <ListTodo className="size-4 text-sky-400" />
                          <span className="font-bold text-xs text-sky-300">
                            Proposed Task Breakdown: {m.taskTitle || 'Target Task'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Requires Explicit Confirmation
                        </span>
                      </div>

                      <div className="space-y-2">
                        {m.suggestedSubtasks.map((st, idx) => (
                          <div key={st.id || idx} className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 text-xs">
                            <CheckSquare className="size-4 text-sky-400 shrink-0" />
                            <span className="text-slate-200">{st.title}</span>
                          </div>
                        ))}
                      </div>

                      {m.subtasksConfirmed ? (
                        <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                          <span>Subtasks confirmed and persisted to backend task document!</span>
                        </div>
                      ) : (
                        <div className="pt-2 flex justify-end">
                          <Button
                            size="sm"
                            disabled={confirmingSubtasksMsgId === m.id}
                            onClick={() => handleConfirmSubtasks(m.id, m.taskId!, m.suggestedSubtasks!)}
                            className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5"
                          >
                            {confirmingSubtasksMsgId === m.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-3.5" />
                            )}
                            <span>Confirm & Save Subtasks to Task</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Generated Artifacts / Task Cards */}
                  {m.generatedItems && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-4">
                      {/* Summary */}
                      {m.generatedItems.summary && (
                        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-purple-200">
                          <span className="font-bold block text-[11px] mb-1">Executive AI Summary:</span>
                          <p className="text-[11px] text-slate-300 leading-normal">{m.generatedItems.summary}</p>
                        </div>
                      )}

                      {/* AI TECH STACK RECOMMENDATION & REVIEW WORKFLOW PANEL */}
                      {m.generatedItems.techStack && m.generatedItems.techStack.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-3.5 shadow-inner">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                              <Code2 className="size-4 text-emerald-400" />
                              <span className="font-bold text-xs text-emerald-300">
                                AI Tech Stack Recommendation & Review Workflow
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Building className="size-3 text-slate-500" />
                              Target Project: <strong className="text-slate-200">{selectedProjectObj?.name || 'Selected Project'}</strong>
                            </span>
                          </div>

                          {/* Existing Stack vs AI Recommended Stack Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Existing Stack */}
                            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-slate-300">Existing Project Tech Stack:</span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {selectedProjectObj?.techStack?.length || 0} items
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
                                {selectedProjectObj?.techStack && selectedProjectObj.techStack.length > 0 ? (
                                  selectedProjectObj.techStack.map((tech, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono"
                                    >
                                      {tech}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-500 italic">No existing tech stack set</span>
                                )}
                              </div>
                            </div>

                            {/* AI Recommended Stack */}
                            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                                  <Sparkles className="size-3 text-emerald-400" />
                                  AI Recommended Stack:
                                </span>
                                <span className="text-[10px] text-emerald-400 font-mono">
                                  {m.generatedItems.techStack.length} items
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
                                {m.generatedItems.techStack.map((tech, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Differences Breakdown */}
                          {(() => {
                            const diff = computeTechStackDiff(
                              selectedProjectObj?.techStack || [],
                              m.generatedItems.techStack
                            );
                            return (
                              <div className="p-3 rounded-lg bg-[#060913] border border-slate-800 space-y-2 text-xs">
                                <div className="font-semibold text-[11px] text-slate-300 border-b border-slate-800/60 pb-1 flex items-center justify-between">
                                  <span>Stack Differences Analysis</span>
                                  {diff.additions.length === 0 && diff.removals.length === 0 && (
                                    <span className="text-[10px] text-emerald-400 font-medium">✓ Stacks match exactly</span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                  {/* Recommended Additions */}
                                  {diff.additions.length > 0 ? (
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                        <span className="size-2 rounded-full bg-emerald-400 inline-block"></span>
                                        Recommended additions ({diff.additions.length}):
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {diff.additions.map((t, idx) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-medium"
                                          >
                                            + {t}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-500">No new additions recommended</div>
                                  )}

                                  {/* Proposed Removals */}
                                  {diff.removals.length > 0 ? (
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                                        <span className="size-2 rounded-full bg-rose-400 inline-block"></span>
                                        Proposed removals ({diff.removals.length}):
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {diff.removals.map((t, idx) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-medium"
                                          >
                                            - {t} (Removal)
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-500">No technology removals proposed</div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* PM Review Actions & Status */}
                          {m.generatedItems.techStackStatus === 'applied' ? (
                            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                              <span>
                                Project tech stack updated successfully & applied to <strong>{selectedProjectObj?.name}</strong>.
                              </span>
                            </div>
                          ) : m.generatedItems.techStackStatus === 'kept' ? (
                            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-slate-400 shrink-0" />
                                <span>
                                  Project tech stack kept current for <strong>{selectedProjectObj?.name}</strong>.
                                </span>
                              </div>
                              <button
                                onClick={() => handleApplyTechStack(m.id, m.generatedItems!.techStack!)}
                                className="text-[10px] text-emerald-400 hover:underline font-medium"
                              >
                                Re-evaluate / Apply AI Stack
                              </button>
                            </div>
                          ) : (
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
                              <span className="text-[11px] text-slate-400 font-medium">
                                Authorized PM Action:
                              </span>
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Keep Current Stack */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleKeepCurrentTechStack(m.id)}
                                  className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700"
                                >
                                  Keep Current Stack
                                </Button>

                                {/* Edit & Apply */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setEditingTechStack({
                                      msgId: m.id,
                                      stack: [...(m.generatedItems?.techStack || selectedProjectObj?.techStack || [])],
                                      newTechInput: '',
                                    })
                                  }
                                  className="text-xs text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 flex items-center gap-1.5"
                                >
                                  <Pencil className="size-3.5" />
                                  <span>Edit & Apply</span>
                                </Button>

                                {/* Apply AI Recommendation */}
                                <Button
                                  size="sm"
                                  disabled={updatingTechStackMsgId === m.id}
                                  onClick={() => handleApplyTechStack(m.id, m.generatedItems!.techStack!)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                                >
                                  {updatingTechStackMsgId === m.id ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="size-3.5" />
                                  )}
                                  <span>Apply AI Recommendation</span>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* GENERATED MILESTONES REVIEW & APPROVAL PANEL */}
                      {milestonesList.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-sky-500/30 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="font-bold text-xs text-sky-400 flex items-center gap-1.5">
                              <Flag className="size-4 text-sky-400" />
                              <span>Generated Milestones ({milestonesList.length}):</span>
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Building className="size-3 text-slate-500" />
                              Target: <strong className="text-slate-200">{selectedProjectObj?.name || 'Selected Project'}</strong>
                            </span>
                          </div>

                          <div className="space-y-2">
                            {milestonesList.map((ms) => {
                              const isExists = ms.classification === 'EXISTS';
                              const isSimilar = ms.classification === 'SIMILAR';

                              return (
                                <div
                                  key={ms.tempId}
                                  className={`p-3 rounded-lg border transition-all ${
                                    ms.approved
                                      ? 'bg-emerald-950/20 border-emerald-500/40 opacity-90'
                                      : isExists
                                      ? 'bg-slate-950/80 border-slate-800 opacity-75'
                                      : isSimilar
                                      ? 'bg-amber-950/20 border-amber-500/40'
                                      : ms.selected
                                      ? 'bg-slate-900 border-slate-700'
                                      : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2.5">
                                      {/* Selection Checkbox */}
                                      <button
                                        type="button"
                                        disabled={ms.approved || isExists}
                                        onClick={() => handleToggleMilestoneSelect(m.id, ms.tempId)}
                                        className="mt-0.5 text-slate-400 hover:text-sky-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                        title={
                                          isExists
                                            ? 'Already exists in project'
                                            : isSimilar
                                            ? 'Approve Similar / Create Anyway'
                                            : 'Select milestone'
                                        }
                                      >
                                        {ms.approved ? (
                                          <CheckCircle2 className="size-4 text-emerald-400" />
                                        ) : ms.selected ? (
                                          <CheckSquare className="size-4 text-sky-400" />
                                        ) : (
                                          <Square className="size-4 text-slate-600" />
                                        )}
                                      </button>

                                      <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h4 className="font-semibold text-slate-100 text-xs">{ms.title}</h4>

                                          {/* CLASSIFICATION BADGES */}
                                          {ms.approved ? (
                                            <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                                              <CheckCircle2 className="size-3 text-emerald-400" />
                                              Approved & Created
                                            </span>
                                          ) : isExists ? (
                                            <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                                              <CheckCircle2 className="size-3 text-emerald-400" />
                                              ALREADY EXISTS
                                            </span>
                                          ) : isSimilar ? (
                                            <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                                              <AlertTriangle className="size-3 text-amber-400" />
                                              SIMILAR
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded text-[9px] bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                                              NEW
                                            </span>
                                          )}
                                        </div>

                                        {/* Matching item details */}
                                        {isExists && ms.matchedTitle && (
                                          <div className="text-[10px] text-emerald-400 font-medium">
                                            ✓ Already exists in this project: &quot;{ms.matchedTitle}&quot;
                                          </div>
                                        )}
                                        {isSimilar && ms.matchedTitle && (
                                          <div className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                                            <span>⚠ Similar to: &quot;{ms.matchedTitle}&quot;</span>
                                            {!ms.selected && (
                                              <span className="text-slate-400 text-[9px]">(Check box to Approve Similar)</span>
                                            )}
                                          </div>
                                        )}

                                        {ms.description && <p className="text-[11px] text-slate-400">{ms.description}</p>}
                                        <div className="text-[10px] text-sky-300 pt-0.5">
                                          Target Due Date: {ms.dueDate}
                                        </div>

                                        {/* Associated Tasks Preview for this Milestone */}
                                        {tasksList.filter((t) => t.milestoneTitle && t.milestoneTitle.toLowerCase() === ms.title.toLowerCase()).length > 0 && (
                                          <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                                            <div className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                                              <CheckSquare className="size-3 text-purple-400" />
                                              <span>Associated Actionable Tasks ({tasksList.filter((t) => t.milestoneTitle && t.milestoneTitle.toLowerCase() === ms.title.toLowerCase()).length}):</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                                              {tasksList
                                                .filter((t) => t.milestoneTitle && t.milestoneTitle.toLowerCase() === ms.title.toLowerCase())
                                                .map((assocTask) => (
                                                  <div key={assocTask.tempId} className="p-1.5 rounded bg-slate-900/80 border border-slate-800 text-[10px]">
                                                    <div className="font-medium text-slate-200 truncate">{assocTask.title}</div>
                                                    <div className="flex items-center justify-between text-[9px] text-slate-400 mt-0.5">
                                                      <span>Priority: <strong className="text-slate-300">{assocTask.priority}</strong></span>
                                                      <span>Due: {assocTask.dueDate}</span>
                                                    </div>
                                                  </div>
                                                ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Edit & Remove Options */}
                                    {!ms.approved && !isExists && (
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          onClick={() => setEditingMilestone({ msgId: m.id, item: { ...ms } })}
                                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                          title="Edit Milestone"
                                        >
                                          <Pencil className="size-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleRemoveMilestone(m.id, ms.tempId)}
                                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                          title="Remove Milestone"
                                        >
                                          <Trash2 className="size-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Approve & Create Milestones Action */}
                          <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                            <span className="text-[11px] text-slate-400">
                              {validMilestonesToCreate.length} new milestone(s) selected for creation
                            </span>
                            <Button
                              size="sm"
                              disabled={creatingMilestonesMsgId === m.id || validMilestonesToCreate.length === 0}
                              onClick={() => handleApproveCreateMilestones(m.id, milestonesList)}
                              className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20 disabled:opacity-50"
                            >
                              {creatingMilestonesMsgId === m.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="size-3.5" />
                              )}
                              <span>
                                {validMilestonesToCreate.length > 0
                                  ? `Approve & Create Milestones (${validMilestonesToCreate.length})`
                                  : 'No New Milestones Selected'}
                              </span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* EXTRACTED SPRINT TASKS REVIEW & APPROVAL PANEL */}
                      {tasksList.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-purple-500/30 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                              <ListTodo className="size-4 text-purple-400" />
                              <span>Extracted Sprint Tasks ({tasksList.length}):</span>
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Building className="size-3 text-slate-500" />
                              Target: <strong className="text-slate-200">{selectedProjectObj?.name || 'Selected Project'}</strong>
                            </span>
                          </div>

                          <div className="space-y-2">
                            {tasksList.map((t) => {
                              const isExists = t.classification === 'EXISTS';
                              const isSimilar = t.classification === 'SIMILAR';

                              return (
                                <div
                                  key={t.tempId}
                                  className={`p-3 rounded-lg border transition-all ${
                                    t.approved
                                      ? 'bg-emerald-950/20 border-emerald-500/40 opacity-90'
                                      : isExists
                                      ? 'bg-slate-950/80 border-slate-800 opacity-75'
                                      : isSimilar
                                      ? 'bg-amber-950/20 border-amber-500/40'
                                      : t.selected
                                      ? 'bg-slate-900 border-slate-700'
                                      : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2.5">
                                      {/* Selection Checkbox */}
                                      <button
                                        type="button"
                                        disabled={t.approved || isExists}
                                        onClick={() => handleToggleTaskSelect(m.id, t.tempId)}
                                        className="mt-0.5 text-slate-400 hover:text-purple-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                        title={
                                          isExists
                                            ? 'Already exists in project'
                                            : isSimilar
                                            ? 'Approve Similar / Create Anyway'
                                            : 'Select task'
                                        }
                                      >
                                        {t.approved ? (
                                          <CheckCircle2 className="size-4 text-emerald-400" />
                                        ) : t.selected ? (
                                          <CheckSquare className="size-4 text-purple-400" />
                                        ) : (
                                          <Square className="size-4 text-slate-600" />
                                        )}
                                      </button>

                                      <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h4 className="font-semibold text-slate-100 text-xs">{t.title}</h4>
                                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">
                                            {t.priority} Priority
                                          </span>
                                          {t.milestoneTitle && (
                                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-sky-500/10 text-sky-300 font-semibold border border-sky-500/20 flex items-center gap-1">
                                              <Flag className="size-2.5 text-sky-400" />
                                              <span>Milestone: {t.milestoneTitle}</span>
                                            </span>
                                          )}

                                          {/* CLASSIFICATION BADGES */}
                                          {t.approved ? (
                                            <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                                              <CheckCircle2 className="size-3 text-emerald-400" />
                                              Approved & Created
                                            </span>
                                          ) : isExists ? (
                                            <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                                              <CheckCircle2 className="size-3 text-emerald-400" />
                                              ALREADY EXISTS
                                            </span>
                                          ) : isSimilar ? (
                                            <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                                              <AlertTriangle className="size-3 text-amber-400" />
                                              SIMILAR
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                              NEW
                                            </span>
                                          )}
                                        </div>

                                        {/* Matching item details */}
                                        {isExists && t.matchedTitle && (
                                          <div className="text-[10px] text-emerald-400 font-medium">
                                            ✓ Already exists in this project: &quot;{t.matchedTitle}&quot;
                                          </div>
                                        )}
                                        {isSimilar && t.matchedTitle && (
                                          <div className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                                            <span>⚠ Similar to: &quot;{t.matchedTitle}&quot;</span>
                                            {!t.selected && (
                                              <span className="text-slate-400 text-[9px]">(Check box to Approve Similar)</span>
                                            )}
                                          </div>
                                        )}

                                        {t.description && <p className="text-[11px] text-slate-400">{t.description}</p>}
                                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-purple-300 pt-0.5">
                                          {t.dueDate && <span>Due Date / Est: {t.dueDate}</span>}
                                          <span>• Associated Milestone: {milestonesList[0]?.title || 'Phase 1: Architecture & Auth Setup'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Edit & Remove Options */}
                                    {!t.approved && !isExists && (
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          onClick={() => setEditingTask({ msgId: m.id, item: { ...t } })}
                                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                          title="Edit Task"
                                        >
                                          <Pencil className="size-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleRemoveTask(m.id, t.tempId)}
                                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                          title="Remove Task"
                                        >
                                          <Trash2 className="size-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Approve & Create Tasks Action */}
                          <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                            <span className="text-[11px] text-slate-400">
                              {validTasksToCreate.length} new task(s) selected for creation
                            </span>
                            <Button
                              size="sm"
                              disabled={creatingTasksMsgId === m.id || validTasksToCreate.length === 0}
                              onClick={() => handleApproveCreateTasks(m.id, tasksList)}
                              className="bg-purple-600 hover:bg-purple-500 text-white text-xs gap-1.5 shadow-md shadow-purple-600/20 disabled:opacity-50"
                            >
                              {creatingTasksMsgId === m.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="size-3.5" />
                              )}
                              <span>
                                {validTasksToCreate.length > 0
                                  ? `Approve & Create Tasks (${validTasksToCreate.length})`
                                  : 'No New Tasks Selected'}
                              </span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-purple-300 p-2 devflow-ai-message">
              <Bot className="size-5 text-purple-400" />
              <div className="flex items-center gap-2.5 bg-[#060913] px-4 py-2.5 rounded-xl border border-slate-800/90 shadow-sm">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="size-2 rounded-full bg-purple-400 devflow-dot-1 inline-block" />
                  <span className="size-2 rounded-full bg-purple-400 devflow-dot-2 inline-block" />
                  <span className="size-2 rounded-full bg-purple-400 devflow-dot-3 inline-block" />
                </div>
                <span>AI Copilot is analyzing repository data & requirements...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3 sticky bottom-0 bg-[#060913]/95 backdrop-blur-md pt-2 pb-1 shrink-0">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask AI Copilot to summarize projects, generate tasks, or check workload..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 h-11 sm:h-12 px-3.5 sm:px-4 text-xs bg-[#0b0f19] border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 disabled:opacity-50 min-w-0"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-11 sm:h-12 px-4 sm:px-6 bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 sm:gap-2 shadow-md shadow-sky-600/20 disabled:opacity-50 shrink-0 min-w-[44px] min-h-[44px]"
          >
            <span>Send</span>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>

        {/* Edit Milestone Modal */}
        {editingMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-md max-h-[88dvh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 sm:p-6 text-white shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base font-bold flex items-center gap-2 text-sky-400">
                  <Flag className="size-4" />
                  <span>Edit AI Milestone</span>
                </h3>
                <button onClick={() => setEditingMilestone(null)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedMilestone} className="flex flex-col min-h-0 overflow-hidden mt-3">
                <div className="overflow-y-auto pr-1 space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Milestone Name</label>
                    <input
                      type="text"
                      required
                      value={editingMilestone.item.title}
                      onChange={(e) =>
                        setEditingMilestone({
                          ...editingMilestone,
                          item: { ...editingMilestone.item, title: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Description</label>
                    <textarea
                      rows={3}
                      value={editingMilestone.item.description}
                      onChange={(e) =>
                        setEditingMilestone({
                          ...editingMilestone,
                          item: { ...editingMilestone.item, description: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Target Due Date</label>
                    <input
                      type="date"
                      required
                      value={editingMilestone.item.dueDate}
                      onChange={(e) =>
                        setEditingMilestone({
                          ...editingMilestone,
                          item: { ...editingMilestone.item, dueDate: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0 mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingMilestone(null)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white text-xs">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-md max-h-[88dvh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 sm:p-6 text-white shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base font-bold flex items-center gap-2 text-purple-400">
                  <ListTodo className="size-4" />
                  <span>Edit AI Sprint Task</span>
                </h3>
                <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedTask} className="flex flex-col min-h-0 overflow-hidden mt-3">
                <div className="overflow-y-auto pr-1 space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Task Title</label>
                    <input
                      type="text"
                      required
                      value={editingTask.item.title}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          item: { ...editingTask.item, title: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Description</label>
                    <textarea
                      rows={3}
                      value={editingTask.item.description}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          item: { ...editingTask.item, description: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Priority</label>
                      <select
                        value={editingTask.item.priority}
                        onChange={(e) =>
                          setEditingTask({
                            ...editingTask,
                            item: { ...editingTask.item, priority: e.target.value as PriorityLevel },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Due Date</label>
                      <input
                        type="date"
                        value={editingTask.item.dueDate || ''}
                        onChange={(e) =>
                          setEditingTask({
                            ...editingTask,
                            item: { ...editingTask.item, dueDate: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-purple-500 text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0 mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingTask(null)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white text-xs">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Tech Stack Modal */}
        {editingTechStack && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-lg max-h-[88dvh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 sm:p-6 text-white shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base font-bold flex items-center gap-2 text-emerald-400">
                  <Code2 className="size-5" />
                  <span>Edit & Apply Project Tech Stack</span>
                </h3>
                <button onClick={() => setEditingTechStack(null)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 space-y-4 my-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Building className="size-3.5 text-purple-400" />
                    <span>Target Project: {selectedProjectObj?.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Add or remove technologies below. Upon saving, the project's actual <strong>techStack</strong> field in the database will be updated.
                  </p>
                </div>

                {/* Current Stack Tag List */}
                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">Technologies ({editingTechStack.stack.length}):</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#060913] border border-slate-800 min-h-[60px] items-center">
                    {editingTechStack.stack.length > 0 ? (
                      editingTechStack.stack.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-1.5"
                        >
                          <span>{tech}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingTechStack({
                                ...editingTechStack,
                                stack: editingTechStack.stack.filter((_, i) => i !== idx),
                              })
                            }
                            className="hover:text-rose-400 text-slate-400 transition-colors"
                            title="Remove technology"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px] italic">No technologies added yet. Use field below to add.</span>
                    )}
                  </div>
                </div>

                {/* Add New Technology Field */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Add New Technology</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g., Redis, Docker, GraphQL, PostgreSQL..."
                      value={editingTechStack.newTechInput}
                      onChange={(e) =>
                        setEditingTechStack({
                          ...editingTechStack,
                          newTechInput: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (editingTechStack.newTechInput.trim()) {
                            const trimmed = editingTechStack.newTechInput.trim();
                            if (!editingTechStack.stack.includes(trimmed)) {
                              setEditingTechStack({
                                ...editingTechStack,
                                stack: [...editingTechStack.stack, trimmed],
                                newTechInput: '',
                              });
                            } else {
                              setEditingTechStack({ ...editingTechStack, newTechInput: '' });
                            }
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                    <Button
                      type="button"
                      disabled={!editingTechStack.newTechInput.trim()}
                      onClick={() => {
                        if (editingTechStack.newTechInput.trim()) {
                          const trimmed = editingTechStack.newTechInput.trim();
                          if (!editingTechStack.stack.includes(trimmed)) {
                            setEditingTechStack({
                              ...editingTechStack,
                              stack: [...editingTechStack.stack, trimmed],
                              newTechInput: '',
                            });
                          } else {
                            setEditingTechStack({ ...editingTechStack, newTechInput: '' });
                          }
                        }
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs gap-1 border border-slate-700"
                    >
                      <Plus className="size-3.5" />
                      <span>Add</span>
                    </Button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0 mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingTechStack(null)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={updatingTechStackMsgId === editingTechStack.msgId}
                    onClick={() => handleApplyTechStack(editingTechStack.msgId, editingTechStack.stack)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    {updatingTechStackMsgId === editingTechStack.msgId ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    <span>Save & Apply Tech Stack</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
