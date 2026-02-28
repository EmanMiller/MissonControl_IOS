import { GITHUB_CLIENT_ID, GOOGLE_CLIENT_ID, OAUTH_BACKEND_ORIGIN } from './env.generated';

export type OAuthProvider = 'google' | 'github';

type ProviderConfig = {
  label: string;
  startPath: string;
  fallbackStartPaths?: string[];
  clientId: string;
};

const PROVIDER_CONFIG: Record<OAuthProvider, ProviderConfig> = {
  google: {
    label: 'Google',
    startPath: '/auth/oauth/google/start',
    fallbackStartPaths: ['/api/auth/oauth/google/start', '/oauth/google/start'],
    clientId: GOOGLE_CLIENT_ID,
  },
  github: {
    label: 'GitHub',
    startPath: '/auth/oauth/github/start',
    fallbackStartPaths: ['/api/auth/oauth/github/start', '/oauth/github/start'],
    clientId: GITHUB_CLIENT_ID,
  },
};

export const OAUTH_CONFIG = {
  redirectScheme: 'missioncontrolmobile',
  redirectHost: 'auth',
  redirectPath: 'callback',
  timeoutMs: 120000,
  exchangePath: '/auth/oauth/mobile/exchange',
  providers: PROVIDER_CONFIG,
};

export const OAUTH_EXCHANGE_PATH = OAUTH_CONFIG.exchangePath;
export const OAUTH_REDIRECT_URI = `${OAUTH_CONFIG.redirectScheme}://${OAUTH_CONFIG.redirectHost}/${OAUTH_CONFIG.redirectPath}`;
export const OAUTH_BACKEND_BASE_URL = OAUTH_BACKEND_ORIGIN.replace(/\/+$/, '');

export const isOAuthClientIdConfigured = (value: string) =>
  value.trim().length > 0 && !value.startsWith('REPLACE_WITH_');
