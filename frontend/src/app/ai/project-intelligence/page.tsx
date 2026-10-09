'use client';

import React, { useState, useEffect } from 'react';
import { BrainCircuit, ShieldAlert, Sparkles, AlertTriangle, CheckCircle2, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { aiApi, OverallHealthSummary } from '@/services/aiApi';
import { CountUpNumber } from '@/components/common/DataAnimation';

export default function ProjectIntelligencePage() {
  const [summary, setSummary] = useState<OverallHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = async () => {
    try {
      setError(null);
      const data = await aiApi.getProjectHealth();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load project intelligence data:', err);
      setError('Failed to fetch project health data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const handleRunScan = async () => {
    try {
      setScanning(true);
      setError(null);
      const data = await aiApi.runProjectHealthScan();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to run real-time scan:', err);
      setError('Scan failed. Please check server connection.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BrainCircuit className="size-6 text-purple-400 animate-pulse" />
              <span>AI Project Intelligence</span>
            </h1>
            <p className="text-xs text-slate-400">
              Automated project health scoring, deadline risk evaluation, and bottleneck mitigation.
            </p>
          </div>
          <Button
            onClick={handleRunScan}
            disabled={scanning || loading}
            size="sm"
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20 disabled:opacity-50"
          >
            {scanning ? (
              <Loader2 className="size-4 animate-spin text-purple-300" />
            ) : (
              <RefreshCw className="size-4 text-purple-300" />
            )}
            <span>{scanning ? 'Scanning...' : 'Run Real-time Scan'}</span>
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 text-xs gap-2">
            <Loader2 className="size-5 animate-spin text-purple-400" />
            <span>Analyzing MongoDB projects, tasks, and sprint metrics...</span>
          </div>
        ) : summary ? (
          <>
            {/* AI Health Summary Card */}
            <div className="p-4 sm:p-6 rounded-2xl bg-[#0b0f19] border border-purple-500/30 space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Company Project Health Rating
                </span>
                <span
                  className={`self-start xs:self-auto px-3 py-1 rounded-full text-xs font-extrabold border ${
                    summary.overallHealthScore >= 80
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : summary.overallHealthScore >= 60
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  <CountUpNumber value={summary.overallHealthScore} />/100 ({summary.overallStatus})
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                AI analysis examined {summary.totalActiveProjects} active projects and {summary.totalTasksAnalyzed} sprint tasks across team capacity. Overall delivery probability is calculated at <CountUpNumber value={summary.deliveryProbability} suffix="%" />.
              </p>
            </div>

            {/* Project Health Score Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {summary.projectHealthList.map((p) => (
                <div key={p.projectId} className="p-4 sm:p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase truncate">
                        {p.clientName}
                      </span>
                      <h3 className="text-base font-bold text-white truncate">{p.projectName}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-xl font-extrabold ${
                          p.healthScore >= 80
                            ? 'text-emerald-400'
                            : p.healthScore >= 50
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        <CountUpNumber value={p.healthScore} suffix="/100" />
                      </span>
                      <span className="text-[10px] text-slate-400 block">Risk: {p.riskLevel}</span>
                    </div>
                  </div>

                  {/* Task Metrics Bar */}
                  <div className="p-3 rounded-xl bg-[#060913] border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Completion</span>
                      <span className="font-semibold text-white">
                        <CountUpNumber value={p.completionRate} suffix="%" />
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Tasks</span>
                      <span className="font-semibold text-white">{p.totalTasks}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Overdue</span>
                      <span
                        className={`font-semibold ${
                          p.overdueTasks > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'
                        }`}
                      >
                        {p.overdueTasks}
                      </span>
                    </div>
                  </div>

                  {/* AI Diagnostic Insights */}
                  <div className="p-4 rounded-xl bg-[#060913] border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-sky-300">AI Diagnostic Insights:</span>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                      {p.insights.map((insight, idx) => (
                        <li key={idx}>{insight}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Action */}
                  {p.recommendedActions.length > 0 && (
                    <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-2">
                      <Sparkles className="size-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-purple-300 block text-[11px]">Recommended Action:</span>
                        <p className="text-slate-300 text-[11px]">{p.recommendedActions[0]}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
