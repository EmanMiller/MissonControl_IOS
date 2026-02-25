import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { updateTaskPartial, addTask, setTasks, removeTask } from '../store/slices/taskSlice';
import { updateAgent, setAgents } from '../store/slices/agentSlice';
import { showTaskCompletedNotification } from './notificationsLocal';
import { SOCKET_URL } from '../config/network';

const RECONNECT_ATTEMPTS = 2;
const RECONNECT_DELAY_MS = 1500;
const RETRY_COOLDOWN_MS = 30000;

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private disabledUntil = 0;
  private hasLoggedUnavailable = false;

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (Date.now() < this.disabledUntil) {
      return null;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY_MS,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.hasLoggedUnavailable = false;
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    this.socket.on('connect_error', () => {
      this.isConnected = false;
      this.disabledUntil = Date.now() + RETRY_COOLDOWN_MS;

      if (!this.hasLoggedUnavailable) {
        this.hasLoggedUnavailable = true;
        console.warn(`Socket unavailable at ${SOCKET_URL}. Realtime updates are paused.`);
      }

      this.disconnect();
    });

    this.socket.on('task:created', task => {
      store.dispatch(addTask(task));
    });

    this.socket.on('task:updated', (task: { id: string; title?: string; status?: 'pending' | 'in_progress' | 'completed' | 'failed' }) => {
      if (task?.status === 'completed') {
        showTaskCompletedNotification(task?.title ?? 'Task');
      }
      store.dispatch(updateTaskPartial(task));
    });

    this.socket.on('task:deleted', (taskId: string) => {
      store.dispatch(removeTask(taskId));
    });

    this.socket.on('agent:status_changed', agent => {
      store.dispatch(updateAgent(agent));
    });

    this.socket.on('agents:list', agents => {
      store.dispatch(setAgents(agents));
    });

    this.socket.on('data:sync', data => {
      if (data.tasks) {
        store.dispatch(setTasks(data.tasks));
      }
      if (data.agents) {
        store.dispatch(setAgents(data.agents));
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinRoom(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_room', roomId);
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', roomId);
    }
  }

  createTask(taskData: any) {
    if (this.socket?.connected) {
      this.socket.emit('task:create', taskData);
    }
  }

  updateTaskStatus(taskId: string, status: string) {
    if (this.socket?.connected) {
      this.socket.emit('task:update_status', { taskId, status });
    }
  }

  requestAgentUpdate(agentId?: string) {
    if (this.socket?.connected) {
      this.socket.emit('agent:request_update', { agentId });
    }
  }

  sendVoiceTask(audioData: string, transcript?: string) {
    if (this.socket?.connected) {
      this.socket.emit('voice:task_create', { audioData, transcript });
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
