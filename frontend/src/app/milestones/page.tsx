'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ArrowRight, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockMilestones } from '@/lib/mockData';
import { Milestone, MilestoneStatus, TeamMember } from '@/types';
import { projectApi } from '@/services/projectApi';

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>(mockMilestones);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    projectName: 'FinTech Nexus Suite',
    projectId: 'prj-101',
    description: '',
    status: 'Upcoming' as MilestoneStatus,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: 0,
    ownerName: 'Sarah Chen',
  });

  const loadMilestones = () => {
    projectApi
      .getMilestones()
      .then((data) => {
        if (data && data.length > 0) setMilestones(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadMilestones();
  }, []);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.projectName || !formData.dueDate) return;
    try {
      const owner: TeamMember = {
        id: 'tm-1',
        name: formData.ownerName,
        email: 'sarah.c@devflow.io',
        role: 'Project Manager',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        skills: ['Agile', 'Scrum'],
        assignedProjects: ['FinTech Nexus Suite'],
        workloadPercent: 78,
        availability: 'Available',
        performanceRating: 4.9,
        joinedDate: '2023-01-15',
      };

      await projectApi.createMilestone({
        title: formData.title,
        projectName: formData.projectName,
        projectId: formData.projectId,
        description: formData.description,
        status: formData.status,
        dueDate: formData.dueDate,
        startDate: new Date().toISOString().split('T')[0],
        progress: formData.progress,
        relatedTasksCount: 0,
        owner,
      });

      setIsModalOpen(false);
      setFormData({
        title: '',
        projectName: 'FinTech Nexus Suite',
        projectId: 'prj-101',
        description: '',
        status: 'Upcoming',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progress: 0,
        ownerName: 'Sarah Chen',
      });
      loadMilestones();
    } catch (err) {
      console.error('Failed to create milestone', err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Milestone Roadmap
            </h1>
            <p className="text-xs text-slate-400">
              Track project delivery targets, sprint completion dates, and key deliverable phase goals.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
          >
            <Plus className="size-4" />
            <span>Create Milestone</span>
          </Button>
        </div>

        {/* Create Milestone Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 space-y-4 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold">Create New Milestone</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMilestone} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Milestone Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Core Engine Beta Release"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. FinTech Nexus Suite"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    placeholder="Milestone scope and key deliverables..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Target Due Date</label>
                    <input
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-2 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as MilestoneStatus })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Achieved">Achieved</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Progress (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.progress}
                      onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Owner Name</label>
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                      placeholder="e.g. Sarah Chen"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-400 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white text-xs">
                    Save Milestone
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Milestone Timeline List */}
        <div className="space-y-4">
          {milestones.map((ms) => (
            <div
              key={ms.id}
              className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-800 hover:border-slate-700 transition-colors space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                      {ms.projectName}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        ms.status === 'Achieved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : ms.status === 'In Progress'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {ms.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{ms.title}</h3>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block uppercase">Target Date</span>
                    <span className="font-mono text-white font-bold">{ms.dueDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block uppercase">Linked Tasks</span>
                    <span className="font-mono text-sky-400 font-bold">{ms.relatedTasksCount || 0} Tasks</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{ms.description}</p>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Phase Completion</span>
                  <span className="text-white font-bold">{ms.progress}%</span>
                </div>
                <div className="w-full bg-[#060913] rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-sky-400 to-blue-600 h-full rounded-full"
                    style={{ width: `${ms.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-slate-400 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  {ms.owner?.avatar && (
                    <img src={ms.owner.avatar} alt={ms.owner.name} className="size-6 rounded-full object-cover" />
                  )}
                  <span>Owner: {ms.owner?.name || 'Sarah Chen'} ({ms.owner?.role || 'Project Manager'})</span>
                </div>

                <Link href={`/projects/${ms.projectId}`}>
                  <Button size="xs" variant="ghost" className="text-sky-400 hover:text-white gap-1">
                    <span>View Project</span>
                    <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
