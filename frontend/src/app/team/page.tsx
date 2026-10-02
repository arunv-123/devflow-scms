'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Plus, Star, Briefcase, Mail, CheckCircle2, AlertCircle, X, Send, Copy, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { TeamMember, UserRole } from '@/types';
import { usersApi } from '@/services/usersApi';

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const currentRole = currentUser?.role || 'Admin';

  const canInvite = ['Super Admin', 'Admin', 'Project Manager'].includes(currentRole);
  const canDelete = ['Super Admin', 'Admin'].includes(currentRole);

  const allowedRolesForInvite: UserRole[] =
    currentRole === 'Project Manager'
      ? ['Client']
      : currentRole === 'Admin'
      ? ['Admin', 'Project Manager', 'Team Lead', 'Developer', 'Designer', 'QA', 'Client']
      : ['Super Admin', 'Admin', 'Project Manager', 'Team Lead', 'Developer', 'Designer', 'QA', 'Client'];

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [invitationNotice, setInvitationNotice] = useState<{ email: string; name: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Modal form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(currentRole === 'Project Manager' ? 'Client' : 'Developer');
  const [department, setDepartment] = useState('Engineering');
  const [skills, setSkills] = useState('TypeScript, React, Node.js');
  const [error, setError] = useState('');

  const loadTeam = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getUsers({ search: searchTerm, role: roleFilter });
      setTeam(data);
    } catch (err) {
      console.error('Failed to load team', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [searchTerm, roleFilter]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);

    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const result = await usersApi.inviteUser({
        name,
        email,
        role,
        department,
        skills: skillsArray,
      });

      if (result.invitationUrl) {
        setInvitationNotice({ email, name, url: result.invitationUrl });
      }

      setShowAddModal(false);
      setName('');
      setEmail('');
      await loadTeam();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to invite team member');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResendInvitation = async (member: TeamMember) => {
    try {
      const result = await usersApi.resendInvitation(member.id);
      if (result.invitationUrl) {
        setInvitationNotice({ email: member.email, name: member.name, url: result.invitationUrl });
      } else {
        alert(`Invitation resent to ${member.email}`);
      }
      await loadTeam();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (member: TeamMember) => {
    if (!confirm(`Are you sure you want to cancel the invitation for ${member.name}?`)) return;
    try {
      await usersApi.cancelInvitation(member.id);
      await loadTeam();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel invitation');
    }
  };

  const handleDeleteMember = async (id: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;
    try {
      await usersApi.deleteUser(id);
      await loadTeam();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTeam = team.filter((m) => {
    if (statusFilter === 'All') return true;
    const memberStatus = m.status || 'active';
    return memberStatus === statusFilter;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Team Directory & Onboarding
            </h1>
            <p className="text-xs text-slate-400">
              Manage workspace access, pending account invitations, user roles, and skills matrix.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/workload">
              <Button size="sm" variant="outline" className="border-sky-500/30 text-sky-300 text-xs">
                Workload Matrix
              </Button>
            </Link>
            {canInvite && (
              <Button
                size="sm"
                onClick={() => {
                  setRole(currentRole === 'Project Manager' ? 'Client' : 'Developer');
                  setShowAddModal(true);
                }}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
              >
                <Send className="size-3.5" />
                <span>Invite User</span>
              </Button>
            )}
          </div>
        </div>

        {/* Development Invitation Banner Notice */}
        {invitationNotice && (
          <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Invitation Generated for {invitationNotice.name} ({invitationNotice.email})
              </span>
              <button
                onClick={() => setInvitationNotice(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              In development mode, share this secure activation link with the user to let them create a password:
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={invitationNotice.url}
                className="w-full h-8 px-3 rounded bg-[#060913] border border-slate-800 text-[11px] font-mono text-sky-300 focus:outline-none"
              />
              <Button
                size="xs"
                onClick={() => handleCopyUrl(invitationNotice.url)}
                className="bg-sky-600 hover:bg-sky-500 text-white text-[11px] gap-1 shrink-0"
              >
                <Copy className="size-3" />
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="p-4 rounded-xl bg-[#0b0f19] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="invited">Pending Invitation</option>
              <option value="disabled">Disabled</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="All">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Team Lead">Team Lead</option>
              <option value="Developer">Developer</option>
              <option value="Designer">Designer</option>
              <option value="QA">QA</option>
              <option value="Client">Client</option>
            </select>
          </div>
        </div>

        {/* Loading / Team Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading team directory...</div>
        ) : filteredTeam.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            No team members found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeam.map((member) => {
              const status = member.status || 'active';
              return (
                <div
                  key={member.id}
                  className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 hover:border-slate-700 transition-colors space-y-4 flex flex-col justify-between relative"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={member.name}
                          className="size-12 rounded-xl object-cover ring-2 ring-sky-500/30"
                        />
                        <div>
                          <h3 className="text-base font-bold text-white">{member.name}</h3>
                          <span className="text-xs font-semibold text-sky-400">{member.role}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Account Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : status === 'invited'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {status === 'active' ? 'Active' : status === 'invited' ? 'Invited' : 'Disabled'}
                        </span>
                        {canDelete && !(currentRole === 'Admin' && member.role === 'Super Admin') && (
                          <button
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/10"
                            title="Remove Member"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      {member.email}
                    </div>

                    {/* Pending Invitation Actions */}
                    {status === 'invited' && (
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                        <span className="text-[11px] text-amber-300 font-medium block">
                          Invitation pending password creation.
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="xs"
                            onClick={() => handleResendInvitation(member)}
                            className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-[10px] gap-1"
                          >
                            <RefreshCw className="size-3" />
                            <span>Resend Invitation</span>
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleCancelInvitation(member)}
                            className="text-slate-400 hover:text-rose-400 text-[10px]"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs text-amber-400">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold">{member.performanceRating || 5.0} / 5.0 Rating</span>
                    </div>

                    {/* Skills Matrix */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Skills Matrix</span>
                      <div className="flex flex-wrap gap-1">
                        {(member.skills || ['TypeScript', 'React']).map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-[#060913] text-slate-300 border border-slate-800 font-mono">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Workload Progress Bar */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Current Workload</span>
                      <span className={`font-bold ${(member.workloadPercent || 0) > 85 ? 'text-red-400' : 'text-sky-400'}`}>
                        {member.workloadPercent || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-[#060913] rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          (member.workloadPercent || 0) > 85 ? 'bg-red-500' : 'bg-sky-400'
                        }`}
                        style={{ width: `${member.workloadPercent || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Invite Member Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Invite Team Member</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X className="size-4" />
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleInviteMember} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    required
                    className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. elena@company.com"
                    required
                    className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      {allowedRolesForInvite.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 text-[11px] text-slate-400">
                  <span>An invitation token will be generated. The invited user will create their password upon opening their invitation link.</span>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddModal(false)}
                    className="text-xs text-slate-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitLoading}
                    className="bg-sky-600 hover:bg-sky-500 text-white text-xs px-4 gap-1.5"
                  >
                    <Send className="size-3.5" />
                    <span>{submitLoading ? 'Generating...' : 'Send Invitation'}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
