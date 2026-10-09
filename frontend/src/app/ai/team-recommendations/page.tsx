'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Users,
  CheckCircle2,
  Loader2,
  UserCheck,
  Building,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  UserPlus,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  UserMinus,
  X,
  AlertCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  aiApi,
  SmartTeamMatcherResult,
  TeamMemberRecommendation,
  RoleRecommendationGroup,
} from '@/services/aiApi';
import { projectApi } from '@/services/projectApi';
import { useAuth } from '@/context/AuthContext';
import { CountUpNumber, AnimatedProgressBar } from '@/components/common/DataAnimation';
import { getAvatarUrl } from '@/lib/avatar';

// Helper function to render clean role coverage status badges
const renderRoleCoverageStatus = (requiredCount: number, currentCount: number) => {
  if (currentCount === 0) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30">
        {requiredCount} Required · 0 Added · Need {requiredCount}
      </span>
    );
  }

  if (currentCount < requiredCount) {
    const need = requiredCount - currentCount;
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30">
        {requiredCount} Required · {currentCount} Added · Need {need}
      </span>
    );
  }

  if (currentCount === requiredCount) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        {requiredCount} Required · {currentCount} Added ✓
      </span>
    );
  }

  // currentCount > requiredCount
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
        {requiredCount} Required · {currentCount} Added
      </span>
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
        <AlertTriangle className="size-3 text-amber-400 shrink-0" />
        Over recommended
      </span>
    </div>
  );
};

// Carousel for a single Role
interface RoleCarouselProps {
  group: RoleRecommendationGroup;
  projectMembers: any[];
  onAddCandidate: (candidate: TeamMemberRecommendation) => void;
  onRemoveCandidate: (candidate: TeamMemberRecommendation) => void;
  addingId: string | null;
  removingId: string | null;
  expandedBreakdown: Record<string, boolean>;
  onToggleBreakdown: (id: string) => void;
}

