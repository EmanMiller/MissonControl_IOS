import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  createAccountWithCredentials,
  loginWithBiometrics,
  loginWithCredentials,
  loginWithOAuth,
} from '../thunks/authThunks';
import type { OAuthProvider } from '../../config/oauth';

interface User {
  id: string;
  email: string;
  name: string;
  provider?: OAuthProvider | 'credentials';
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.user = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetTransientState: (state) => {
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithOAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithOAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(loginWithOAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'OAuth login failed';
        state.isAuthenticated = false;
      })
      .addCase(createAccountWithCredentials.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAccountWithCredentials.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(createAccountWithCredentials.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Account creation failed';
        state.isAuthenticated = false;
      })
      .addCase(loginWithCredentials.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithCredentials.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(loginWithCredentials.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Login failed';
        state.isAuthenticated = false;
      })
      .addCase(loginWithBiometrics.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithBiometrics.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(loginWithBiometrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Biometric login failed';
        state.isAuthenticated = false;
      });
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  resetTransientState,
} = authSlice.actions;

export default authSlice.reducer;
