import { Platform } from 'react-native';

/**
 * Local notifications for task completed etc.
 * Uses @react-native-community/push-notification-ios on iOS; no-op on Android.
 */
let PushNotificationIOS: {
  requestPermissions: () => Promise<{ alert: boolean; badge: boolean; sound: boolean }>;
  addNotificationRequest: (request: { id: string; title?: string; body?: string }) => void;
  setApplicationIconBadgeNumber: (count: number) => void;
} | null = null;

if (Platform.OS === 'ios') {
  try {
    PushNotificationIOS = require('@react-native-community/push-notification-ios').default;
  } catch {
    // Package not installed or not linked
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !PushNotificationIOS) return false;
  try {
    const perms = await PushNotificationIOS.requestPermissions();
    return perms.alert === true;
  } catch {
    return false;
  }
}

export function showTaskCompletedNotification(taskTitle: string): void {
  if (Platform.OS !== 'ios' || !PushNotificationIOS) return;
  try {
    PushNotificationIOS.addNotificationRequest({
      id: `task-completed-${Date.now()}`,
      title: 'Task completed',
      body: taskTitle || 'A task was completed',
    });
  } catch {
    // Silently ignore if permissions denied or API fails
  }
}

export function setAppBadgeCount(count: number): void {
  if (Platform.OS !== 'ios' || !PushNotificationIOS) return;
  try {
    PushNotificationIOS.setApplicationIconBadgeNumber(Math.max(0, count));
  } catch {
    // Ignore badge update failures.
  }
}
