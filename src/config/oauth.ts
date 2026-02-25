export type OAuthProvider = 'google' | 'github';

type ProviderConfig = {
  label: string;
  startPath: string;
  clientId: string;
};

const PROVIDER_CONFIG: Record<OAuthProvider, ProviderConfig> = {
  google: {
    label: 'Google',
    startPath: '/auth/oauth/google/start',
    clientId: 'REPLACE_WITH_GOOGLE_CLIENT_ID',
  },
  github: {
    label: 'GitHub',
    startPath: '/auth/oauth/github/start',
    clientId: 'REPLACE_WITH_GITHUB_CLIENT_ID',
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

export const isOAuthClientIdConfigured = (value: string) =>
  value.trim().length > 0 && !value.startsWith('REPLACE_WITH_');
