import { createAsyncThunk } from '@reduxjs/toolkit';
import { oauthService } from '../../services/oauth';
import type { OAuthProvider } from '../../config/oauth';
import { apiService } from '../../services/api';
import biometricService from '../../services/biometric';

type CreateAccountPayload = {
  name: string;
  email: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

export const loginWithOAuth = createAsyncThunk(
  'auth/loginWithOAuth',
  async (provider: OAuthProvider, { rejectWithValue }) => {
    try {
      const result = await oauthService.signIn(provider);
      return result.user;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'OAuth login failed');
    }
  }
);

export const createAccountWithCredentials = createAsyncThunk(
  'auth/createAccountWithCredentials',
  async (payload: CreateAccountPayload, { rejectWithValue }) => {
    try {
      const response = await apiService.createAccount(payload);
      const normalizedUser = {
        id: String(response?.user?.id ?? `credentials-${Date.now()}`),
        email: String(response?.user?.email ?? payload.email),
        name: String(response?.user?.name ?? payload.name),
        provider: 'credentials' as const,
        avatarUrl:
          typeof response?.user?.avatarUrl === 'string'
            ? response.user.avatarUrl
            : typeof response?.user?.avatar_url === 'string'
              ? response.user.avatar_url
              : undefined,
      };

      if (!normalizedUser.email) {
        throw new Error('Account was created but no email was returned.');
      }

      return normalizedUser;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Account creation failed');
    }
  }
);

export const loginWithCredentials = createAsyncThunk(
  'auth/loginWithCredentials',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await apiService.login({
        username: payload.email,
        password: payload.password,
      });

      const user = response?.user ?? {
        id: `credentials-${Date.now()}`,
        email: payload.email,
        name: payload.email.split('@')[0] || 'User',
      };

      return {
        id: String(user.id),
        email: String(user.email ?? payload.email),
        name: String(user.name ?? payload.email),
        provider: 'credentials' as const,
        avatarUrl:
          typeof user.avatarUrl === 'string'
            ? user.avatarUrl
            : typeof user.avatar_url === 'string'
              ? user.avatar_url
              : undefined,
      };
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Login failed');
    }
  }
);

export const loginWithBiometrics = createAsyncThunk(
  'auth/loginWithBiometrics',
  async (_, { rejectWithValue }) => {
    try {
      const available = await biometricService.isAvailable();
      if (!available.available) {
        throw new Error('Biometric authentication is not available.');
      }

      const authenticated = await biometricService.authenticate(
        'Authenticate to continue to Mission Control'
      );

      if (!authenticated) {
        throw new Error('Biometric authentication failed.');
      }

      const token = await apiService.restoreStoredAuthToken();
      if (!token) {
        throw new Error('No saved session found for biometric unlock.');
      }

      const user = await apiService.getCurrentUser();
      if (!user?.id || !user?.email) {
        throw new Error('Saved session is invalid. Please sign in again.');
      }

      return {
        id: String(user.id),
        email: String(user.email),
        name: String(user.name ?? user.email),
        provider: 'credentials' as const,
        avatarUrl:
          typeof user.avatarUrl === 'string'
            ? user.avatarUrl
            : typeof user.avatar_url === 'string'
              ? user.avatar_url
              : undefined,
      };
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Biometric login failed');
    }
  }
);
