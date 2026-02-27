import { NativeModules, Platform } from 'react-native';

type KeychainModuleType = {
  setItem: (key: string, value: string) => Promise<boolean>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<boolean>;
};

const keychainModule: KeychainModuleType | null =
  Platform.OS === 'ios' && NativeModules.KeychainModule
    ? NativeModules.KeychainModule
    : null;

const memoryStore = new Map<string, string>();

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (keychainModule) {
      await keychainModule.setItem(key, value);
      return;
    }

    memoryStore.set(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    if (keychainModule) {
      const value = await keychainModule.getItem(key);
      return value ?? null;
    }

    return memoryStore.get(key) ?? null;
  },

  async removeItem(key: string): Promise<void> {
    if (keychainModule) {
      await keychainModule.removeItem(key);
      return;
    }

    memoryStore.delete(key);
  },
};

export default secureStorage;
