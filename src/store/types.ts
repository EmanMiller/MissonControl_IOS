export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedAgent?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
}

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
