'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, Search, Trash2, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { DocumentItem } from '@/types';
import { documentsApi } from '@/services/documentsApi';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Requirement' | 'Architecture' | 'Contract' | 'Design' | 'Report'>('Architecture');
  const [projectName, setProjectName] = useState('FinTech Nexus');
  const [size, setSize] = useState('2.4 MB');
  const [fileType, setFileType] = useState('PDF');
  const [error, setError] = useState('');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentsApi.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);

    try {
      await documentsApi.createDocument({
        name,
        category,
        projectName,
        size,
        fileType,
      });

      setShowUploadModal(false);
      setName('');
      await loadDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentsApi.deleteDocument(id);
      await loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete document');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Document Repository</h1>
            <p className="text-xs text-slate-400">Architecture specifications, master contracts, requirements, and design deliverables.</p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowUploadModal(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
          >
            <Plus className="size-4" />
            <span>Upload Document</span>
          </Button>
        </div>

        <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading document repository...</div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">No documents found.</div>
          ) : (
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
                {documents.map((doc) => (
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
                    <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                      <Button size="xs" variant="ghost" className="text-sky-400 gap-1">
                        <Download className="size-3" />
                        <span>Download</span>
                      </Button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Upload Document</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                  <X className="size-4" />
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Document Title</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Master Service Agreement v1.0.pdf"
                    required
                    className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="Architecture">Architecture</option>
                      <option value="Requirement">Requirement</option>
                      <option value="Contract">Contract</option>
                      <option value="Design">Design</option>
                      <option value="Report">Report</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Project Name</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                      className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">File Type</label>
                    <input
                      type="text"
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value)}
                      className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">File Size</label>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowUploadModal(false)}
                    className="text-xs text-slate-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitLoading}
                    className="bg-sky-600 hover:bg-sky-500 text-white text-xs px-4"
                  >
                    {submitLoading ? 'Uploading...' : 'Save Document'}
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
