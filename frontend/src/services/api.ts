import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token fallback if present
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('devflow_auth_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.warn('[DevFlow API] Rate limit hit (HTTP 429). User session preserved.');
      (error as any).isRateLimit = true;
    }
    // Clean up stale token on 401 Unauthorized if invalid or expired
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const errMsg = error.response?.data?.error || '';
      if (
        errMsg.includes('Invalid or expired token') ||
        errMsg.includes('no longer exists') ||
        errMsg.includes('Not authenticated')
      ) {
        localStorage.removeItem('devflow_auth_token');
      }
    }
    return Promise.reject(error);
  }
);
