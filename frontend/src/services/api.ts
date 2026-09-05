import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to inject JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentflow_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor to handle unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agentflow_token');
      localStorage.removeItem('agentflow_user');
    }
    return Promise.reject(error);
  }
);

export default api;

// ==========================================
// API Helper Endpoints
// ==========================================

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getProfile: () => api.get('/profile'),
  updateProfile: (data: any) => api.put('/profile', data),
};

export const goalsApi = {
  list: (status?: string) => api.get('/goals', { params: { status } }),
  get: (id: string) => api.get(`/goals/${id}`),
  create: (data: any) => api.post('/goals', data),
  analyze: (id: string) => api.post(`/goals/${id}/analyze`),
  answerMissing: (id: string, answers: any) => api.post(`/goals/${id}/answers`, answers),
  createPlan: (id: string) => api.post(`/goals/${id}/create-plan`),
};

export const workflowsApi = {
  list: () => api.get('/workflows'),
  get: (id: string) => api.get(`/workflows/${id}`),
  getGraph: (id: string) => api.get(`/workflows/${id}/graph`),
  executeNext: (id: string) => api.post(`/workflows/${id}/execute-next`),
  runAll: (id: string) => api.post(`/workflows/${id}/run`),
  pause: (id: string) => api.post(`/workflows/${id}/pause`),
};

export const careerApi = {
  jobMatch: (data: any) => api.post('/career/job-match', data),
  companyResearch: (data: any) => api.post('/career/company-research', data),
  startInterview: (data: any) => api.post('/career/interview/start', data),
  evaluateInterview: (data: any) => api.post('/career/interview/evaluate', data),
  getInterview: (id: string) => api.get(`/career/interview/${id}`),
  listApplications: (params?: any) => api.get('/career/applications', { params }),
  createApplication: (data: any) => api.post('/career/applications', data),
  updateApplication: (id: string, data: any) => api.patch(`/career/applications/${id}`, data),
  deleteApplication: (id: string) => api.delete(`/career/applications/${id}`),
};

export const startupApi = {
  generatePersona: (data: any) => api.post('/startup/customer-persona', data),
  generateCompetitors: (data: any) => api.post('/startup/competitor-matrix', data),
  generateBusinessModel: (data: any) => api.post('/startup/business-model', data),
  generateMVPRoadmap: (data: any) => api.post('/startup/mvp-roadmap', data),
  listVentures: (goalId?: string) => api.get('/startup/ventures', { params: { goalId } }),
  getVenture: (id: string) => api.get(`/startup/ventures/${id}`),
  createVenture: (data: any) => api.post('/startup/ventures', data),
  updateVenture: (id: string, data: any) => api.patch(`/startup/ventures/${id}`, data),
  deleteVenture: (id: string) => api.delete(`/startup/ventures/${id}`),
};

export const knowledgeApi = {
  listDocuments: (params?: any) => api.get('/knowledge/documents', { params }),
  getDocument: (id: string) => api.get(`/knowledge/documents/${id}`),
  ingestDocument: (data: any) => api.post('/knowledge/documents', data),
  deleteDocument: (id: string) => api.delete(`/knowledge/documents/${id}`),
  queryKnowledge: (data: any) => api.post('/knowledge/query', data),
  getMemoryContext: (params?: any) => api.get('/knowledge/memory', { params }),
};

export const toolsApi = {
  list: () => api.get('/tools'),
  execute: (data: any) => api.post('/tools/execute', data),
};

export const approvalsApi = {
  list: (status?: string) => api.get('/approvals', { params: { status } }),
  get: (id: string) => api.get(`/approvals/${id}`),
  approve: (id: string, data?: any) => api.post(`/approvals/${id}/approve`, data),
  reject: (id: string, data?: any) => api.post(`/approvals/${id}/reject`, data),
};

export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getAgents: () => api.get('/analytics/agents'),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
};

export const agentsApi = {
  list: () => api.get('/agents'),
  get: (id: string) => api.get(`/agents/${id}`),
};

export const assistantApi = {
  chat: (data: { message: string; history?: any[] }) => api.post('/assistant/chat', data),
};
