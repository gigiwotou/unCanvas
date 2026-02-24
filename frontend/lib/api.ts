import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  getProfile: () => api.get('/auth/profile'),
};

export const usersApi = {
  findAll: () => api.get('/users'),
  findOne: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
};

export const workspacesApi = {
  create: (data: any) => api.post('/workspaces', data),
  findAll: () => api.get('/workspaces'),
  findOne: (id: string) => api.get(`/workspaces/${id}`),
  update: (id: string, data: any) => api.patch(`/workspaces/${id}`, data),
  remove: (id: string) => api.delete(`/workspaces/${id}`),
  getMembers: (id: string) => api.get(`/workspaces/${id}/members`),
  addMember: (id: string, data: any) => api.post(`/workspaces/${id}/members`, data),
  removeMember: (id: string, userId: string) => api.delete(`/workspaces/${id}/members/${userId}`),
};

export const canvasApi = {
  create: (workspaceId: string, data: any) =>
    api.post(`/workspaces/${workspaceId}/canvases`, data),
  findAllByWorkspace: (workspaceId: string) =>
    api.get(`/workspaces/${workspaceId}/canvases`),
  findOne: (id: string) => api.get(`/canvases/${id}`),
  update: (id: string, data: any) => api.patch(`/canvases/${id}`, data),
  remove: (id: string) => api.delete(`/canvases/${id}`),
  getFullData: (id: string) => api.get(`/canvases/${id}/full`),
  createStoryboard: (data: any) => api.post('/storyboards', data),
  findStoryboards: (canvasId: string) => api.get(`/canvases/${canvasId}/storyboards`),
  updateStoryboard: (id: string, data: any) => api.patch(`/storyboards/${id}`, data),
  removeStoryboard: (id: string) => api.delete(`/storyboards/${id}`),
  createCard: (data: any) => api.post('/cards', data),
  findCards: (storyboardId: string) => api.get(`/storyboards/${storyboardId}/cards`),
  updateCard: (id: string, data: any) => api.patch(`/cards/${id}`, data),
  removeCard: (id: string) => api.delete(`/cards/${id}`),
};

export const modelsApi = {
  createConfig: (data: any) => api.post('/models/configs', data),
  findAllConfigs: () => api.get('/models/configs'),
  findConfig: (id: string) => api.get(`/models/configs/${id}`),
  updateConfig: (id: string, data: any) => api.patch(`/models/configs/${id}`, data),
  deleteConfig: (id: string) => api.delete(`/models/configs/${id}`),
  generateStoryboard: (data: any) => api.post('/models/generate-storyboard', data),
  generateImage: (data: any) => api.post('/models/generate-image', data),
  modifyImage: (data: any) => api.post('/models/modify-image', data),
};

export const uploadApi = {
  uploadBase64: (data: string, type: 'character' | 'scene' | 'generated') =>
    api.post('/upload/base64', { data, type }),
  uploadFromUrl: (url: string, type: string) =>
    api.post('/upload/url', { url, type }),
};

export default api;
