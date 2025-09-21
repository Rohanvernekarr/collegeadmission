import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import messagingReducer from './messagingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    messaging: messagingReducer,
  },
});

export default store;
