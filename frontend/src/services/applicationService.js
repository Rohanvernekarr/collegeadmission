import axios from 'axios';

const API_URL = 'http://localhost:8000/api/applications/';

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
});

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

const applicationService = {
  // Get user's applications
  getApplications: async () => {
    const response = await api.get('');
    return response.data;
  },

  // Get single application details
  getApplication: async (id) => {
    const response = await api.get(`${id}/`);
    return response.data;
  },

  // Create new application
  createApplication: async (applicationData) => {
    const response = await api.post('create/', applicationData);
    return response.data;
  },

  // Update application
  updateApplication: async (id, applicationData) => {
    const response = await api.put(`${id}/`, applicationData);
    return response.data;
  },

  // Submit application
  submitApplication: async (id) => {
    const response = await api.patch(`${id}/submit/`);
    return response.data;
  },

  // Upload document
  uploadDocument: async (formData) => {
    const response = await api.post('documents/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update application status (admin/officer only)
  updateStatus: async (id, statusData) => {
    const response = await api.post(`${id}/status/`, statusData);
    return response.data;
  },
};

export default applicationService;
