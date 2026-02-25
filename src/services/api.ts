import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../store/slices/taskSlice';
import { Agent } from '../store/slices/agentSlice';

const BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN_KEY = 'auth_token';

class ApiService {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load auth token on initialization
    this.loadAuthToken();

    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        console.error('API Error:', status, message, error.config?.url);
        
        // Handle 401 Unauthorized - token expired/invalid
        if (status === 401) {
          this.clearAuthToken();
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth token management
  private async loadAuthToken() {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        this.authToken = token;
        console.log('Auth token loaded from storage');
      }
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  private async saveAuthToken(token: string) {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      this.authToken = token;
      console.log('Auth token saved to storage');
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  private async clearAuthToken() {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      this.authToken = null;
      console.log('Auth token cleared from storage');
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  // Connection test
  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      console.log('Testing API connection to:', BASE_URL);
      
      // Try a simple request to see if server is responding
      const response = await axios.get(BASE_URL, { timeout: 5000 });
      return {
        connected: true,
        message: 'Server is responding'
      };
    } catch (error: any) {
      console.error('Connection test failed:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return {
          connected: false,
          message: 'Server is not running on localhost:3001'
        };
      }
      
      if (error.response) {
        return {
          connected: true,
          message: `Server responding with status: ${error.response.status}`
        };
      }
      
      return {
        connected: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  // Task API methods
  async getTasks(): Promise<Task[]> {
    try {
      const response = await this.client.get('/tasks');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('Tasks request requires authentication');
        // For demo purposes, return empty array when not authenticated
        // In production, this should trigger a login flow
        return [];
      }
      throw error;
    }
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    const response = await this.client.post('/tasks', task);
    return response.data;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const response = await this.client.put(`/tasks/${id}`, updates);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.client.delete(`/tasks/${id}`);
  }

  async getTaskById(id: string): Promise<Task> {
    const response = await this.client.get(`/tasks/${id}`);
    return response.data;
  }

  // Agent API methods
  async getAgents(): Promise<Agent[]> {
    try {
      const response = await this.client.get('/agents');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('Agents request requires authentication');
        // For demo purposes, return empty array when not authenticated
        // In production, this should trigger a login flow
        return [];
      }
      throw error;
    }
  }

  async getAgentById(id: string): Promise<Agent> {
    const response = await this.client.get(`/agents/${id}`);
    return response.data;
  }

  // Auth API methods
  async login(credentials: { username: string; password: string }): Promise<{ token: string; user: any }> {
    try {
      console.log('Attempting login for user:', credentials.username);
      const response = await this.client.post('/auth/login', credentials);
      
      if (response.data.token) {
        await this.saveAuthToken(response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
      await this.clearAuthToken();
      console.log('Logged out successfully');
    } catch (error: any) {
      console.error('Logout failed:', error);
      // Clear token anyway on logout attempt
      await this.clearAuthToken();
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  // Get current auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error: any) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Test auth endpoint specifically
  async testAuth(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing auth endpoint...');
      
      // Try with a test request to tasks (which requires auth)
      const response = await this.client.get('/tasks');
      return {
        success: true,
        message: 'Authentication working - got tasks response'
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Authentication required - no valid token'
        };
      }
      
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Tasks endpoint not found'
        };
      }
      
      return {
        success: false,
        message: `Auth test failed: ${error.message}`
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;