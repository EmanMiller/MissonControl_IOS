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

class OAuthService {
  private resolvedStartPaths: Partial<Record<OAuthProvider, string>> = {};

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

  private async doesStartPathExist(startPath: string): Promise<boolean> {
    try {
      const response = await axios.get(`${OAUTH_BACKEND_BASE_URL}${startPath}`, {
        timeout: 4000,
        maxRedirects: 0,
        validateStatus: () => true,
      });

      return response.status !== 404;
    } catch {
      return false;
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

    for (const candidatePath of candidatePaths) {
      const exists = await this.doesStartPathExist(candidatePath);
      if (exists) {
        this.resolvedStartPaths[provider] = candidatePath;
        return candidatePath;
      }
    }

    throw new Error(
      `OAuth start endpoint not found on ${OAUTH_BACKEND_BASE_URL}. Checked: ${candidatePaths.join(', ')}`
    );
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
        const callbackState = parsed.searchParams.get('state');
        const callbackProvider = parsed.searchParams.get('provider');

        if (callbackProvider && callbackProvider !== provider) {
          return;
        }

        if (callbackState && callbackState !== state) {
          return;
        }

        complete(() => resolve(parsed.searchParams));
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
    const startPath = await this.resolveStartPath(provider);
    const authUrl = this.buildStartUrl(provider, state, startPath);
    const canOpen = await Linking.canOpenURL(authUrl);
    if (!canOpen) {
      throw new Error('Unable to open OAuth authorization URL.');
    }

    const callbackPromise = this.waitForCallback(provider, state);

    await Linking.openURL(authUrl);
    const callbackParams = await callbackPromise;

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
  }
}

export const oauthService = new OAuthService();
export default oauthService;
