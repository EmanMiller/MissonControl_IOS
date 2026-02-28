import { Linking, Platform } from 'react-native';
import axios from 'axios';
import {
  isOAuthClientIdConfigured,
  OAUTH_BACKEND_BASE_URL,
  OAUTH_CONFIG,
  OAUTH_REDIRECT_URI,
  OAuthProvider,
} from '../config/oauth';
import { apiService } from './api';

type OAuthUser = {
  id: string;
  email: string;
  name: string;
  provider: OAuthProvider;
  avatarUrl?: string;
};

type OAuthResult = {
  user: OAuthUser;
};

const normalizePath = (value: string) => value.replace(/^\/+|\/+$/g, '');

type OAuthRuntimeMode = 'backend' | 'direct' | 'unknown';

export type OAuthProbePathResult = {
  path: string;
  reachable: boolean;
  exists: boolean;
  status?: number | null;
  error?: string;
};

export type OAuthDebugInfo = {
  provider: OAuthProvider;
  backendBaseUrl: string;
  mode: OAuthRuntimeMode;
  selectedStartPath: string | null;
  checkedPaths: OAuthProbePathResult[];
  backendReachable: boolean;
  lastAuthUrl: string | null;
  lastError: string | null;
  lastUpdatedAt: string;
};

class OAuthService {
  private resolvedStartPaths: Partial<Record<OAuthProvider, string>> = {};
  private debugByProvider = new Map<OAuthProvider, OAuthDebugInfo>();

  private nowIso() {
    return new Date().toISOString();
  }

  private initDebugInfo(provider: OAuthProvider): OAuthDebugInfo {
    const existing = this.debugByProvider.get(provider);
    if (existing) {
      return existing;
    }

    const created: OAuthDebugInfo = {
      provider,
      backendBaseUrl: OAUTH_BACKEND_BASE_URL,
      mode: 'unknown',
      selectedStartPath: null,
      checkedPaths: [],
      backendReachable: false,
      lastAuthUrl: null,
      lastError: null,
      lastUpdatedAt: this.nowIso(),
    };
    this.debugByProvider.set(provider, created);
    return created;
  }

  private updateDebugInfo(
    provider: OAuthProvider,
    updater: (current: OAuthDebugInfo) => OAuthDebugInfo
  ) {
    const current = this.initDebugInfo(provider);
    const next = updater(current);
    this.debugByProvider.set(provider, {
      ...next,
      lastUpdatedAt: this.nowIso(),
    });
  }

  getDebugInfo(provider: OAuthProvider): OAuthDebugInfo {
    return this.initDebugInfo(provider);
  }

  private createState() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private isOAuthCallbackUrl(url: string) {
    try {
      const parsed = new URL(url);
      const expectedPath = normalizePath(OAUTH_CONFIG.redirectPath);
      const actualPath = normalizePath(parsed.pathname);

      return (
        parsed.protocol === `${OAUTH_CONFIG.redirectScheme}:` &&
        parsed.hostname === OAUTH_CONFIG.redirectHost &&
        actualPath === expectedPath
      );
    } catch {
      return false;
    }
  }

  private buildStartUrl(provider: OAuthProvider, state: string, startPath: string) {
    const providerConfig = OAUTH_CONFIG.providers[provider];
    const startUrl = new URL(`${OAUTH_BACKEND_BASE_URL}${startPath}`);
    startUrl.searchParams.set('redirect_uri', OAUTH_REDIRECT_URI);
    startUrl.searchParams.set('state', state);
    startUrl.searchParams.set('platform', Platform.OS);

    if (isOAuthClientIdConfigured(providerConfig.clientId)) {
      startUrl.searchParams.set('client_id', providerConfig.clientId);
    }

    return startUrl.toString();
  }

  private async probeStartPath(
    startPath: string
  ): Promise<{ exists: boolean; reachable: boolean; status?: number; errorMessage?: string }> {
    try {
      const response = await axios.get(`${OAUTH_BACKEND_BASE_URL}${startPath}`, {
        timeout: 4000,
        maxRedirects: 0,
        validateStatus: () => true,
      });

      return {
        exists: response.status !== 404,
        reachable: true,
        status: response.status,
      };
    } catch (error: any) {
      return {
        exists: false,
        reachable: false,
        errorMessage: error?.message ?? 'request failed',
      };
    }
  }

