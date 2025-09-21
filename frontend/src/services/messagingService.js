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

const messagingService = {
  // Conversation management
  getConversations: async () => {
    const response = await api.get('messaging/conversations/');
    return response.data;
  },

  getConversation: async (conversationId) => {
    const response = await api.get(`messaging/conversations/${conversationId}/`);
    return response.data;
  },

  createConversation: async (conversationData) => {
    const response = await api.post('messaging/conversations/', conversationData);
    return response.data;
  },

  updateConversation: async (conversationId, data) => {
    const response = await api.patch(`messaging/conversations/${conversationId}/`, data);
    return response.data;
  },

  // Message management
  getMessages: async (conversationId, params = {}) => {
    const response = await api.get(`messaging/conversations/${conversationId}/messages/`, { params });
    return response.data;
  },

  sendMessage: async (conversationId, messageData) => {
    const response = await api.post(`messaging/conversations/${conversationId}/messages/`, messageData);
    return response.data;
  },

  markMessageAsRead: async (messageId) => {
    const response = await api.post(`messaging/messages/${messageId}/read/`);
    return response.data;
  },

  // Utility functions
  getMessagingStats: async () => {
    const response = await api.get('messaging/stats/');
    return response.data;
  },

  getAvailableApplicants: async () => {
    const response = await api.get('messaging/applicants/');
    return response.data;
  },

  // Helper functions for real-time updates (can be extended with WebSocket)
  pollForNewMessages: async (conversationId, lastMessageId) => {
    const response = await api.get(`messaging/conversations/${conversationId}/messages/`, {
      params: { since: lastMessageId }
    });
    return response.data;
  },
};

export default messagingService;