import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { Task } from '../store/slices/taskSlice';
import { Agent } from '../store/slices/agentSlice';
import { API_BASE_URL, API_HEALTH_URLS, OPENCLAW_ORIGIN } from '../config/network';
import { OAUTH_BACKEND_BASE_URL, OAUTH_EXCHANGE_PATH, OAuthProvider } from '../config/oauth';
import { localData } from './localData';
import { secureStorage } from './secureStorage';

const AUTH_TOKEN_KEY = 'auth_token';

type ApiMode = 'remote' | 'local';

class ApiService {
  private client: AxiosInstance;
  private authToken: string | null = null;
  private mode: ApiMode = 'remote';
  private lastConnectionMessage = 'Not checked yet';
  private lastErrorSignature: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.loadAuthToken();

    this.client.interceptors.request.use(
      config => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      error => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        this.lastErrorSignature = null;
        this.setMode('remote', `Connected to OpenClaw API (${API_BASE_URL})`);
        console.log('API Response:', response.status, response.config.url);
        return response;
      },
      (error: AxiosError<any>) => {
        const status = error.response?.status;
        const message = (error.response?.data as { message?: string } | undefined)?.message || error.message;
        const url = error.config?.url ?? 'unknown';

        if (status === 401) {
          this.clearAuthToken();
        }

        this.logErrorOnce(status, message, url);

        if (!status) {
          this.setMode('local', `OpenClaw API is unreachable at ${API_BASE_URL}. Using local data.`);
        }

        return Promise.reject(error);
      }
    );
  }

  private logErrorOnce(status: number | undefined, message: string, url: string) {
    const signature = `${status ?? 'network'}:${url}:${message}`;
    if (this.lastErrorSignature === signature) {
      return;
    }

    this.lastErrorSignature = signature;
    console.warn('API Error:', status, message, url);
  }

  private setMode(mode: ApiMode, message: string) {
    this.mode = mode;
    this.lastConnectionMessage = message;
  }

  private isNetworkError(error: any) {
    return !error?.response;
  }

  private async probe(url: string): Promise<{ reachable: boolean; status?: number }> {
    try {
      const response = await axios.get(url, {
        timeout: 4000,
        validateStatus: () => true,
      });
      return {
        reachable: true,
        status: response.status,
      };
    } catch {
      return {
        reachable: false,
      };
    }
  }

  private async loadAuthToken() {
    try {
      const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        this.authToken = token;
      }
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  private async saveAuthToken(token: string) {
    try {
      await secureStorage.setItem(AUTH_TOKEN_KEY, token);
      this.authToken = token;
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  private async clearAuthToken() {
    try {
      await secureStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    } finally {
      this.authToken = null;
    }
  }

  getApiBaseUrl(): string {
    return API_BASE_URL;
  }

  getOpenClawOrigin(): string {
    return OPENCLAW_ORIGIN;
  }

  isUsingLocalData(): boolean {
    return this.mode === 'local';
  }

  getConnectionMessage(): string {
    return this.lastConnectionMessage;
  }

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    console.log('Testing API connection to:', API_BASE_URL);

    for (const healthUrl of API_HEALTH_URLS) {
      const result = await this.probe(healthUrl);
      if (result.reachable && result.status && result.status < 500) {
        this.setMode('remote', `Connected to OpenClaw API (status ${result.status})`);
        return {
          connected: true,
          message: `OpenClaw API reachable (${result.status})`,
        };
      }
    }

    const tasksProbe = await this.probe(`${API_BASE_URL}/tasks`);
    if (tasksProbe.reachable && tasksProbe.status) {
      if (tasksProbe.status === 401 || tasksProbe.status === 403) {
        this.setMode('remote', 'OpenClaw API reachable; authentication required.');
        return {
          connected: true,
          message: 'OpenClaw API reachable - authentication required',
        };
      }

      if (tasksProbe.status < 500) {
        this.setMode('remote', `OpenClaw API reachable (status ${tasksProbe.status})`);
        return {
          connected: true,
          message: `OpenClaw API reachable (status ${tasksProbe.status})`,
        };
      }
    }

    const rootProbe = await this.probe(OPENCLAW_ORIGIN);
    if (rootProbe.reachable) {
      this.setMode('local', `OpenClaw is reachable at ${OPENCLAW_ORIGIN}, but API route ${API_BASE_URL} is unavailable. Using local data.`);
      return {
        connected: true,
        message: 'OpenClaw reachable, but API endpoints are unavailable. Using local data.',
      };
    }

    this.setMode('local', `OpenClaw is unreachable at ${OPENCLAW_ORIGIN}. Using local data.`);
    return {
      connected: false,
      message: `Cannot reach OpenClaw at ${OPENCLAW_ORIGIN}. Using local data.`,
    };
  }

  async getTasks(): Promise<Task[]> {
    try {
      const response = await this.client.get('/tasks');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        this.setMode('local', 'Authentication required for /tasks. Showing local task data.');
        return localData.getTasks();
      }

      if (this.isNetworkError(error) || status === 404) {
        this.setMode('local', 'Tasks endpoint unavailable. Showing local task data.');
        return localData.getTasks();
      }

      throw error;
    }
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    try {
      const response = await this.client.post('/tasks', task);
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (this.isNetworkError(error) || status === 401 || status === 403 || status === 404) {
        this.setMode('local', 'Create task API unavailable. Saving task locally.');
        return localData.createTask(task);
      }
      throw error;
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const response = await this.client.put(`/tasks/${id}`, updates);
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (this.isNetworkError(error) || status === 401 || status === 403 || status === 404) {
        this.setMode('local', 'Update task API unavailable. Updating task locally.');
        return localData.updateTask(id, updates);
      }
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      await this.client.delete(`/tasks/${id}`);
    } catch (error: any) {
      const status = error?.response?.status;
      if (this.isNetworkError(error) || status === 401 || status === 403 || status === 404) {
        this.setMode('local', 'Delete task API unavailable. Deleting task locally.');
        localData.deleteTask(id);
        return;
      }
      throw error;
    }
  }

  async getTaskById(id: string): Promise<Task> {
    try {
      const response = await this.client.get(`/tasks/${id}`);
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (this.isNetworkError(error) || status === 401 || status === 403 || status === 404) {
        this.setMode('local', 'Task lookup API unavailable. Using local data.');
        const task = localData.getTaskById(id);
        if (task) {
          return task;
        }
      }
      throw error;
    }
  }

  async getAgents(): Promise<Agent[]> {
    try {
      const response = await this.client.get('/agents');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        this.setMode('local', 'Authentication required for /agents. Showing local agent data.');
        return localData.getAgents();
      }

      if (this.isNetworkError(error) || status === 404) {
        this.setMode('local', 'Agents endpoint unavailable. Showing local agent data.');
        return localData.getAgents();
      }

      throw error;
    }
  }

  async getAgentById(id: string): Promise<Agent> {
    try {
      const response = await this.client.get(`/agents/${id}`);
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (this.isNetworkError(error) || status === 401 || status === 403 || status === 404) {
        this.setMode('local', 'Agent lookup API unavailable. Using local data.');
        const agent = localData.getAgentById(id);
        if (agent) {
          return agent;
        }
      }
      throw error;
    }
  }

  async login(credentials: { username: string; password: string }): Promise<{ token: string; user: any }> {
    try {
      const response = await this.client.post('/auth/login', credentials);

      if (response.data.token) {
        await this.saveAuthToken(response.data.token);
      }

      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async createAccount(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ token?: string; user?: any }> {
    const payload = {
      name: input.name,
      email: input.email,
      password: input.password,
      username: input.email,
    };

    try {
      const response = await this.client.post('/auth/register', payload);
      if (response.data?.token) {
        await this.saveAuthToken(response.data.token);
      }

      return response.data ?? {};
    } catch (error: any) {
      const status = error?.response?.status;
      if (this.isNetworkError(error) || status === 404) {
        const localUser = {
          id: `local-user-${Date.now()}`,
          name: input.name,
          email: input.email,
          provider: 'credentials' as const,
        };
        this.setMode('local', 'Register endpoint unavailable. Created a local account.');
        return { user: localUser };
      }

      const message =
        (error?.response?.data as { message?: string } | undefined)?.message ||
        error?.message ||
        'Failed to create account';
      throw new Error(message);
    }
  }

  async setAuthToken(token: string | null): Promise<void> {
    if (token) {
      await this.saveAuthToken(token);
      return;
    }
    await this.clearAuthToken();
  }

  async hasStoredAuthToken(): Promise<boolean> {
    const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  }

  async restoreStoredAuthToken(): Promise<string | null> {
    const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
    this.authToken = token;
    return token;
  }

  async setRememberMe(remember: boolean): Promise<void> {
    if (!this.authToken) {
      return;
    }

    if (remember) {
      await secureStorage.setItem(AUTH_TOKEN_KEY, this.authToken);
      return;
    }

    await secureStorage.removeItem(AUTH_TOKEN_KEY);
  }

  async exchangeOAuthCode(
    provider: OAuthProvider,
    code: string,
    redirectUri: string,
    state?: string
  ): Promise<{ token?: string; user?: any }> {
    const response = await axios.post(`${OAUTH_BACKEND_BASE_URL}${OAUTH_EXCHANGE_PATH}`, {
      provider,
      code,
      redirectUri,
      state,
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data?.token) {
      await this.saveAuthToken(response.data.token);
    }

    return response.data ?? {};
  }

  async getCurrentUser(): Promise<any | null> {
    try {
      const response = await this.client.get('/auth/me');
      return response.data ?? null;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404 || status === 401 || status === 403 || this.isNetworkError(error)) {
        return null;
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
      await this.clearAuthToken();
    } catch (error) {
      await this.clearAuthToken();
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const connection = await this.testConnection();
    return {
      status: connection.connected ? 'ok' : 'offline',
      timestamp: new Date().toISOString(),
    };
  }

  async testAuth(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.get('/tasks', {
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        this.setMode('remote', 'Authenticated with OpenClaw API.');
        return {
          success: true,
          message: 'Authentication working - tasks endpoint accessible',
        };
      }

      if (response.status === 401 || response.status === 403) {
        this.setMode('local', 'Authentication required. Showing local fallback data.');
        return {
          success: false,
          message: 'Authentication required - using local data',
        };
      }

      if (response.status === 404) {
        this.setMode('local', 'Tasks endpoint not found. Showing local fallback data.');
        return {
          success: false,
          message: 'Tasks endpoint not found - using local data',
        };
      }

      return {
        success: false,
        message: `Unexpected auth response status: ${response.status}`,
      };
    } catch (error: any) {
      if (this.isNetworkError(error)) {
        this.setMode('local', 'OpenClaw network unavailable. Showing local fallback data.');
        return {
          success: false,
          message: 'OpenClaw unreachable - using local data',
        };
      }

      return {
        success: false,
        message: `Auth test failed: ${error.message}`,
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;
