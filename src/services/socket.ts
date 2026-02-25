import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { updateTask, addTask, setTasks, removeTask } from '../store/slices/taskSlice';
import { updateAgent, setAgents } from '../store/slices/agentSlice';
import { showTaskCompletedNotification } from './notificationsLocal';

const SOCKET_URL = 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error);
      this.isConnected = false;
    });

    // Task events
    this.socket.on('task:created', (task) => {
      console.log('📋 Task created:', task);
      store.dispatch(addTask(task));
    });

    this.socket.on('task:updated', (task: { id: string; title?: string; status?: string }) => {
      if (task?.status === 'completed') {
        showTaskCompletedNotification(task?.title ?? 'Task');
      }
      store.dispatch(updateTask(task));
    });

    this.socket.on('task:deleted', (taskId: string) => {
      console.log('🗑️ Task deleted:', taskId);
      store.dispatch(removeTask(taskId));
    });

    // Agent events
    this.socket.on('agent:status_changed', (agent) => {
      console.log('🤖 Agent status changed:', agent);
      store.dispatch(updateAgent(agent));
    });

    this.socket.on('agents:list', (agents) => {
      console.log('👥 Agents list updated:', agents);
      store.dispatch(setAgents(agents));
    });

    // Bulk data events
    this.socket.on('data:sync', (data) => {
      console.log('🔄 Data sync received:', data);
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

  // Emit events
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

  // Task operations
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

  // Agent operations
  requestAgentUpdate(agentId?: string) {
    if (this.socket?.connected) {
      this.socket.emit('agent:request_update', { agentId });
    }
  }

  // Voice task creation
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