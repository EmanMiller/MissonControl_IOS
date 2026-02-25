import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Task } from '../types';
import { fetchTasks, createTask, updateTaskById, deleteTaskById, fetchTaskById } from '../thunks/taskThunks';

export type { Task };

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  newCompletedCount: number;
}

const initialState: TaskState = {
  tasks: [],
  isLoading: false,
  error: null,
  newCompletedCount: 0,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      state.isLoading = false;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
      if (action.payload.status === 'completed') {
        state.newCompletedCount += 1;
      }
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        const wasCompleted = state.tasks[index].status === 'completed';
        state.tasks[index] = action.payload;
        if (action.payload.status === 'completed' && !wasCompleted) {
          state.newCompletedCount += 1;
        }
      } else {
        state.tasks.push(action.payload);
        if (action.payload.status === 'completed') {
          state.newCompletedCount += 1;
        }
      }
    },
    updateTaskPartial: (state, action: PayloadAction<Partial<Task> & { id: string }>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        const wasCompleted = state.tasks[index].status === 'completed';
        state.tasks[index] = { ...state.tasks[index], ...action.payload };
        if (action.payload.status === 'completed' && !wasCompleted) {
          state.newCompletedCount += 1;
        }
      }
    },
    markCompletedTasksSeen: (state) => {
      state.newCompletedCount = 0;
    },
    removeTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
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
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.tasks = action.payload ?? [];
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Failed to fetch tasks';
      })
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        if (action.payload) state.tasks.push(action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Failed to create task';
      })
      .addCase(updateTaskById.fulfilled, (state, action) => {
        if (action.payload) {
          const i = state.tasks.findIndex(t => t.id === action.payload!.id);
          if (i !== -1) {
            const wasCompleted = state.tasks[i].status === 'completed';
            state.tasks[i] = action.payload;
            if (action.payload.status === 'completed' && !wasCompleted) {
              state.newCompletedCount += 1;
            }
          }
        }
      })
      .addCase(deleteTaskById.fulfilled, (state, action) => {
        if (action.payload) state.tasks = state.tasks.filter(t => t.id !== action.payload);
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        if (action.payload) {
          const i = state.tasks.findIndex(t => t.id === action.payload!.id);
          if (i !== -1) state.tasks[i] = action.payload;
          else state.tasks.push(action.payload);
        }
      });
  },
});

export const {
  setLoading,
  setTasks,
  addTask,
  updateTask,
  updateTaskPartial,
  removeTask,
  setError,
  clearError,
  markCompletedTasksSeen,
} = taskSlice.actions;

export default taskSlice.reducer;