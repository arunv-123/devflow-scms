import { api } from './api';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'project' | 'task' | 'lead' | 'client' | 'milestone' | 'meeting' | 'team';
  avatar?: string;
  url: string;
}

export interface SearchResultsGrouped {
  projects: SearchResultItem[];
  tasks: SearchResultItem[];
  leads: SearchResultItem[];
  clients: SearchResultItem[];
  milestones: SearchResultItem[];
  meetings: SearchResultItem[];
  team: SearchResultItem[];
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResultsGrouped;
}

export const searchApi = {
  async globalSearch(query: string): Promise<SearchResponse> {
    if (!query || query.trim().length === 0) {
      return {
        query: '',
        total: 0,
        results: {
          projects: [],
          tasks: [],
          leads: [],
          clients: [],
          milestones: [],
          meetings: [],
          team: [],
        },
      };
    }
    const response = await api.get<SearchResponse>(`/search`, {
      params: { q: query.trim() },
    });
    return response.data;
  },
};
