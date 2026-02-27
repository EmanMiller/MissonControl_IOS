import { NativeModules, Platform } from 'react-native';

type KeychainModuleType = {
  setItem: (key: string, value: string) => Promise<boolean>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<boolean>;
  deleteItem?: (key: string) => Promise<boolean>;
  remove?: (key: string) => Promise<boolean>;
};

const keychainModule: KeychainModuleType | null =
  Platform.OS === 'ios' && NativeModules.KeychainModule
    ? NativeModules.KeychainModule
    : null;

const memoryStore = new Map<string, string>();

const callIfFunction = async (
  fn: unknown,
  ...args: string[]
): Promise<unknown> => {
  if (typeof fn !== 'function') {
    return undefined;
  }
  return fn(...args);
};

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (keychainModule && typeof keychainModule.setItem === 'function') {
      await keychainModule.setItem(key, value);
      memoryStore.set(key, value);
      return;
    }

    memoryStore.set(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    if (keychainModule && typeof keychainModule.getItem === 'function') {
      const value = await keychainModule.getItem(key);
      return value ?? null;
    }

    return memoryStore.get(key) ?? null;
  },

  async removeItem(key: string): Promise<void> {
    if (keychainModule) {
      const method =
        typeof keychainModule.removeItem === 'function'
          ? keychainModule.removeItem
          : typeof keychainModule.deleteItem === 'function'
            ? keychainModule.deleteItem
            : typeof keychainModule.remove === 'function'
              ? keychainModule.remove
              : null;

      if (method) {
        await callIfFunction(method, key);
      } else if (typeof keychainModule.setItem === 'function') {
        // Last resort: overwrite with blank value when no remove API is available.
        await keychainModule.setItem(key, '');
      }
    }

    memoryStore.delete(key);
  },
};

export default secureStorage;
