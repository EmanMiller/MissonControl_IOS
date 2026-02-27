import { Platform, Vibration } from 'react-native';

const IOS_HAPTIC_MS = 10;

export const haptics = {
  impactLight() {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(IOS_HAPTIC_MS);
    }
  },

  success() {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 12, 30, 12]);
    }
  },

  error() {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 20, 40, 20, 40, 20]);
    }
  },
};

export default haptics;
