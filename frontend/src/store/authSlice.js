import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../services/authService';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Registration failed');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      return await authService.verifyEmail({ email, otp });
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Verification failed');
    }
  }
);

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async (email, { rejectWithValue }) => {
    try {
      return await authService.resendOtp({ email });
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Resend failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  localStorage.removeItem('access_token');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: authService.getCurrentUser(),
    isAuthenticated: authService.isAuthenticated(),
    loading: false,
    error: null,
    verification: {
      loading: false,
      resendLoading: false,
      success: false,
      error: null,
      email: null,
    },
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state) => {
        // Even if server logout fails, clear client auth state
        state.user = null;
        state.isAuthenticated = false;
      });

    // Verify email
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.verification.loading = true;
        state.verification.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.verification.loading = false;
        state.verification.success = true;
        state.verification.email = action.meta.arg.email;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.verification.loading = false;
        state.verification.error = action.payload || action.error?.message;
      })
      // Resend OTP
      .addCase(resendOtp.pending, (state) => {
        state.verification.resendLoading = true;
        state.verification.error = null;
      })
      .addCase(resendOtp.fulfilled, (state, action) => {
        state.verification.resendLoading = false;
        state.verification.email = action.meta.arg;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.verification.resendLoading = false;
        state.verification.error = action.payload || action.error?.message;
      });
  },
});

export const { clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;

