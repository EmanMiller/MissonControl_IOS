import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

class NotificationService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;

    PushNotification.configure({
      // Called when Token is generated (iOS and Android)
      onRegister: (token: any) => {
        console.log('Push notification token:', token);
        // TODO: Send token to backend
        this.sendTokenToBackend(token.token);
      },

      // Called when a remote notification is received
      onNotification: (notification: any) => {
        console.log('Notification received:', notification);
        
        // Handle notification based on app state
        if (notification.userInteraction) {
          // User tapped on notification
          this.handleNotificationTap(notification);
        }
      },

      // Note: onRemoteNotification removed as it's handled by onNotification

      // iOS only: Called when Registered Action is pressed
      onAction: (notification: any) => {
        console.log('Notification action:', notification.action);
      },

      // iOS only
      onRegistrationError: (err: any) => {
        console.error('Push notification registration error:', err.message, err);
      },

      // IOS ONLY
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    this.initialized = true;
  }

  private async sendTokenToBackend(token: string) {
    try {
      // TODO: Send token to Mission Control backend
      console.log('Sending push token to backend:', token);
      
      // Example API call:
      // await apiService.updatePushToken(token);
    } catch (error) {
      console.error('Failed to send push token to backend:', error);
    }
  }

  private handleNotificationTap(notification: any) {
    // Navigate based on notification data
    if (notification.data) {
      const { type, taskId, agentId } = notification.data;
      
      switch (type) {
        case 'task_created':
        case 'task_updated':
          // Navigate to task details
          console.log('Navigate to task:', taskId);
          break;
        case 'agent_status_changed':
          // Navigate to agent details
          console.log('Navigate to agent:', agentId);
          break;
        default:
          console.log('Unknown notification type:', type);
      }
    }
  }

  // Show local notification
  showLocalNotification(title: string, message: string, data?: any) {
    PushNotification.localNotification({
      title,
      message,
      userInfo: data,
      playSound: true,
      soundName: 'default',
      actions: ['Open'],
      category: 'MISSION_CONTROL',
    });
  }

  // Cancel all notifications
  cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  // Get notification permissions status
  checkPermissions(callback: (permissions: any) => void) {
    PushNotification.checkPermissions(callback);
  }

  // Request permissions (iOS)
  requestPermissions() {
    return PushNotification.requestPermissions();
  }

  // Create notification channel (Android)
  createChannel() {
    PushNotification.createChannel(
      {
        channelId: 'mission-control',
        channelName: 'Mission Control',
        channelDescription: 'Mission Control notifications',
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      () => console.log('Notification channel created')
    );
  }
}

export const notificationService = new NotificationService();
export default notificationService;