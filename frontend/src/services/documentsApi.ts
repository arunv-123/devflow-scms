import { api } from './api';
import { DocumentItem } from '@/types';

export const documentsApi = {
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await api.get<{ success: boolean; documents: DocumentItem[] }>('/documents');
    return res.data.documents;
  },

  async uploadDocument(formData: FormData): Promise<DocumentItem> {
    const res = await api.post<{ success: boolean; document: DocumentItem }>('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.document;
  },

  async downloadDocument(id: string, filename: string): Promise<void> {
    const res = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });

    const contentType = (res.headers['content-type'] as string) || 'application/octet-stream';
    const blob = new Blob([res.data], {
      type: contentType,
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },

  exportDocumentsCSV(documents: DocumentItem[]): void {
    if (!documents || documents.length === 0) return;

    const headers = ['Document Name', 'Category', 'Project', 'File Type', 'Size', 'Uploaded By', 'Upload Date'];
    const rows = documents.map((doc) => [
      `"${(doc.name || '').replace(/"/g, '""')}"`,
      `"${(doc.category || '').replace(/"/g, '""')}"`,
      `"${(doc.projectName || '').replace(/"/g, '""')}"`,
      `"${(doc.fileType || '').replace(/"/g, '""')}"`,
      `"${(doc.size || '').replace(/"/g, '""')}"`,
      `"${(doc.uploadedBy || '').replace(/"/g, '""')}"`,
      `"${(doc.uploadDate || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DevFlow_Documents_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