const RoleCarousel: React.FC<RoleCarouselProps> = ({
  group,
  projectMembers,
  onAddCandidate,
  onRemoveCandidate,
  addingId,
  removingId,
  expandedBreakdown,
  onToggleBreakdown,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check how many existing project members match this role requirement
  const currentCount = projectMembers.filter((m: any) => {
    const rLower = (m.role || '').toLowerCase();
    if (group.role.toLowerCase() === 'developer') {
      return rLower.includes('developer') || rLower.includes('engineer') || rLower.includes('lead');
    }
    if (group.role.toLowerCase() === 'qa') {
      return rLower.includes('qa') || rLower.includes('tester') || rLower.includes('quality');
    }
    if (group.role.toLowerCase() === 'designer') {
      return rLower.includes('designer') || rLower.includes('ui') || rLower.includes('ux');
    }
    return rLower.includes(group.role.toLowerCase());
  }).length;

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -364, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 364, behavior: 'smooth' });
    }
  };

  if (group.candidates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 bg-[#0b0f19]/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
      {/* Role Carousel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="size-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Briefcase className="size-4 text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {group.role}s
              </h2>
              {renderRoleCoverageStatus(group.requiredCount, currentCount)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Horizontal candidate shortlist • Ranked by match score
            </p>
          </div>
        </div>

        {/* Carousel Navigation Controls & Total Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* Total Candidates Count Badge (No 1/7 pagination numbers) */}
          <span className="text-xs text-slate-300 font-bold font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            {group.candidates.length} candidates
          </span>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={scrollLeft}
              className="matcher-arrow-btn group p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-sky-600 hover:border-sky-500 transition-all duration-200 ease-out active:scale-95 shadow-sm hover:shadow-sky-500/20"
              title="Scroll left"
            >
              <ChevronLeft className="size-4 transition-transform duration-200 ease-out group-hover:-translate-x-1" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="matcher-arrow-btn group p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-sky-600 hover:border-sky-500 transition-all duration-200 ease-out active:scale-95 shadow-sm hover:shadow-sky-500/20"
              title="Scroll right"
            >
              <ChevronRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontally Scrollable Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent scroll-smooth"
        style={{ scrollbarGutter: 'stable' }}
      >
        {group.candidates.map((m) => {
          const isExpanded = expandedBreakdown[m.memberId];
          const isMemberOfProject = projectMembers.some(
            (pm: any) => (pm.id || pm._id) === m.memberId || pm.email === m.email
          );

          return (
            <div
              key={m.memberId}
              className={`w-[calc(100vw-3.5rem)] max-w-[340px] shrink-0 snap-start p-4 sm:p-5 rounded-2xl border transition-all space-y-4 shadow-xl flex flex-col justify-between ${
                isMemberOfProject
                  ? 'bg-gradient-to-b from-emerald-950/20 to-slate-950/90 border-emerald-500/40'
                  : 'bg-[#060913] border-slate-800/90 hover:border-purple-500/40'
              }`}
            >
              <div className="space-y-3.5">
                {/* Header: Avatar + Role + Availability */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={getAvatarUrl(m.avatar, m)}
                      alt={m.name}
                      className="size-10 sm:size-11 rounded-xl object-cover ring-2 ring-purple-500/30 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm font-bold text-white truncate">{m.name}</h3>
                        {isMemberOfProject && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 whitespace-nowrap">
                            ✓ Member
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-sky-400 font-semibold block truncate">{m.role}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
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
                <div className="p-3.5 rounded-xl bg-purple-950/25 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-300">Match Compatibility</span>
                    <span className="font-extrabold text-emerald-400 text-sm">
                      <CountUpNumber value={m.matchScore} suffix="% Match" />
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">{m.matchReason}</p>

                  {/* 5-Part Match Breakdown Toggle */}
                  {m.breakdown && (
                    <div className="pt-2 border-t border-purple-500/20">
                      <button
                        type="button"
                        onClick={() => onToggleBreakdown(m.memberId)}
                        className="text-[10px] text-purple-300 hover:text-purple-200 font-medium flex items-center gap-1 transition-colors"
                      >
                        <span>{isExpanded ? 'Hide Match Breakdown' : 'Show Match Breakdown'}</span>
                        {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      </button>

                      {isExpanded && (
                        <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px]">
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block">Role Match:</span>
                            <span className="font-bold text-sky-400">
                              <CountUpNumber value={m.breakdown.roleScore} suffix="%" />
                            </span>
                          </div>
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block">Skill Match:</span>
                            <span className="font-bold text-purple-400">
                              <CountUpNumber value={m.breakdown.skillScore} suffix="%" />
                            </span>
                          </div>
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block">Tech Stack Match:</span>
                            <span className="font-bold text-indigo-400">
                              <CountUpNumber value={m.breakdown.techStackScore} suffix="%" />
                            </span>
                          </div>
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                            <span className="text-slate-400 block">Workload:</span>
                            <span className="font-bold text-emerald-400">
                              <CountUpNumber value={m.breakdown.workloadScore} suffix="%" />
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Skills Badges */}
                {m.skills && m.skills.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Skills & Expertise
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {m.skills.slice(0, 4).map((skill, idx) => {
                        const isMatching = (m.matchingSkills || []).some(
                          (ms) => ms.toLowerCase() === skill.toLowerCase()
                        );
                        return (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                              isMatching
                                ? 'bg-purple-950/60 text-purple-300 border-purple-500/40 font-semibold'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Workload Capacity Progress Indicator */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Workload Capacity</span>
                    <span className="font-semibold text-slate-200">
                      <CountUpNumber value={m.workloadPercent} suffix="%" />
                    </span>
                  </div>
                  <AnimatedProgressBar
                    percentage={m.workloadPercent}
                    className={`h-full rounded-full ${
                      m.workloadPercent > 80
                        ? 'bg-red-500'
                        : m.workloadPercent > 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    trackClassName="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800"
                  />
                </div>
              </div>

              {/* REVERSIBLE SELECTION ACTION BUTTON */}
              <div className="pt-2 border-t border-slate-800/80">
                {isMemberOfProject ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                      <span>✓ Added</span>
                    </div>
                    <Button
                      onClick={() => onRemoveCandidate(m)}
                      disabled={removingId === m.memberId}
                      size="sm"
                      variant="outline"
                      className="border-rose-500/40 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs gap-1"
                      title="Remove member from project team"
                    >
                      {removingId === m.memberId ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <>
                          <UserMinus className="size-3.5" />
                          <span>Remove</span>
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => onAddCandidate(m)}
                    disabled={addingId === m.memberId}
                    size="sm"
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20 disabled:opacity-50"
                  >
                    {addingId === m.memberId ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="size-3.5" />
                        <span>Add to Project Team</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function TeamRecommendationsPage() {
  const { user } = useAuth();
  const isAuthorizedPM = !user || ['Super Admin', 'Admin', 'Project Manager', 'Team Lead'].includes(user.role);

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [matcherResult, setMatcherResult] = useState<SmartTeamMatcherResult | null>(null);
  const [loading, setLoading] = useState(true);

  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Breakdown toggle state per candidate
  const [expandedBreakdown, setExpandedBreakdown] = useState<Record<string, boolean>>({});

  // Confirmation modal state for exceeding requirement
  const [exceedCandidate, setExceedCandidate] = useState<{
    candidate: TeamMemberRecommendation;
    group: RoleRecommendationGroup;
  } | null>(null);

  useEffect(() => {
    projectApi
      .getProjects()
      .then((data) => {
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id || (data[0] as any)._id);
        }
      })
      .catch((err) => console.error('Failed to fetch projects context:', err));
  }, []);

  const fetchRecommendations = async (pId?: string) => {
    try {
      setLoading(true);
      const res = await aiApi.getTeamRecommendations(pId);
      setMatcherResult(res);
    } catch (err: any) {
      console.error('Failed to load team recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchRecommendations(selectedProjectId);
    }
  }, [selectedProjectId]);

  const selectedProjectObj = projects.find(
    (p) => p.id === selectedProjectId || p._id === selectedProjectId
  );
  const projectMembers = selectedProjectObj?.members || [];

  // Handle Add Candidate (with check for requirement fulfillment threshold)
  const handleAddCandidate = (candidate: TeamMemberRecommendation) => {
    if (!isAuthorizedPM) {
      setToastMessage('Only Project Managers and Admins can update the project team.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!matcherResult) return;

    // Find the role group coverage
    const group = matcherResult.roleGroupedRecommendations.find((g) => {
      const rLower = candidate.role.toLowerCase();
      if (g.role.toLowerCase() === 'developer') {
        return rLower.includes('developer') || rLower.includes('engineer') || rLower.includes('lead');
      }
      if (g.role.toLowerCase() === 'qa') {
        return rLower.includes('qa') || rLower.includes('tester') || rLower.includes('quality');
      }
      if (g.role.toLowerCase() === 'designer') {
        return rLower.includes('designer') || rLower.includes('ui') || rLower.includes('ux');
      }
      return rLower.includes(g.role.toLowerCase());
    });

    const currentCount = projectMembers.filter((m: any) => {
      const rLower = (m.role || '').toLowerCase();
      if (group && group.role.toLowerCase() === 'developer') {
        return rLower.includes('developer') || rLower.includes('engineer') || rLower.includes('lead');
      }
      if (group && group.role.toLowerCase() === 'qa') {
        return rLower.includes('qa') || rLower.includes('tester') || rLower.includes('quality');
      }
      if (group && group.role.toLowerCase() === 'designer') {
        return rLower.includes('designer') || rLower.includes('ui') || rLower.includes('ux');
      }
      return group ? rLower.includes(group.role.toLowerCase()) : false;
    }).length;

    const requiredCount = group?.requiredCount || 1;

    // If required number is already fulfilled, require explicit confirmation before exceeding
    if (currentCount >= requiredCount && group) {
      setExceedCandidate({ candidate, group });
    } else {
      executeAddMember(candidate);
    }
  };

  const executeAddMember = async (candidate: TeamMemberRecommendation) => {
    try {
      setAddingId(candidate.memberId);
      const isAlreadyMember = projectMembers.some(
        (m: any) => (m.id || m._id) === candidate.memberId || m.email === candidate.email
      );

      if (!isAlreadyMember) {
        const updatedMembers = [
          ...projectMembers,
          {
            id: candidate.memberId,
            name: candidate.name,
            email: candidate.email,
            role: candidate.role,
            avatar: candidate.avatar,
            workloadPercent: candidate.workloadPercent,
          },
        ];

        await projectApi.updateProject(selectedProjectId, { members: updatedMembers });

        // Update local state immediately
        setProjects((prev) =>
          prev.map((p) =>
            p.id === selectedProjectId || (p as any)._id === selectedProjectId
              ? { ...p, members: updatedMembers }
              : p
          )
        );
      }

      setToastMessage(`Successfully added ${candidate.name} (${candidate.role}) to the project team.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      console.error('Failed to add member to project team:', err);
    } finally {
      setAddingId(null);
      setExceedCandidate(null);
    }
  };

  // Handle Remove Candidate (Reversible Action)
  const handleRemoveCandidate = async (candidate: TeamMemberRecommendation) => {
    if (!isAuthorizedPM) {
      setToastMessage('Only Project Managers and Admins can update the project team.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    try {
      setRemovingId(candidate.memberId);
      const updatedMembers = projectMembers.filter(
        (m: any) => (m.id || m._id) !== candidate.memberId && m.email !== candidate.email
      );

      await projectApi.updateProject(selectedProjectId, { members: updatedMembers });

      // Update local state immediately
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProjectId || (p as any)._id === selectedProjectId
            ? { ...p, members: updatedMembers }
            : p
        )
      );

      setToastMessage(`Removed ${candidate.name} (${candidate.role}) from the project team.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      console.error('Failed to remove member from project team:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const toggleBreakdown = (id: string) => {
    setExpandedBreakdown((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <AppLayout>
      <div className="space-y-6 devflow-page-enter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="size-6 text-purple-400 animate-pulse" />
              <span>Smart Team Matcher</span>
            </h1>
            <p className="text-xs text-slate-400">
              Role-Based Horizontal Shortlist Carousels & Algorithmic Team Recommendations
            </p>
          </div>

          {/* Project Selector Dropdown */}
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium shrink-0">Target Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-10 px-3 text-xs bg-[#0b0f19] border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 font-semibold cursor-pointer w-full sm:w-auto max-w-full"
            >
              {projects.map((p) => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.name} ({p.clientName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn shadow-lg shadow-emerald-950/40">
            <UserCheck className="size-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* PROJECT TEAM REQUIREMENTS SUMMARY HEADER CARD */}
        {selectedProjectObj && matcherResult && (
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-950 border border-purple-500/30 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <Building className="size-5 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-bold text-sm text-purple-200 tracking-wide uppercase truncate">
                    PROJECT TEAM REQUIREMENTS: {selectedProjectObj.name}
                  </h2>
                  {selectedProjectObj.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {selectedProjectObj.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Total Team Count Summary Badge */}
              <div className="flex items-center justify-between sm:justify-start gap-2 bg-[#060913] px-3.5 py-2 rounded-xl border border-purple-500/30 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Users className="size-4 text-purple-400" />
                  <span className="text-xs text-slate-300 font-medium">Current Team Size:</span>
                </div>
                <span className="text-white font-bold text-sm font-mono">
                  {projectMembers.length} / {matcherResult.totalRequiredCount}
                </span>
              </div>
            </div>

            {/* Role Requirements Pills */}
            <div className="flex flex-wrap gap-3">
              {matcherResult.roleCoverage.map((rc, idx) => {
                const currentRoleCount = projectMembers.filter((m: any) => {
                  const rLower = (m.role || '').toLowerCase();
                  if (rc.role.toLowerCase() === 'developer') {
                    return rLower.includes('developer') || rLower.includes('engineer') || rLower.includes('lead');
                  }
                  if (rc.role.toLowerCase() === 'qa') {
                    return rLower.includes('qa') || rLower.includes('tester') || rLower.includes('quality');
                  }
                  if (rc.role.toLowerCase() === 'designer') {
                    return rLower.includes('designer') || rLower.includes('ui') || rLower.includes('ux');
                  }
                  return rLower.includes(rc.role.toLowerCase());
                }).length;

                return (
                  <div key={idx} className="flex items-center">
                    <span className="text-xs font-bold text-sky-300 mr-2">{rc.role}:</span>
                    {renderRoleCoverageStatus(rc.requiredCount, currentRoleCount)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-xs gap-3 rounded-2xl bg-[#0b0f19] border border-slate-800">
            <Loader2 className="size-7 animate-spin text-purple-400" />
            <span className="font-medium text-slate-300">
              Generating role-grouped candidate carousels & calculating match vectors...
            </span>
          </div>
        ) : !matcherResult || matcherResult.roleGroupedRecommendations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-3 rounded-2xl bg-[#0b0f19] border border-amber-500/30">
            <AlertTriangle className="size-8 text-amber-400 mx-auto" />
            <p className="font-bold text-sm text-amber-300">No candidates available for this project.</p>
          </div>
        ) : (
          /* ROLE-BASED HORIZONTAL CAROUSELS LIST */
          <div className="space-y-8">
            {matcherResult.roleGroupedRecommendations.map((group) => (
              <RoleCarousel
                key={group.role}
                group={group}
                projectMembers={projectMembers}
                onAddCandidate={handleAddCandidate}
                onRemoveCandidate={handleRemoveCandidate}
                addingId={addingId}
                removingId={removingId}
                expandedBreakdown={expandedBreakdown}
                onToggleBreakdown={toggleBreakdown}
              />
            ))}
          </div>
        )}

        {/* EXCEED REQUIREMENT CONFIRMATION MODAL */}
        {exceedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-md max-h-[88dvh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-amber-500/40 p-4 sm:p-6 text-white shadow-2xl z-10">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                  <AlertCircle className="size-5 shrink-0" />
                  <span>Exceed Role Requirement?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setExceedCandidate(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 space-y-3 text-xs text-slate-300 my-3">
                <p>
                  The recommended requirement for{' '}
                  <strong className="text-white font-semibold">
                    {exceedCandidate.group.role}s ({exceedCandidate.group.requiredCount})
                  </strong>{' '}
                  is already fulfilled for project &quot;{selectedProjectObj?.name}&quot;.
                </p>
                <p className="text-slate-400">
                  Are you sure you want to add{' '}
                  <strong className="text-sky-300 font-bold">
                    {exceedCandidate.candidate.name} ({exceedCandidate.candidate.role})
                  </strong>{' '}
                  as an additional team member?
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setExceedCandidate(null)}
                  className="text-slate-400 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => executeAddMember(exceedCandidate.candidate)}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20"
                >
                  Confirm & Add Member
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
