/**
 * services/api.js — Axios instance with JWT interceptors + all service calls
 */
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "/api";

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60000, // 60s for AI operations
});

// ── Request interceptor: attach JWT token ─────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICES
// ─────────────────────────────────────────────────────────────────────────────
export const authService = {
  // Register new user
  register: (data) => api.post("/auth/register", data),

  // Login
  login: (data) => api.post("/auth/login", data),

  // Get current logged-in user
  getMe: () => api.get("/auth/me"),

  // Update profile (name / password)
  updateProfile: (data) => api.put("/auth/profile", data),
};

// ─────────────────────────────────────────────────────────────────────────────
// AI SERVICES
// ─────────────────────────────────────────────────────────────────────────────
export const aiService = {
  // Generate resume
  generateResume: (data) => api.post("/ai/generate-resume", data),

  // Improve existing resume content
  improveResume: (data) => api.post("/ai/improve-resume", data),

  // Chat with AI career assistant
  chat: (data) => api.post("/ai/chat", data),

  // Parse / import uploaded resume file (PDF, DOC, TXT) — using fetch for reliable file upload
  parseResume: async (file) => {
    const formData = new FormData();
    formData.append('resume', file, file.name);

    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/ai/parse-resume`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      const err = new Error(errorData.error || 'Upload failed');
      err.response = { data: errorData, status: response.status };
      throw err;
    }

    const data = await response.json();
    return { data };
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// HISTORY SERVICES
// ─────────────────────────────────────────────────────────────────────────────
export const historyService = {
  // ── Resumes ──
  // Get all resumes (supports ?search=&template= query params)
  getResumes: (params) => api.get("/history/resumes", { params }),

  // Get single resume by ID
  getResumeById: (id) => api.get(`/history/resumes/${id}`),

  // Update resume (title, template, inputData, generatedContent)
  updateResume: (id, data) => api.put(`/history/resumes/${id}`, data),

  // Delete resume by ID
  deleteResume: (id) => api.delete(`/history/resumes/${id}`),

  // ── Chats ──
  // Get all chat sessions (supports ?search= query param)
  getChats: (params) => api.get("/history/chats", { params }),

  // Get single chat session with all messages
  getChatById: (id) => api.get(`/history/chats/${id}`),

  // Delete chat session by ID
  deleteChat: (id) => api.delete(`/history/chats/${id}`),

  // ── Stats ──
  // Get dashboard stats (total resumes, chats, template usage, recent resumes)
  getStats: () => api.get("/history/stats"),
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN SERVICES (admin role only)
// ─────────────────────────────────────────────────────────────────────────────
export const adminService = {
  // Get admin dashboard (totals, this week stats, recent users + resumes)
  getDashboard: () => api.get("/admin/dashboard"),

  // Get all users (supports ?search=&page=&limit= query params)
  getUsers: (params) => api.get("/admin/users", { params }),

  // Update user role ('user' or 'admin')
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),

  // Delete user + all their data
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export default api;
