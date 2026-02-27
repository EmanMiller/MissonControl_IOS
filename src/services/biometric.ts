import { NativeModules, Platform } from 'react-native';

type BiometricAvailability = {
  available: boolean;
  biometryType?: string;
};

type BiometricModuleType = {
  isAvailable: () => Promise<BiometricAvailability>;
  authenticate: (reason: string) => Promise<{ success: boolean }>;
};

const biometricModule: BiometricModuleType | null =
  Platform.OS === 'ios' && NativeModules.BiometricModule
    ? NativeModules.BiometricModule
    : null;

export const biometricService = {
  async isAvailable(): Promise<BiometricAvailability> {
    if (!biometricModule) {
      return { available: false };
    }

    try {
      return await biometricModule.isAvailable();
    } catch {
      return { available: false };
    }
  },

  async authenticate(reason: string): Promise<boolean> {
    if (!biometricModule) {
      return false;
    }

    try {
      const result = await biometricModule.authenticate(reason);
      return !!result?.success;
    } catch {
      return false;
    }
  },
};

export default biometricService;
