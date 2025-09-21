import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth/';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to include token
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

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}token/refresh/`, {
            refresh: refreshToken
          });
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const authService = {
  register: async (userData) => {
    const response = await api.post('register/', userData);
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (credentials) => {
    // If a role is provided in credentials, route to the role-specific login endpoint
    // Backend exposes: admin/login/ and officer/login/ plus general login/
    let endpoint = 'login/';
    if (credentials && credentials.role) {
      const role = String(credentials.role).toLowerCase();
      if (role === 'admin' || role === 'administrator') endpoint = 'admin/login/';
      if (role === 'officer' || role === 'admission_officer') endpoint = 'officer/login/';
      // Remove role before sending payload to avoid backend confusion
      credentials = { ...credentials };
      delete credentials.role;
    }

    const response = await api.post(endpoint, credentials);
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  verifyEmail: async ({ email, otp }) => {
    const response = await api.post('verify-email/', { email, otp });
    return response.data;
  },

  resendOtp: async ({ email }) => {
    const response = await api.post('resend-otp/', { email });
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      if (refreshToken) {
        await api.post('logout/', { refresh: refreshToken });
      }
    } catch (error) {
      // Best-effort server logout; ignore errors and proceed to clear client state
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  }
};

export default authService;
