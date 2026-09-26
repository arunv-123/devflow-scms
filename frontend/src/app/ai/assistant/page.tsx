'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, Loader2, CheckCircle2, ListTodo, Flag, Code2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { aiApi, AssistantChatResponse } from '@/services/aiApi';
import { projectApi } from '@/services/projectApi';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  generatedItems?: AssistantChatResponse['generatedItems'];
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am your DevFlow AI Project Copilot. I can analyze project health, summarize meeting notes, generate task breakdowns, suggest tech stacks, or recommend team allocations. What would you like to review today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    projectApi
      .getProjects()
      .then((data) => setProjects(data))
      .catch((err) => console.error('Failed to fetch projects context:', err));
  }, []);

  const handleSendPrompt = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiApi.askAssistant(textToSend, selectedProjectId || undefined);
      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer,
        generatedItems: res.generatedItems,
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      const errorReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an issue analyzing your request. Please ensure the backend server is active and try again.',
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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-4 flex flex-col h-[calc(100vh-7rem)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Bot className="size-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <span>AI Project Copilot Assistant</span>
                <Sparkles className="size-4 text-purple-400 animate-pulse" />
              </h1>
              <p className="text-xs text-slate-400">Context-aware AI for software requirement analysis & task generation.</p>
            </div>
          </div>

          {/* Project Context Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Context:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-9 px-3 text-xs bg-[#0b0f19] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Projects (Global)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSendPrompt('Analyze overall company project health and risks')}
            className="px-3 py-1.5 rounded-lg text-xs bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="size-3 text-purple-400" />
            <span>Analyze Project Health</span>
          </button>
          <button
            onClick={() => handleSendPrompt('Summarize recent meeting notes and generate sprint tasks')}
            className="px-3 py-1.5 rounded-lg text-xs bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-500/30 transition-colors flex items-center gap-1.5"
          >
            <ListTodo className="size-3 text-sky-400" />
            <span>Summarize Meeting & Generate Tasks</span>
          </button>
          <button
            onClick={() => handleSendPrompt('Suggest optimal tech stack for enterprise cloud migration')}
            className="px-3 py-1.5 rounded-lg text-xs bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1.5"
          >
            <Code2 className="size-3 text-emerald-400" />
            <span>Suggest Tech Stack</span>
          </button>
        </div>

        {/* Chat Messages Panel */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-[#0b0f19] border border-slate-800">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-sky-600 text-white'
                    : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                }`}
              >
                {m.sender === 'user' ? 'YOU' : <Bot className="size-4 text-purple-400" />}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed space-y-3 ${
                  m.sender === 'user'
                    ? 'bg-sky-600 text-white'
                    : 'bg-[#060913] text-slate-200 border border-slate-800'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>

                {/* AI Generated Artifacts / Task Cards */}
                {m.generatedItems && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3">
                    {m.generatedItems.summary && (
                      <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-purple-200">
                        <span className="font-bold block text-[11px] mb-1">Executive AI Summary:</span>
                        <p className="text-[11px] text-slate-300 leading-normal">{m.generatedItems.summary}</p>
                      </div>
                    )}

                    {m.generatedItems.techStack && m.generatedItems.techStack.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-bold text-[11px] text-emerald-400 block">Recommended Tech Stack:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.generatedItems.techStack.map((tech, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.generatedItems.milestones && m.generatedItems.milestones.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-bold text-[11px] text-sky-400 flex items-center gap-1">
                          <Flag className="size-3" />
                          <span>Generated Milestones ({m.generatedItems.milestones.length}):</span>
                        </span>
                        <div className="space-y-1.5">
                          {m.generatedItems.milestones.map((ms, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-slate-200 text-xs">{ms.title}</h4>
                                {ms.description && <p className="text-[10px] text-slate-400">{ms.description}</p>}
                              </div>
                              {ms.dueDate && <span className="text-[10px] text-sky-300 whitespace-nowrap">Due: {ms.dueDate}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.generatedItems.tasks && m.generatedItems.tasks.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-bold text-[11px] text-purple-300 flex items-center gap-1">
                          <ListTodo className="size-3" />
                          <span>Extracted Sprint Tasks ({m.generatedItems.tasks.length}):</span>
                        </span>
                        <div className="space-y-1.5">
                          {m.generatedItems.tasks.map((t, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-slate-200 text-xs">{t.title}</h4>
                                {t.description && <p className="text-[10px] text-slate-400">{t.description}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                  {t.priority}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-purple-300 animate-pulse p-2">
              <Bot className="size-5 text-purple-400" />
              <div className="flex items-center gap-2 bg-[#060913] px-4 py-2 rounded-xl border border-slate-800">
                <Loader2 className="size-4 animate-spin text-purple-400" />
                <span>AI Copilot is analyzing repository data & requirements...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Ask AI Copilot to summarize projects, generate tasks, or check workload..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 h-12 px-4 text-xs bg-[#0b0f19] border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-12 px-6 bg-sky-600 hover:bg-sky-500 text-white text-xs gap-2 shadow-md shadow-sky-600/20 disabled:opacity-50"
          >
            <span>Send</span>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
