import { createAsyncThunk } from '@reduxjs/toolkit';
import { oauthService } from '../../services/oauth';
import type { OAuthProvider } from '../../config/oauth';

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
