import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';

// Fetch all agents
export const fetchAgents = createAsyncThunk(
  'agents/fetchAgents',
  async (_, { rejectWithValue }) => {
    try {
      const agents = await apiService.getAgents();
      return agents;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch agents');
    }
  }
);

// Fetch a single agent
export const fetchAgentById = createAsyncThunk(
  'agents/fetchAgentById',
  async (id: string, { rejectWithValue }) => {
    try {
      const agent = await apiService.getAgentById(id);
      return agent;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch agent');
    }
  }
);