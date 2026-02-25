import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Agent } from '../types';
import { fetchAgents, fetchAgentById } from '../thunks/agentThunks';

export type { Agent };

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
      } else {
        state.agents.push(action.payload);
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
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.agents = action.payload ?? [];
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Failed to fetch agents';
      })
      .addCase(fetchAgentById.fulfilled, (state, action) => {
        if (action.payload) {
          const i = state.agents.findIndex(a => a.id === action.payload!.id);
          if (i !== -1) state.agents[i] = action.payload;
          else state.agents.push(action.payload);
        }
      });
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