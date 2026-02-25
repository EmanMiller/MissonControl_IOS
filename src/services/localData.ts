import type { Agent, Task } from '../store/types';

const nowIso = () => new Date().toISOString();

let tasks: Task[] = [
  {
    id: 'local-task-1',
    title: 'Review OpenClaw connectivity',
    description: 'Verify API and websocket reachability from the mobile app.',
    status: 'in_progress',
    assignedAgent: 'Orchestrator',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'local-task-2',
    title: 'Audit auth flow',
    description: 'Confirm unauthenticated mode shows clear status in UI.',
    status: 'pending',
    assignedAgent: 'Security Analyst',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

let agents: Agent[] = [
  {
    id: 'local-agent-1',
    name: 'Orchestrator',
    status: 'active',
    type: 'manager',
    currentTask: 'Review OpenClaw connectivity',
    performance: {
      tasksCompleted: 42,
      averageTime: 18,
      successRate: 98,
    },
  },
  {
    id: 'local-agent-2',
    name: 'Security Analyst',
    status: 'idle',
    type: 'specialist',
    currentTask: undefined,
    performance: {
      tasksCompleted: 31,
      averageTime: 23,
      successRate: 95,
    },
  },
];

const cloneTask = (task: Task): Task => ({ ...task });
const cloneAgent = (agent: Agent): Agent => ({ ...agent, performance: { ...agent.performance } });

const makeTask = (input: Partial<Task>): Task => {
  const timestamp = nowIso();
  return {
    id: input.id ?? `local-task-${Date.now()}`,
    title: input.title ?? 'Untitled task',
    description: input.description,
    status: input.status ?? 'pending',
    assignedAgent: input.assignedAgent,
    createdAt: input.createdAt ?? timestamp,
    updatedAt: timestamp,
    attachments: input.attachments,
  };
};

export const localData = {
  getTasks(): Task[] {
    return tasks.map(cloneTask);
  },

  getTaskById(id: string): Task | undefined {
    const task = tasks.find(item => item.id === id);
    return task ? cloneTask(task) : undefined;
  },

  createTask(input: Partial<Task>): Task {
    const task = makeTask(input);
    tasks = [task, ...tasks];
    return cloneTask(task);
  },

  updateTask(id: string, updates: Partial<Task>): Task {
    const existing = tasks.find(item => item.id === id);
    const next = {
      ...(existing ?? makeTask({ id })),
      ...updates,
      id,
      updatedAt: nowIso(),
    };
    tasks = tasks.some(item => item.id === id)
      ? tasks.map(item => (item.id === id ? next : item))
      : [next, ...tasks];
    return cloneTask(next);
  },

  deleteTask(id: string): void {
    tasks = tasks.filter(item => item.id !== id);
  },

  getAgents(): Agent[] {
    return agents.map(cloneAgent);
  },

  getAgentById(id: string): Agent | undefined {
    const agent = agents.find(item => item.id === id);
    return agent ? cloneAgent(agent) : undefined;
  },
};
