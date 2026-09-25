'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, RefreshCw, Layers } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello Alex! I am your DevFlow AI Project Copilot. I can analyze project health, summarize meeting notes, generate tasks, or recommend team allocations. What would you like to review today?',
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const aiReply = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `I analyzed your request regarding "${input}". All active projects are operating within standard budget parameters. FinTech Nexus Suite is at 68% progress with 92/100 health score.`,
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 800);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Bot className="size-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AI Project Copilot Assistant</h1>
              <p className="text-xs text-slate-400">Context-aware conversational assistant for software project management.</p>
            </div>
          </div>
        </div>

        {/* Chat Messages Panel */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-[#0b0f19] border border-slate-800">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  m.sender === 'user' ? 'bg-sky-600 text-white' : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                }`}
              >
                {m.sender === 'user' ? 'AM' : <Bot className="size-4 text-purple-400" />}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-lg text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-sky-600 text-white'
                    : 'bg-[#060913] text-slate-200 border border-slate-800'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Ask AI Copilot to summarize projects, generate tasks, or check workload..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 h-12 px-4 text-xs bg-[#0b0f19] border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
          <Button type="submit" className="h-12 px-6 bg-sky-600 hover:bg-sky-500 text-white text-xs gap-2 shadow-md shadow-sky-600/20">
            <span>Send</span>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
