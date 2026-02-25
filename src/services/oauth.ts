import { Linking, Platform } from 'react-native';
import { API_BASE_URL } from '../config/network';
import {
  isOAuthClientIdConfigured,
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

  private buildStartUrl(provider: OAuthProvider, state: string) {
    const providerConfig = OAUTH_CONFIG.providers[provider];
    const startUrl = new URL(`${API_BASE_URL}${providerConfig.startPath}`);
    startUrl.searchParams.set('redirect_uri', OAUTH_REDIRECT_URI);
    startUrl.searchParams.set('state', state);
    startUrl.searchParams.set('platform', Platform.OS);

    if (isOAuthClientIdConfigured(providerConfig.clientId)) {
      startUrl.searchParams.set('client_id', providerConfig.clientId);
    }

    return startUrl.toString();
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

  async signIn(provider: OAuthProvider): Promise<OAuthResult> {
    const state = this.createState();
    const authUrl = this.buildStartUrl(provider, state);
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
      return {
        user: {
          id: `${provider}-user`,
          email: `${provider}@oauth.local`,
          name: `${OAUTH_CONFIG.providers[provider].label} User`,
          provider,
        },
      };
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

    const user = this.normalizeUser(exchangeResponse?.user, provider);
    return { user };
  }
}

export const oauthService = new OAuthService();
export default oauthService;
