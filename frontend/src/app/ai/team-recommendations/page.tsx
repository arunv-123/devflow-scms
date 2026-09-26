'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Users, CheckCircle2, ArrowRight, BrainCircuit, Loader2, UserCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { aiApi, TeamMemberRecommendation } from '@/services/aiApi';
import { projectApi } from '@/services/projectApi';

export default function TeamRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<TeamMemberRecommendation[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    projectApi
      .getProjects()
      .then((data) => setProjects(data))
      .catch((err) => console.error('Failed to fetch projects:', err));
  }, []);

  const fetchRecommendations = async (pId?: string) => {
    try {
      setLoading(true);
      const data = await aiApi.getTeamRecommendations(pId);
      setRecommendations(data);
    } catch (err: any) {
      console.error('Failed to load team recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(selectedProjectId || undefined);
  }, [selectedProjectId]);

  const handleAssignMember = async (member: TeamMemberRecommendation) => {
    try {
      setAssigningId(member.memberId);
      if (selectedProjectId) {
        // Fetch project and append member if not present
        const currentProject = projects.find((p) => p.id === selectedProjectId || p._id === selectedProjectId);
        if (currentProject) {
          const updatedMembers = [
            ...(currentProject.members || []),
            {
              id: member.memberId,
              name: member.name,
              email: member.email,
              role: member.role,
              avatar: member.avatar,
              workloadPercent: member.workloadPercent,
            },
          ];
          await projectApi.updateProject(selectedProjectId, { members: updatedMembers });
        }
      }
      setToastMessage(`Successfully assigned ${member.name} to project allocation.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to assign member:', err);
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="size-6 text-purple-400 animate-pulse" />
              <span>Smart Team Matcher</span>
            </h1>
            <p className="text-xs text-slate-400">
              Algorithmic recommendation engine for optimal team member assignments based on skills & availability.
            </p>
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Target Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-10 px-3 text-xs bg-[#0b0f19] border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">General Skill Matching</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.clientName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
            <UserCheck className="size-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 text-xs gap-2">
            <Loader2 className="size-5 animate-spin text-purple-400" />
            <span>Evaluating member skill vectors and current workload capacity...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((m) => (
              <div key={m.memberId} className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="size-12 rounded-xl object-cover ring-2 ring-purple-500/30"
                    />
                    <div>
                      <h3 className="text-base font-bold text-white">{m.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-sky-400 font-semibold">{m.role}</span>
                        <span className="text-[10px] text-slate-400">• {m.email}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      m.availability === 'Available'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : m.availability === 'Busy'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {m.availability}
                  </span>
                </div>

                {/* AI Recommendation Score & Reason */}
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-300">Match Compatibility Score</span>
                    <span className="font-extrabold text-emerald-400">{m.matchScore}% Match</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{m.matchReason}</p>
                </div>

                {/* Skills Badges */}
                {m.skills && m.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Skills & Expertise
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            m.matchingSkills.includes(skill)
                              ? 'bg-purple-950/60 text-purple-300 border-purple-500/40 font-semibold'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workload Indicator */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Current Workload</span>
                    <span className="font-semibold text-slate-200">{m.workloadPercent}% Capacity</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        m.workloadPercent > 80
                          ? 'bg-red-500'
                          : m.workloadPercent > 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${m.workloadPercent}%` }}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleAssignMember(m)}
                  disabled={assigningId === m.memberId}
                  size="sm"
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {assigningId === m.memberId ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Assign to Project</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
