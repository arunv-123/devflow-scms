import OpenAI from 'openai';
import { IUser } from '../types/auth';
import { AssistantChatResponse, ChatMessageHistoryItem } from '../types/ai';
import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { Meeting } from '../models/meetingModel';
import { User } from '../models/userModel';
import { aiService } from './aiService';
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

const groqTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'analyze_project_health',
      description: 'Analyze health score, risk level, completion rate, overdue tasks, and diagnostic insights for a project or overall company.',
      parameters: {
        type: 'object',
        properties: {
          projectId: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Optional project ID to analyze' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_smart_team_recommendations',
      description: 'Generate smart team allocation recommendations based on skill alignment, availability, and workload capacity.',
      parameters: {
        type: 'object',
        properties: {
          projectId: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Optional project ID' },
          skills: { type: 'array', items: { type: 'string' }, description: 'Target required skills' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_tasks',
      description: 'Retrieve assigned tasks, priority, due dates, and task descriptions for the current user.',
      parameters: {
        type: 'object',
        properties: {
          projectId: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Optional project ID' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'break_down_task',
      description: 'Generate a proposed technical subtask breakdown for a specific task.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'ID of the task to break down' },
          taskTitle: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Title of the task' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_tech_stack',
      description: 'Analyze project requirements and suggest optimal technology stack recommendations.',
      parameters: {
        type: 'object',
        properties: {
          projectId: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Optional project ID' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'summarize_meeting_notes',
      description: 'Summarize client meeting notes and generate milestone and task blueprint suggestions.',
      parameters: {
        type: 'object',
        properties: {
          projectId: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Optional project ID' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_team_workload_analysis',
      description: 'Analyze workload percentages, availability status, and capacity across team members.',
      parameters: {
        type: 'object',
        properties: {
          projectId: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Optional project ID' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_project_details',
      description: 'Retrieve real-time project details, progress, remaining milestones, and overdue tasks for an authorized project.',
      parameters: {
        type: 'object',
        properties: {
          projectId: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'Optional project ID to inspect' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_accessible_projects',
      description: 'List all authorized projects accessible to the authenticated user.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

export class GroqProvider {
  private getGroqClient(): OpenAI | null {
    const apiKey = process.env.GROQ_API_KEY;
    if (
      !apiKey ||
      apiKey === 'your_groq_key_here' ||
      apiKey === 'YOUR_GROQ_API_KEY' ||
      apiKey.trim() === ''
    ) {
      return null;
    }
    return new OpenAI({
      apiKey: apiKey.trim(),
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  public getGroqModel(): string {
    const raw = process.env.GROQ_MODEL;
    if (!raw || raw.trim() === '') {
      return 'openai/gpt-oss-120b';
    }
    return raw.trim();
  }

  /**
   * Direct connection test for STEP 5: sends a prompt to verify Groq integration.
   */
  public async testConnection(customPrompt: string = 'Say hello in one short sentence.'): Promise<{
    success: boolean;
    message: string;
    data?: string;
    error?: string;
    model: string;
    endpoint: string;
    status?: number;
  }> {
    const endpoint = 'https://api.groq.com/openai/v1';
    const model = this.getGroqModel();
    const apiKey = process.env.GROQ_API_KEY;

    if (
      !apiKey ||
      apiKey === 'your_groq_key_here' ||
      apiKey === 'YOUR_GROQ_API_KEY' ||
      apiKey.trim() === ''
    ) {
      return {
        success: false,
        message: 'GROQ_API_KEY is missing or unconfigured in environment (process.env.GROQ_API_KEY).',
        error: 'MISSING_API_KEY',
        model,
        endpoint,
      };
    }

    try {
      const groq = this.getGroqClient();
      if (!groq) {
        return {
          success: false,
          message: 'Failed to initialize Groq client.',
          error: 'CLIENT_INIT_FAILED',
          model,
          endpoint,
        };
      }

      console.log(`[Groq Provider Test] Sending request to endpoint ${endpoint} (Model: ${model})...`);

      const response = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: customPrompt }],
        max_tokens: 60,
      });

      const reply = response.choices[0]?.message?.content || '';
      console.log(`[Groq Provider Test] Response received from Groq (${model}): "${reply.trim()}"`);

      return {
        success: true,
        message: 'Groq client initialized and responded successfully.',
        data: reply.trim(),
        model,
        endpoint,
      };
    } catch (err: any) {
      const rawErrMsg = err?.message || String(err);
      const sanitizedMsg = rawErrMsg
        .replace(/gsk_[a-zA-Z0-9]+/g, '[REDACTED]')
        .replace(/key=[^&\s]+/gi, 'key=[REDACTED]');
      const status = err?.status || err?.statusCode || 500;

      console.error(`[Groq Provider Test Failed] Status ${status} | Model: ${model} | Endpoint: ${endpoint} | Error: ${sanitizedMsg}`);

      return {
        success: false,
        message: `Groq direct test failed: ${sanitizedMsg}`,
        error: err?.code || String(err?.status || 'API_ERROR'),
        status,
        model,
        endpoint,
      };
    }
  }

  /**
   * Handles bounded retries for transient server/network errors (max 2 retries).
   */
  private async callGroqWithRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 500): Promise<T> {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;
        const status = err?.status || err?.statusCode;
        const isTransient = !status || status >= 500 || status === 429;
        if (attempt > retries || !isTransient) {
          throw err;
        }
        console.warn(`[Groq Provider] Bounded retry attempt ${attempt}/${retries} after transient error (${err?.message}). Waiting ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
    throw new Error('Groq request failed after retries.');
  }

  /**
   * Process conversational assistant chat requests via OpenAI-compatible Groq API.
   */
  public async processAssistantChat(input: {
    prompt: string;
    projectId?: string;
    action?: string;
    taskId?: string;
    messages?: ChatMessageHistoryItem[];
    user: IUser;
  }): Promise<AssistantChatResponse> {
    const { prompt, projectId, action, taskId, messages, user } = input;
    const role = user.role;
    const userIdStr = user._id.toString();

    const modelName = this.getGroqModel();
    const endpoint = 'https://api.groq.com/openai/v1';

    console.log(`[Groq Provider] Request received from ${user.name} (${user.role}) -> Target Model: ${modelName} | Endpoint: ${endpoint}`);

    const groq = this.getGroqClient();
    if (!groq) {
      console.warn('[Groq Provider] GROQ_API_KEY is missing or unconfigured.');
      return {
        answer: `⚠️ **Groq API Key Missing or Invalid**\n\n\`GROQ_API_KEY\` is not properly configured in \`backend/.env\`.\n\n- Model: \`${modelName}\`\n- Endpoint: \`${endpoint}\`\n\nPlease add a valid Groq API key in \`backend/.env\` to use Groq.`,
      };
    }

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

    const messagesPayload: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemInstruction },
    ];

    if (Array.isArray(messages)) {
      messages.forEach((m) => {
        if (m.role === 'user') {
          messagesPayload.push({ role: 'user', content: m.content });
        } else if (m.role === 'assistant') {
          messagesPayload.push({ role: 'assistant', content: m.content });
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
      messagesPayload.push({ role: 'user', content: userPromptContent });
    }

    try {
      console.log(`[Groq Provider] Sending request to Groq API (Model: ${modelName})...`);

      const firstResponse = await this.callGroqWithRetry(() =>
        groq.chat.completions.create({
          model: modelName,
          messages: messagesPayload,
          tools: groqTools,
          temperature: 0.7,
        })
      );

      const choice = firstResponse.choices[0];
      const assistantMsg = choice?.message;

      if (!assistantMsg) {
        return {
          answer: 'No response received from Groq model.',
        };
      }

      let extraArtifacts: {
        action?: string;
        taskId?: string;
        taskTitle?: string;
        suggestedSubtasks?: Array<{ id: string; title: string; completed?: boolean }>;
        generatedItems?: any;
      } = {};

      if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
        // Push the assistant message containing tool calls
        messagesPayload.push(assistantMsg);

        for (const toolCall of assistantMsg.tool_calls) {
          if (toolCall.type !== 'function' || !toolCall.function) continue;

          const toolName = toolCall.function.name;
          let args: any = {};
          try {
            args = JSON.parse(toolCall.function.arguments || '{}');
          } catch (_) {}

          // RBAC Check
          if (!isToolAuthorizedForRole(toolName, role)) {
            messagesPayload.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                error: `PERMISSION DENIED: User role '${role}' is not authorized to execute tool '${toolName}'. Inform the user politely that this operation requires appropriate Project Manager permissions.`,
              }),
            });
            continue;
          }

          // Tool Execution with Strict Authorization
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
                toolOutput = await aiService.analyzeProjectHealth(targetPid);
              }
            } else {
              toolOutput = await aiService.analyzeProjectHealth();
            }
          } else if (toolName === 'get_smart_team_recommendations') {
            const targetPid = args.projectId || resolvedProjectId;
            toolOutput = await aiService.getSmartTeamRecommendations(targetPid, args.skills);
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
            const meeting =
              (await Meeting.findOne({ status: 'Completed' }).sort({ updatedAt: -1 })) ||
              (await Meeting.findOne().sort({ createdAt: -1 }));
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
              summary:
                meeting?.notes ||
                'Executive Summary:\nConfirmed architecture scope, agreed on 2-week sprint cycle, and set milestone target dates.',
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
              tasks: [...ms1Tasks, ...ms2Tasks],
            };
            toolOutput = extraArtifacts.generatedItems;
          } else if (toolName === 'get_team_workload_analysis') {
            const users = await User.find({ role: { $in: ['Developer', 'Designer', 'QA', 'Team Lead'] } }).select('-password');
            toolOutput = users.map((u) => ({
              name: u.name,
              role: u.role,
              workloadPercent: u.workloadPercent,
              availability: u.availability,
            }));
          }

          messagesPayload.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolOutput),
          });
        }

        // Second completion call to synthesize final user-facing Markdown text response
        const secondResponse = await this.callGroqWithRetry(() =>
          groq.chat.completions.create({
            model: modelName,
            messages: messagesPayload,
            temperature: 0.7,
          })
        );

        return {
          answer: secondResponse.choices[0]?.message?.content || 'Analysis complete.',
          action: extraArtifacts.action,
          taskId: extraArtifacts.taskId,
          taskTitle: extraArtifacts.taskTitle,
          suggestedSubtasks: extraArtifacts.suggestedSubtasks,
          generatedItems: extraArtifacts.generatedItems,
        };
      }

      return {
        answer: assistantMsg.content || 'I processed your request.',
      };
    } catch (err: any) {
      const rawErrMsg = err?.message || String(err);
      const sanitizedErrMsg = rawErrMsg
        .replace(/gsk_[a-zA-Z0-9]+/g, '[REDACTED]')
        .replace(/key=[^&\s]+/gi, 'key=[REDACTED]');

      const status = err?.status || err?.statusCode || 500;
      console.error(`[Groq Provider Error HTTP ${status}] Model: ${modelName} | Endpoint: ${endpoint} | Details:`, sanitizedErrMsg);

      if (status === 401) {
        return {
          answer: `⚠️ **Groq API Request Failed (HTTP 401 Unauthorized)**\n\n\`GROQ_API_KEY\` is invalid or unauthorized.\n\n- Model: \`${modelName}\`\n- Endpoint: \`${endpoint}\`\n- Error Details: ${sanitizedErrMsg}`,
        };
      }

      if (status === 429) {
        return {
          answer: `⚠️ **Groq API Request Failed (HTTP 429 Rate Limit Exceeded)**\n\nGroq API rate limit or quota has been reached.\n\n- Model: \`${modelName}\`\n- Endpoint: \`${endpoint}\`\n- Error Details: ${sanitizedErrMsg}`,
        };
      }

      return {
        answer: `⚠️ **Groq API Request Failed (HTTP ${status})**\n\n- Model: \`${modelName}\`\n- Endpoint: \`${endpoint}\`\n- Error Details: ${sanitizedErrMsg}`,
      };
    }
  }
}

export const groqProvider = new GroqProvider();
