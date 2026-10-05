'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Plus, Search, Trash2, X, UploadCloud, Loader2, FileCheck, DownloadCloud } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { DocumentItem, Project } from '@/types';
import { documentsApi } from '@/services/documentsApi';
import { projectApi } from '@/services/projectApi';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { ConfirmModal } from '@/components/ui/confirm-modal';

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function deriveFileType(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    const ext = parts.pop()!.toUpperCase();
    if (ext === 'FIG') return 'FIGMA';
    return ext;
  }
  return 'FILE';
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const role = user?.role || 'Admin';

  const canDeleteDocument = ['Super Admin', 'Admin', 'Project Manager'].includes(role);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Requirement' | 'Architecture' | 'Contract' | 'Design' | 'Report'>('Architecture');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [customProjectName, setCustomProjectName] = useState('');
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => Promise<void> | void;
    loading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsData, prjsData] = await Promise.all([
        documentsApi.getDocuments(),
        projectApi.getProjects().catch(() => []),
      ]);
      setDocuments(docsData);
      setProjects(prjsData);
      if (prjsData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(prjsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load documents data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError('');
    // Auto fill name if empty
    if (!name.trim()) {
      setName(file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!name.trim()) {
      setError('Document title is required');
      return;
    }

    let targetProjectName = customProjectName.trim();
    let targetProjectId = '';

    if (selectedProjectId && selectedProjectId !== 'custom') {
      const foundPrj = projects.find((p) => p.id === selectedProjectId);
      if (foundPrj) {
        targetProjectName = foundPrj.name;
        targetProjectId = foundPrj.id;
      }
    }

    if (!targetProjectName) {
      setError('Project selection or project name is required');
      return;
    }

    setError('');
    setSubmitLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', name.trim());
      formData.append('category', category);
      formData.append('projectName', targetProjectName);
      if (targetProjectId) {
        formData.append('projectId', targetProjectId);
      }

      await documentsApi.uploadDocument(formData);

      addToast({
        type: 'success',
        title: 'Document Uploaded',
        message: `"${name.trim()}" uploaded successfully.`,
      });

      setShowUploadModal(false);
      setSelectedFile(null);
      setName('');
      setCustomProjectName('');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    setDownloadingId(doc.id);
    try {
      await documentsApi.downloadDocument(doc.id, doc.originalFilename || doc.name);
      addToast({
        type: 'success',
        title: 'Download Started',
        message: `Downloading "${doc.originalFilename || doc.name}"`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: err.response?.data?.error || 'Could not download the file',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = (doc: DocumentItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Document',
      message: `Are you sure you want to delete "${doc.name}"? The stored file will be permanently removed.`,
      confirmText: 'Delete Document',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await documentsApi.deleteDocument(doc.id);
          addToast({
            type: 'success',
            title: 'Document Deleted',
            message: `"${doc.name}" deleted successfully.`,
          });
          await loadData();
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Deletion Failed',
            message: err.response?.data?.error || 'Failed to delete document',
          });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        }
      },
    });
  };

  const handleExportCSV = () => {
    if (filteredDocuments.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Documents',
        message: 'No documents available to export.',
      });
      return;
    }
    documentsApi.exportDocumentsCSV(filteredDocuments);
    addToast({
      type: 'success',
      title: 'Export Started',
      message: `Exported ${filteredDocuments.length} document records to CSV.`,
    });
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Document Repository</h1>
            <p className="text-xs text-slate-400">
              Architecture specifications, master contracts, requirements, and design deliverables.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              disabled={documents.length === 0}
              className="border-slate-800 text-slate-300 hover:text-white text-xs gap-1.5"
            >
              <DownloadCloud className="size-3.5" />
              <span>Export CSV</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setShowUploadModal(true)}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-md shadow-sky-600/20"
            >
              <Plus className="size-4" />
              <span>Upload Document</span>
            </Button>
          </div>
        </div>

        {/* Toolbar Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-[#0b0f19] border border-slate-800 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search documents or projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#060913] border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-slate-400 text-xs shrink-0">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 text-xs cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Architecture">Architecture</option>
              <option value="Requirement">Requirement</option>
              <option value="Contract">Contract</option>
              <option value="Design">Design</option>
              <option value="Report">Report</option>
            </select>
          </div>
        </div>

        {/* Document Table */}
        <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-sky-400" />
              <span>Loading document repository...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              {documents.length === 0 ? 'No documents uploaded yet.' : 'No documents match your filter criteria.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <FileText className="size-4 text-sky-400 shrink-0" />
                        <span className="truncate max-w-xs" title={doc.name}>
                          {doc.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#060913] border border-slate-800 text-sky-300 font-semibold">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{doc.projectName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{doc.size}</td>
                      <td className="py-3.5 px-4">{doc.uploadedBy}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{doc.uploadDate}</td>
                      <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                          className="text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 gap-1"
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Download className="size-3" />
                          )}
                          <span>Download</span>
                        </Button>
                        {canDeleteDocument && (
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Real File Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-6 text-white shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <h3 className="text-base font-bold text-white">Upload Document</h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setError('');
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              {error && (
                <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs shrink-0">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpload} className="flex flex-col min-h-0 overflow-hidden mt-3">
                <div className="overflow-y-auto pr-1 space-y-3.5 text-xs">
                  {/* File Dropzone / Picker */}
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Select File</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {!selectedFile ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
                          isDragOver
                            ? 'border-sky-500 bg-sky-500/10'
                            : 'border-slate-800 bg-[#060913] hover:border-slate-700'
                        }`}
                      >
                        <div className="size-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400">
                          <UploadCloud className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            Click to choose file <span className="text-slate-500 font-normal">or drag & drop</span>
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            PDF, DOCX, XLSX, FIG, PNG, JPG, ZIP (max 50MB)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[#060913] border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                            <FileCheck className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {deriveFileType(selectedFile.name)} • {formatBytes(selectedFile.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
                          title="Remove file"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Document Title */}
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

                  {/* Category & Project */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                      >
                        <option value="Architecture">Architecture</option>
                        <option value="Requirement">Requirement</option>
                        <option value="Contract">Contract</option>
                        <option value="Design">Design</option>
                        <option value="Report">Report</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Project</label>
                      {projects.length > 0 ? (
                        <select
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                        >
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                          <option value="custom">+ Other Project Name</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={customProjectName}
                          onChange={(e) => setCustomProjectName(e.target.value)}
                          placeholder="e.g. FinTech Nexus"
                          required
                          className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                        />
                      )}
                    </div>
                  </div>

                  {selectedProjectId === 'custom' && projects.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Custom Project Name</label>
                      <input
                        type="text"
                        value={customProjectName}
                        onChange={(e) => setCustomProjectName(e.target.value)}
                        placeholder="e.g. HealthPulse Mobile Platform"
                        required
                        className="w-full h-9 px-3 bg-[#060913] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0 mt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setError('');
                    }}
                    className="text-xs text-slate-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitLoading || !selectedFile || !name.trim()}
                    className="bg-sky-600 hover:bg-sky-500 text-white text-xs px-4 disabled:opacity-50 gap-1.5"
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <span>Upload Document</span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reusable Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          confirmVariant={confirmModal.confirmVariant}
          loading={confirmModal.loading}
        />
      </div>
    </AppLayout>
  );
}
