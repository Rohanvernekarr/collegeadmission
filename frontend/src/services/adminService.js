import axios from 'axios';

const API_URL = 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const adminService = {
  // User Management
  getUsers: async (params = {}) => {
    const response = await api.get('auth/admin/users/', { params });
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`auth/admin/users/${id}/`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('auth/admin/users/create/', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`auth/admin/users/${id}/`, userData);
    return response.data;
  },

  toggleUserStatus: async (id) => {
    const response = await api.post(`auth/admin/users/${id}/toggle-status/`);
    return response.data;
  },

  getUserStatistics: async () => {
    const response = await api.get('auth/admin/users/statistics/');
    return response.data;
  },

  // Department Management
  createDepartment: async (deptData) => {
    const response = await api.post('programs/departments/create/', deptData);
    return response.data;
  },

  updateDepartment: async (id, deptData) => {
    const response = await api.put(`programs/departments/${id}/update/`, deptData);
    return response.data;
  },

  deleteDepartment: async (id) => {
    const response = await api.delete(`programs/departments/${id}/delete/`);
    return response.data;
  },

  getDepartmentStatistics: async () => {
    const response = await api.get('programs/departments/statistics/');
    return response.data;
  },
};

export default adminService;
