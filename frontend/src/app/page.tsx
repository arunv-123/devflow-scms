'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  BrainCircuit,
  FolderKanban,
  CheckCircle2,
  Users,
  ShieldCheck,
  TrendingUp,
  Zap,
  BarChart3,
  Bot,
  Globe,
  Layers,
  ChevronRight,
  PhoneCall,
  Check,
  Play,
  Activity,
  Award,
  Calendar,
  Clock,
  PieChart,
  UserCheck,
  FileText,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StitchLandingPage() {
  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-400 overflow-x-hidden">
      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-sky-500/15 via-blue-600/10 to-transparent blur-[120px]" />
        <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-cyan-600/10 blur-[150px]" />
        <div className="absolute top-[1600px] left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px]" />
        <div className="absolute top-[2400px] right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[150px]" />
      </div>

      {/* Stitch Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#060913] rounded-[10px] flex items-center justify-center">
                <Sparkles className="size-5 text-sky-400" />
              </div>
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                DevFlow
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400 block -mt-1">
                AI SCMS Platform
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-sky-400 transition-colors">Features</a>
            <a href="#ai-platform" className="hover:text-sky-400 transition-colors">AI Intelligence</a>
            <a href="#solutions" className="hover:text-sky-400 transition-colors">Solutions</a>
            <a href="#enterprise" className="hover:text-sky-400 transition-colors">Enterprise</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800/60 text-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-sky-600/30 gap-2 border border-sky-400/30">
                <span>Get Started</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Stitch Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-6 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-sky-500/30 text-sky-300 text-xs font-semibold shadow-inner">
          <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-extrabold uppercase">
            NEW
          </span>
          <span>AI-powered project health & forecasting</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]">
          Run software projects with{' '}
          <span className="cyan-gradient-text">intelligence.</span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
          DevFlow brings projects, clients, teams, analytics, and AI-connected planning into one intelligent workspace — so your company ships faster with complete clarity.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/dashboard">
            <Button size="lg" className="h-12 px-8 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-xl shadow-sky-600/30 border border-sky-400/30 gap-2">
              <span>See the Tour</span>
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/ai/assistant">
            <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-sm font-medium gap-2">
              <Play className="size-4 text-sky-400" />
              <span>View the Demo</span>
            </Button>
          </Link>
        </div>

        {/* Stitch Window Mockup */}
        <div className="pt-12 relative max-w-5xl mx-auto">
          <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-2xl shadow-sky-950/40 p-4 lg:p-6 text-left space-y-6">
            {/* Mac OS Window Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-500/80" />
                <span className="size-3 rounded-full bg-yellow-500/80" />
                <span className="size-3 rounded-full bg-green-500/80" />
                <span className="ml-4 text-xs font-mono text-slate-500">app.devflow.io/dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20 font-semibold">
                <Activity className="size-3.5" />
                <span>AI Health Score: 87/100</span>
              </div>
            </div>

            {/* Mockup Dashboard Top Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Project Health</div>
                <div className="text-3xl font-extrabold text-white">87 <span className="text-xs text-slate-500 font-normal">/ 100</span></div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-sky-400 h-full rounded-full" style={{ width: '87%' }} />
                </div>
                <span className="text-[10px] text-sky-400 font-semibold block pt-1">AI-verified optimal</span>
              </div>

              <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Enterprise</div>
                <div className="text-3xl font-extrabold text-white">94.1%</div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full" style={{ width: '94.1%' }} />
                </div>
                <span className="text-[10px] text-slate-400 block pt-1">4 Active Projects</span>
              </div>

              <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Delivery</div>
                <div className="text-3xl font-extrabold text-emerald-400">+18%</div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: '78%' }} />
                </div>
                <span className="text-[10px] text-emerald-400 block pt-1">Ahead of Schedule</span>
              </div>
            </div>

            {/* Mockup Bottom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <BrainCircuit className="size-4" />
                  <span>AI PROJECT REPORT</span>
                </div>
                <p className="text-xs text-slate-300">
                  Schedule review on 03 tasks for FinTech Nexus. Risk level remains low.
                </p>
                <div className="inline-block px-2.5 py-1 rounded bg-sky-500/10 text-sky-300 text-[10px] font-semibold border border-sky-500/20">
                  Recommended Action: Rebalance Team
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-300 uppercase text-[11px]">ACTIVE TASKS</div>
                <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800">
                  <span>Integration sprint</span>
                  <span className="text-sky-400 font-mono">6/12</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800">
                  <span>Payment API Integration</span>
                  <span className="text-emerald-400 font-mono">Done</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 py-1">
                  <span>Master Security System</span>
                  <span className="text-amber-400 font-mono">Review</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-300 uppercase text-[11px]">TEAM LOAD</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Alex Chen</span>
                    <span className="text-sky-400 font-bold">85%</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Marcus Vance</span>
                    <span className="text-amber-400 font-bold">92%</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Elena Rostova</span>
                    <span className="text-emerald-400 font-bold">65%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted Logos Banner */}
        <div className="pt-12 text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            TRUSTED BY TECH-FORWARD TEAMS WORLDWIDE
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-slate-400 font-semibold text-sm">
            <span>TechCorp</span>
            <span>ApexCapital</span>
            <span>BioHealth</span>
            <span>LogiTrack</span>
            <span>Quantum</span>
            <span>MindAI</span>
          </div>
        </div>
      </section>

      {/* Feature Section 1: One Intelligent Workspace */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
            PLATFORM
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            One intelligent workspace for the whole company
          </h2>
          <p className="text-slate-400 text-base">
            DevFlow replaces the scattered tools your team toggles with a single system built for modern software agency speed.
          </p>
        </div>

        {/* Showcase Grid Part 1 */}
        <div className="space-y-16">
          {/* Showcase 1: Kanban Board */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">PROJECT MANAGEMENT</span>
              <h3 className="text-2xl md:text-3xl font-bold text-white">Every project, perfectly orchestrated</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Get full visibility into every sprint feature, task dependencies, subtask checklists, and progress state in a single, elegant workspace.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-sky-400" />
                  <span>Custom Kanban board views</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-sky-400" />
                  <span>Milestones & roadmap goals</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-sky-400" />
                  <span>Progress & baseline tracking</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {['Todo', 'In Progress', 'Review', 'Done'].map((col, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#0e1424] border border-slate-800/80 space-y-2">
                  <div className="font-bold text-slate-300 border-b border-slate-800 pb-1 text-[11px]">{col}</div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                    Feature module #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Showcase 2: Clients & CRM */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center lg:flex-row-reverse">
            <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-400 pb-2 border-b border-slate-800">
                <span>CLIENT / DEAL</span>
                <span>STATUS</span>
                <span>VALUE</span>
              </div>
              <div className="flex items-center justify-between text-slate-200 py-1.5 border-b border-slate-800/60">
                <span>TechCorp Redesign</span>
                <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] font-bold">Converted</span>
                <span className="font-mono text-emerald-400 font-bold">$180k</span>
              </div>
              <div className="flex items-center justify-between text-slate-200 py-1.5 border-b border-slate-800/60">
                <span>HealthPulse Platform</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold">Proposal</span>
                <span className="font-mono text-emerald-400 font-bold">$120k</span>
              </div>
              <div className="flex items-center justify-between text-slate-200 py-1.5">
                <span>AI Knowledge Engine</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold">New</span>
                <span className="font-mono text-emerald-400 font-bold">$95k</span>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">CRM & PIPELINE</span>
              <h3 className="text-2xl md:text-3xl font-bold text-white">Clients and pipeline, under control</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                See lead activity, meetings, and proposals all in a unified pipeline. Every client record stays connected to the actual team tasks that deliver the work.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-purple-400" />
                  <span>Pipeline & deal tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-purple-400" />
                  <span>Workspace client portal</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-purple-400" />
                  <span>Full activity timeline</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stitch Section 2: Project Health & Risk Prediction */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
              PROJECT HEALTH
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Know a project is at risk before it slips
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              DevFlow continuously monitors project health. If a task is delayed, workload is uneven, or budget spikes, DevFlow flags it before your team slips.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-sky-400" />
                <span>AI-verified project health score</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-sky-400" />
                <span>Proactive risk prediction alerts</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-sky-400" />
                <span>Timelines & bottleneck warnings</span>
              </li>
            </ul>
          </div>

          {/* Donut Gauge Graphic */}
          <div className="p-8 rounded-2xl bg-[#0b0f19] border border-slate-800 flex flex-col items-center justify-center space-y-6">
            <div className="relative size-40 flex items-center justify-center">
              <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-sky-400"
                  strokeDasharray="87, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold text-white block">87</span>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Healthy</span>
              </div>
            </div>

            <div className="w-full space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Task Completion</span>
                  <span className="font-mono text-sky-400 font-bold">92%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-sky-400 h-full rounded-full" style={{ width: '92%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Readiness</span>
                  <span className="font-mono text-indigo-400 font-bold">85%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stitch Section 3: Analytics & Decision Intelligence */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
          {/* Revenue Chart Card */}
          <div className="p-8 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">ANNUAL REVENUE 2026</span>
                <span className="text-3xl font-extrabold text-white">$1.24M</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                +12% YoY
              </span>
            </div>

            <div className="h-36 flex items-end gap-3 pt-4 justify-between">
              {[40, 65, 55, 80, 70, 95, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-slate-900 rounded-t-lg overflow-hidden h-full flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-sky-600 to-cyan-400 rounded-t-lg"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              REPORTS & DATA
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Decisions backed by beautiful data
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Real-time data insights give managers clear visibility into revenue, resource velocity, and performance metrics designed to tell a story — not just fill a screen with charts.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-purple-400" />
                <span>Clarity on resource velocity</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-purple-400" />
                <span>Instrumentation of key metrics</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-purple-400" />
                <span>Exportable reports</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stitch Section 4: Smart Team Matcher / Team Management */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
              TEAM MANAGEMENT
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              The right people on the right work
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              See capacity at a glance and let DevFlow recommend the best-fit team members for every project based on skills, experience, availability, and workload.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-sky-400" />
                <span>Capacity & workload vision</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-sky-400" />
                <span>Skill-matched matching</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-sky-400" />
                <span>Workload balance alerts</span>
              </li>
            </ul>
          </div>

          {/* Member Compatibility Cards */}
          <div className="space-y-3">
            {[
              { name: 'Alex Chen', role: 'Full Stack Lead', score: '98% match' },
              { name: 'Vanessa Kim', role: 'UI/UX Designer', score: '94% match' },
              { name: 'Justin Diaz', role: 'Backend Developer', score: '88% match' },
            ].map((m, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#0b0f19] border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{m.name}</h4>
                    <span className="text-slate-400 text-[11px]">{m.role}</span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold border border-sky-500/20">
                  {m.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stitch Section 5: AI Project Assistant - Requirements Conversion */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
          {/* AI Plan Preview Box */}
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4">
            <div className="p-4 rounded-xl bg-[#060913] border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-sky-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <BrainCircuit className="size-4" />
                  <span>Requirement Analyzer</span>
                </span>
                <span className="text-[10px] text-slate-500">Auto-parsing</span>
              </div>
              <p className="text-slate-300 italic text-[11px]">
                "Build a microservices fintech API supporting OAuth2, multi-currency wallet, and real-time transaction reporting."
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                <span>Extracted 14 key requirements</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                <span>Analyzed architecture dependencies</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                <span>Estimated 8-week timeline</span>
              </div>
              <div className="flex items-center gap-2 text-sky-400 animate-pulse font-semibold">
                <Sparkles className="size-3.5" />
                <span>Generating recommendations...</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Milestones</span>
                <span className="font-bold text-white text-sm">3</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Tasks</span>
                <span className="font-bold text-white text-sm">14</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Duration</span>
                <span className="font-bold text-white text-sm">8wks</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              AI PLANNING
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Turn raw requirements into a planned project in seconds
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Paste a meeting transcript or client proposal and AI will extract requirements, generate milestones, estimate timelines, recommend tech stack, and suggest team allocation — ready for engineering execution.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              {[
                'Requirement Extraction',
                'Smart Milestone Forecast',
                'Milestone Generation',
                'Task Breakdown',
                'Timeline Estimation',
                'Tech Stack Suggestions',
              ].map((tag, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-[#0b0f19] border border-slate-800 text-slate-300 font-medium text-[11px] flex items-center gap-1.5">
                  <Check className="size-3.5 text-sky-400" />
                  <span>{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stitch Section 6: End-to-End Workflow Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
            WORKFLOW STEPS
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            From first conversation to shipped software
          </h2>
          <p className="text-slate-400 text-sm">
            DevFlow connects every stage of software firm operations into one cohesive flow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Client Ingestion', desc: 'Leads, proposals, contracts & scopes.', icon: PhoneCall },
            { step: '02', title: 'AI Blueprints', desc: 'AI milestone & roadmap creation.', icon: BrainCircuit },
            { step: '03', title: 'Scoped Meetings', desc: 'Schedule & transcode notes.', icon: Calendar },
            { step: '04', title: 'Task Assignment', desc: 'Board, subtasks & communication.', icon: CheckCircle2 },
            { step: '05', title: 'Analytics', desc: 'Velocity & budget reporting.', icon: BarChart3 },
            { step: '06', title: 'Smart Allocation', desc: 'Resource & capacity balancing.', icon: Users },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 hover:border-sky-500/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold font-mono">
                  <span>{item.step}</span>
                  <Icon className="size-4 text-sky-400" />
                </div>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stitch Blue-Cyan CTA Section */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="p-10 md:p-14 rounded-3xl blue-cta-gradient text-center space-y-6 text-white shadow-2xl shadow-sky-500/20">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto">
            Give your software company an intelligent operating system
          </h2>
          <p className="text-sky-100 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Start today. Unite your team, clients, and AI workflows for every project, task, and business milestone.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-8 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm gap-2">
                <span>Get Started Now</span>
                <ArrowRight className="size-4 text-sky-400" />
              </Button>
            </Link>
            <Link href="/ai/assistant">
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl border-white/30 text-white hover:bg-white/10 text-sm font-semibold">
                Book Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Professional Stitch Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060913] py-16 px-6 relative z-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-600 p-0.5">
                <div className="w-full h-full bg-[#060913] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="size-4 text-sky-400" />
                </div>
              </div>
              <span className="font-bold text-lg text-white">DevFlow</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              DevFlow is a full-stack AI-powered Software Company Management System (SCMS) designed to help software firms manage the complete client & project lifecycle.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Executive Dashboard</Link></li>
              <li><Link href="/projects" className="hover:text-white transition-colors">Projects & Tasks</Link></li>
              <li><Link href="/crm" className="hover:text-white transition-colors">CRM & Pipeline</Link></li>
              <li><Link href="/ai/assistant" className="hover:text-white transition-colors">AI Copilot</Link></li>
              <li><Link href="/reports" className="hover:text-white transition-colors">Analytics Reports</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Solutions</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Software Agencies</a></li>
              <li><a href="#" className="hover:text-white transition-colors">SaaS Development</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Enterprise IT</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Remote Engineering</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <span>© 2026 DevFlow SCMS Inc. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
            <a href="#" className="hover:text-slate-300">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
