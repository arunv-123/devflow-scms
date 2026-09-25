'use client';

import React from 'react';
import { FileText, Download, Plus, Search, HardDrive } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { mockDocuments } from '@/lib/mockData';

export default function DocumentsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Document Repository</h1>
            <p className="text-xs text-slate-400">Architecture specifications, master contracts, requirements, and design deliverables.</p>
          </div>
          <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20">
            <Plus className="size-4" />
            <span>Upload Document</span>
          </Button>
        </div>

        <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#060913] border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {mockDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <FileText className="size-4 text-sky-400" />
                    <span>{doc.name}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#060913] border border-slate-800 text-sky-300 font-semibold">
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{doc.projectName}</td>
                  <td className="py-3.5 px-4 font-mono">{doc.size}</td>
                  <td className="py-3.5 px-4">{doc.uploadedBy}</td>
                  <td className="py-3.5 px-4 font-mono">{doc.uploadDate}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Button size="xs" variant="ghost" className="text-sky-400 gap-1">
                      <Download className="size-3" />
                      <span>Download</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
