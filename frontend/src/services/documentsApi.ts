import { api } from './api';
import { DocumentItem } from '@/types';

export const documentsApi = {
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await api.get<{ success: boolean; documents: DocumentItem[] }>('/documents');
    return res.data.documents;
  },

  async createDocument(data: Partial<DocumentItem>): Promise<DocumentItem> {
    const res = await api.post<{ success: boolean; document: DocumentItem }>('/documents', data);
    return res.data.document;
  },

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
