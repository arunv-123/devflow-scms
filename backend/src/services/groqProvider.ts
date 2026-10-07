import OpenAI from 'openai';
import { IUser } from '../types/auth';
import { AssistantChatResponse, ChatMessageHistoryItem } from '../types/ai';
import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { Meeting } from '../models/meetingModel';
import { User } from '../models/userModel';
import { aiService } from './aiService';

const isToolAuthorizedForRole = (toolName: string, role: string): boolean => {
  const allowedMap: Record<string, string[]> = {
    'analyze_project_health': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead'],
    'get_smart_team_recommendations': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead'],
    'suggest_tech_stack': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead'],
    'summarize_meeting_notes': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead'],
    'get_team_workload_analysis': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead'],
    'get_my_tasks': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead', 'Developer', 'Designer', 'QA', 'Client'],
    'break_down_task': ['Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Team Lead', 'Developer', 'Designer', 'QA'],
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

    const systemInstruction = `You are DevFlow AI Assistant, an intelligent hybrid AI copilot for DevFlow SCMS, software engineering, and general technical guidance.
Authenticated User Context:
- Name: ${user.name}
- Email: ${user.email}
- Role: ${user.role}
- User ID: ${userIdStr}

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

3. PROJECT DATA INTEGRITY (NO HALLUCINATIONS):
   - Never invent or hallucinate project data (project names, task names, statuses, milestone dates, client info, team assignments, health scores, database records).
   - If the user asks about a specific DevFlow project item or metric and that data is not provided or unavailable via tool/context, state clearly that the project information is currently unavailable instead of guessing.

4. SECURITY & PERMISSIONS:
   - If a tool call returns a PERMISSION DENIED result, inform the user politely that their role (${user.role}) is not authorized for that action and state which roles possess authorization. Never override or bypass permissions.

5. RESPONSE FORMATTING:
   - Provide clean, professional responses formatted in GitHub Markdown. Never reveal API keys, secret tokens, or internal database connection strings.`;

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

          // Tool Execution
          let toolOutput: any = {};

          if (toolName === 'analyze_project_health') {
            toolOutput = await aiService.analyzeProjectHealth(args.projectId || projectId);
          } else if (toolName === 'get_smart_team_recommendations') {
            toolOutput = await aiService.getSmartTeamRecommendations(args.projectId || projectId, args.skills);
          } else if (toolName === 'get_my_tasks') {
            let query: any = { 'assignee.id': userIdStr };
            if (args.projectId || projectId) {
              query.projectId = args.projectId || projectId;
            }
            let userTasks = await Task.find(query).sort({ dueDate: 1 });
            if (userTasks.length === 0 && (args.projectId || projectId)) {
              userTasks = await Task.find({ projectId: args.projectId || projectId }).limit(5);
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
            let existingStack: string[] = ['React', 'Node.js', 'TypeScript', 'MongoDB'];
            if (args.projectId || projectId) {
              const p = await Project.findById(args.projectId || projectId);
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
