import axios from 'axios';

const API_URL = 'http://localhost:8000/api/programs/';

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

const programService = {
  // Get all departments
  getDepartments: async () => {
    const response = await api.get('departments/');
    return response.data;
  },

  // Get all programs with filters
  getPrograms: async (params = {}) => {
    const response = await api.get('', { params });
    return response.data;
  },

  // Get single program details
  getProgram: async (id) => {
    const response = await api.get(`${id}/`);
    return response.data;
  },

  // Get required documents for a program
  getProgramDocuments: async (programId) => {
    const response = await api.get(`${programId}/documents/`);
    return response.data;
  },

 
  createProgram: async (programData) => {
    try {
      console.log('Creating program with data:', programData);
      const response = await api.post('create/', programData);
      return response.data;
    } catch (error) {
      console.error('Error creating program:', error.response?.data);
      throw error;
    }
  },

  // Update program (admin only)
  updateProgram: async (id, programData) => {
    try {
      console.log('Updating program with data:', programData);
      const response = await api.put(`${id}/update/`, programData);
      return response.data;
    } catch (error) {
      console.error('Error updating program:', error.response?.data);
      throw error;
    }
  },
  deleteProgram: async (id) => {
    try {
      console.log('Deleting program:', id);
      const response = await api.delete(`${id}/delete/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting program:', error.response?.data);
      throw error;
    }
  },

  // Document requirements management
  createDocumentRequirement: async (reqData) => {
    try {
      const response = await api.post('documents/create/', reqData);
      return response.data;
    } catch (error) {
      console.error('Error creating document requirement:', error.response?.data);
      throw error;
    }
  },

  updateDocumentRequirement: async (id, reqData) => {
    try {
      const response = await api.put(`documents/${id}/`, reqData);
      return response.data;
    } catch (error) {
      console.error('Error updating document requirement:', error.response?.data);
      throw error;
    }
  },

  deleteDocumentRequirement: async (id) => {
    try {
      const response = await api.delete(`documents/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting document requirement:', error.response?.data);
      throw error;
    }
  },
};

export default programService;
