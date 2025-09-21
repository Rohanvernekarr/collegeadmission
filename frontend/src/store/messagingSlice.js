import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import messagingService from '../services/messagingService';

// Async thunks
export const fetchConversations = createAsyncThunk(
  'messaging/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messagingService.getConversations();
      return response.results || response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchConversation = createAsyncThunk(
  'messaging/fetchConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await messagingService.getConversation(conversationId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversation');
    }
  }
);

export const createConversation = createAsyncThunk(
  'messaging/createConversation',
  async (conversationData, { rejectWithValue }) => {
    try {
      const response = await messagingService.createConversation(conversationData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create conversation');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messaging/sendMessage',
  async ({ conversationId, messageData }, { rejectWithValue }) => {
    try {
      const response = await messagingService.sendMessage(conversationId, messageData);
      return { conversationId, message: response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const fetchMessagingStats = createAsyncThunk(
  'messaging/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messagingService.getMessagingStats();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messaging stats');
    }
  }
);

export const fetchAvailableApplicants = createAsyncThunk(
  'messaging/fetchAvailableApplicants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messagingService.getAvailableApplicants();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch applicants');
    }
  }
);

const initialState = {
  conversations: [],
  currentConversation: null,
  availableApplicants: [],
  stats: {
    total_conversations: 0,
    unread_messages: 0,
  },
  loading: false,
  error: null,
  sendingMessage: false,
};

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
    },
    addMessageToConversation: (state, action) => {
      const { conversationId, message } = action.payload;
      if (state.currentConversation && state.currentConversation.id === conversationId) {
        state.currentConversation.messages.unshift(message);
      }
      
      // Update conversation in the list
      const conversationIndex = state.conversations.findIndex(conv => conv.id === conversationId);
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].last_message = message;
        state.conversations[conversationIndex].updated_at = message.sent_at;
        // Move conversation to top
        const conversation = state.conversations.splice(conversationIndex, 1)[0];
        state.conversations.unshift(conversation);
      }
    },
    updateUnreadCount: (state, action) => {
      const { conversationId, count } = action.payload;
      const conversationIndex = state.conversations.findIndex(conv => conv.id === conversationId);
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].unread_count = count;
      }
      
      // Update total unread count
      state.stats.unread_messages = state.conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch conversation
      .addCase(fetchConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentConversation = action.payload;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create conversation
      .addCase(createConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations.unshift(action.payload);
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const { conversationId, message } = action.payload;
        
        // Add message to current conversation
        if (state.currentConversation && state.currentConversation.id === conversationId) {
          state.currentConversation.messages.unshift(message);
        }
        
        // Update conversation in the list
        const conversationIndex = state.conversations.findIndex(conv => conv.id === conversationId);
        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].last_message = message;
          state.conversations[conversationIndex].updated_at = message.sent_at;
          // Move conversation to top
          const conversation = state.conversations.splice(conversationIndex, 1)[0];
          state.conversations.unshift(conversation);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload;
      })
      
      // Fetch stats
      .addCase(fetchMessagingStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      
      // Fetch available applicants
      .addCase(fetchAvailableApplicants.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAvailableApplicants.fulfilled, (state, action) => {
        state.loading = false;
        state.availableApplicants = action.payload;
      })
      .addCase(fetchAvailableApplicants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  clearCurrentConversation, 
  addMessageToConversation, 
  updateUnreadCount 
} = messagingSlice.actions;

export default messagingSlice.reducer;