  private async resolveStartPath(provider: OAuthProvider): Promise<string> {
    const cached = this.resolvedStartPaths[provider];
    if (cached) {
      return cached;
    }

    const config = OAUTH_CONFIG.providers[provider];
    const candidatePaths = Array.from(
      new Set([config.startPath, ...(config.fallbackStartPaths ?? [])])
    );

    let anyReachable = false;
    const checkedPaths: OAuthProbePathResult[] = [];

    for (const candidatePath of candidatePaths) {
      const result = await this.probeStartPath(candidatePath);
      checkedPaths.push({
        path: candidatePath,
        reachable: result.reachable,
        exists: result.exists,
        status: result.status ?? null,
        error: result.errorMessage,
      });
      if (result.reachable) {
        anyReachable = true;
      }
      if (result.exists) {
        this.resolvedStartPaths[provider] = candidatePath;
        this.updateDebugInfo(provider, current => ({
          ...current,
          checkedPaths,
          selectedStartPath: candidatePath,
          backendReachable: anyReachable,
          mode: 'backend',
          lastError: null,
        }));
        return candidatePath;
      }
    }

    this.updateDebugInfo(provider, current => ({
      ...current,
      checkedPaths,
      selectedStartPath: null,
      backendReachable: anyReachable,
      mode: 'unknown',
    }));

    if (!anyReachable) {
      throw new Error(
        `Cannot reach OAuth backend at ${OAUTH_BACKEND_BASE_URL}.`
      );
    }

    throw new Error(
      `OAuth start endpoint not found on ${OAUTH_BACKEND_BASE_URL}. Checked: ${candidatePaths.join(', ')}`
    );
  }

  private buildDirectProviderUrl(
    provider: OAuthProvider,
    state: string
  ): Promise<{ url: string } | null> {
    return this.buildDirectProviderUrlInternal(provider, state);
  }

  private async buildDirectProviderUrlInternal(
    provider: OAuthProvider,
    state: string
  ): Promise<{ url: string } | null> {
    const providerConfig = OAUTH_CONFIG.providers[provider];
    if (!isOAuthClientIdConfigured(providerConfig.clientId)) {
      return null;
    }

    if (provider === 'google') {
      return null;
    }

    if (provider === 'github') {
      const url = new URL('https://github.com/login/oauth/authorize');
      url.searchParams.set('client_id', providerConfig.clientId);
      url.searchParams.set('redirect_uri', OAUTH_REDIRECT_URI);
      url.searchParams.set('scope', 'read:user user:email');
      url.searchParams.set('state', state);
      return {
        url: url.toString(),
      };
    }

    return null;
  }

  private extractCallbackParams(parsedUrl: URL): URLSearchParams {
    const params = new URLSearchParams(parsedUrl.search);
    const rawHash = parsedUrl.hash.startsWith('#')
      ? parsedUrl.hash.slice(1)
      : parsedUrl.hash;

    if (rawHash) {
      const hashParams = new URLSearchParams(rawHash);
      hashParams.forEach((value, key) => {
        if (!params.has(key)) {
          params.set(key, value);
        }
      });
    }

    return params;
  }

  private waitForCallback(provider: OAuthProvider, state: string) {
    return new Promise<URLSearchParams>((resolve, reject) => {
      let settled = false;

      const complete = (callback: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        subscription.remove();
        clearTimeout(timer);
        callback();
      };

      const handleUrl = (incomingUrl: string) => {
        if (!this.isOAuthCallbackUrl(incomingUrl)) {
          return;
        }

        const parsed = new URL(incomingUrl);
        const params = this.extractCallbackParams(parsed);
        const callbackState = params.get('state');
        const callbackProvider = params.get('provider');

        if (callbackProvider && callbackProvider !== provider) {
          return;
        }

        if (callbackState && callbackState !== state) {
          return;
        }

        complete(() => resolve(params));
      };

      const subscription = Linking.addEventListener('url', event => {
        handleUrl(event.url);
      });

      const timer = setTimeout(() => {
        complete(() =>
          reject(new Error('OAuth sign-in timed out. Check callback URL setup.'))
        );
      }, OAUTH_CONFIG.timeoutMs);

      Linking.getInitialURL()
        .then(url => {
          if (url) {
            handleUrl(url);
          }
        })
        .catch(() => {
          // Ignore initial URL read errors.
        });
    });
  }

  private parseUserFromCallback(params: URLSearchParams, provider: OAuthProvider) {
    const name = params.get('name') || params.get('user_name');
    const email = params.get('email') || params.get('user_email');
    const id = params.get('user_id') || params.get('id');
    const avatarUrl = params.get('avatar_url') || undefined;

    if (!name || !email || !id) {
      return null;
    }

    return {
      id,
      email,
      name,
      provider,
      avatarUrl,
    };
  }

  private normalizeUser(rawUser: any, provider: OAuthProvider): OAuthUser {
    return {
      id: String(rawUser?.id ?? `${provider}-user`),
      email: String(rawUser?.email ?? ''),
      name: String(rawUser?.name ?? rawUser?.email ?? 'OAuth User'),
      provider,
      avatarUrl:
        typeof rawUser?.avatarUrl === 'string'
          ? rawUser.avatarUrl
          : typeof rawUser?.avatar_url === 'string'
            ? rawUser.avatar_url
            : undefined,
    };
  }

  private async resolveGoogleUserFromAccessToken(
    accessToken: string
  ): Promise<OAuthUser | null> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json();
      if (!payload?.sub || !payload?.email) {
        return null;
      }

