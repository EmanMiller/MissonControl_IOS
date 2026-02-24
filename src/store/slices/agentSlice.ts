import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'offline' | 'busy';
  type: 'assistant' | 'specialist' | 'manager';
  currentTask?: string;
  performance: {
    tasksCompleted: number;
    averageTime: number;
    successRate: number;
  };
}

interface AgentState {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AgentState = {
  agents: [],
  isLoading: false,
  error: null,
};

const agentSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAgents: (state, action: PayloadAction<Agent[]>) => {
      state.agents = action.payload;
      state.isLoading = false;
    },
    updateAgent: (state, action: PayloadAction<Agent>) => {
      const index = state.agents.findIndex(agent => agent.id === action.payload.id);
      if (index !== -1) {
        state.agents[index] = action.payload;
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setAgents,
  updateAgent,
  setError,
  clearError,
} = agentSlice.actions;

export default agentSlice.reducer;