      return {
        id: String(payload.sub),
        email: String(payload.email),
        name: String(payload.name ?? payload.email),
        provider: 'google',
        avatarUrl:
          typeof payload.picture === 'string'
            ? payload.picture
            : undefined,
      };
    } catch {
      return null;
    }
  }

  private async resolveUserFromServer(provider: OAuthProvider): Promise<OAuthUser | null> {
    const user = await apiService.getCurrentUser();
    if (!user?.id || !user?.email) {
      return null;
    }

    return this.normalizeUser(user, provider);
  }

  async signIn(provider: OAuthProvider): Promise<OAuthResult> {
    const state = this.createState();
    this.updateDebugInfo(provider, current => ({
      ...current,
      mode: 'unknown',
      selectedStartPath: null,
      checkedPaths: [],
      backendReachable: false,
      lastAuthUrl: null,
      lastError: null,
    }));

    let authUrl: string;
    try {
      const startPath = await this.resolveStartPath(provider);
      authUrl = this.buildStartUrl(provider, state, startPath);
      this.updateDebugInfo(provider, current => ({
        ...current,
        mode: 'backend',
        selectedStartPath: startPath,
        lastAuthUrl: authUrl,
        lastError: null,
      }));
    } catch (resolveError: any) {
      const resolveMessage = resolveError?.message ?? 'Unable to resolve backend OAuth route.';
      let directUrl: { url: string } | null = null;
      try {
        directUrl = await this.buildDirectProviderUrl(provider, state);
      } catch (directError: any) {
        const directMessage = directError?.message ?? 'Direct provider URL unavailable.';
        const combined = `${resolveMessage} ${directMessage}`.trim();
        this.updateDebugInfo(provider, current => ({
          ...current,
          mode: 'unknown',
          lastError: combined,
        }));
        throw new Error(combined);
      }

      if (!directUrl) {
        const extra =
          provider === 'google'
            ? ' Google OAuth requires an OpenClaw backend OAuth endpoint.'
            : '';
        this.updateDebugInfo(provider, current => ({
          ...current,
          mode: 'unknown',
          lastError: `${resolveMessage}${extra}`.trim(),
        }));
        throw new Error(`${resolveMessage}${extra}`.trim());
      }

      authUrl = directUrl.url;
      this.updateDebugInfo(provider, current => ({
        ...current,
        mode: 'direct',
        selectedStartPath: 'direct-provider-url',
        lastAuthUrl: authUrl,
        lastError: null,
      }));
    }

    const canOpen = await Linking.canOpenURL(authUrl);
    if (!canOpen) {
      const message = 'Unable to open OAuth authorization URL.';
      this.updateDebugInfo(provider, current => ({
        ...current,
        lastAuthUrl: authUrl,
        lastError: message,
      }));
      throw new Error(message);
    }

    const callbackPromise = this.waitForCallback(provider, state);

    await Linking.openURL(authUrl);
    const callbackParams = await callbackPromise;

    try {
      const callbackError =
        callbackParams.get('error_description') || callbackParams.get('error');
      if (callbackError) {
        throw new Error(callbackError);
      }

      const callbackToken =
        callbackParams.get('token') || callbackParams.get('access_token');
      if (callbackToken) {
        await apiService.setAuthToken(callbackToken);
        const callbackUser = this.parseUserFromCallback(callbackParams, provider);
        if (callbackUser) {
          return { user: callbackUser };
        }

        if (provider === 'google') {
          const googleUser = await this.resolveGoogleUserFromAccessToken(callbackToken);
          if (googleUser) {
            return { user: googleUser };
          }
        }

        const serverUser = await this.resolveUserFromServer(provider);
        if (serverUser) {
          return { user: serverUser };
        }

        throw new Error(
          `${OAUTH_CONFIG.providers[provider].label} sign-in completed, but no user profile was returned.`
        );
      }

      const callbackUser = this.parseUserFromCallback(callbackParams, provider);
      if (callbackUser) {
        return { user: callbackUser };
      }

      if (provider === 'google') {
        const accessToken = callbackParams.get('access_token');
        if (accessToken) {
          const googleUser = await this.resolveGoogleUserFromAccessToken(accessToken);
          if (googleUser) {
            return { user: googleUser };
          }
        }
      }

      const code = callbackParams.get('code');
      if (!code) {
        throw new Error('OAuth callback did not include a token or code.');
      }

      const exchangeResponse = await apiService.exchangeOAuthCode(
        provider,
        code,
        OAUTH_REDIRECT_URI,
        state
      );

      if (exchangeResponse?.user?.id && exchangeResponse?.user?.email) {
        const user = this.normalizeUser(exchangeResponse.user, provider);
        return { user };
      }

      const serverUser = await this.resolveUserFromServer(provider);
      if (serverUser) {
        return { user: serverUser };
      }

      throw new Error(
        `${OAUTH_CONFIG.providers[provider].label} sign-in succeeded, but account data is missing.`
      );
    } catch (error: any) {
      this.updateDebugInfo(provider, current => ({
        ...current,
        lastError: error?.message ?? 'OAuth sign-in failed.',
      }));
      throw error;
    }
  }
}

export const oauthService = new OAuthService();
export default oauthService;
