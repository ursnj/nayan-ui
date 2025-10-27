import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

export class StorageService {
  static set(key: string, value: any) {
    storage.set(key, JSON.stringify(value) || '');
  }

  static get(key: string) {
    const value = storage.getString(key);
    return !!value && value !== 'undefined' ? JSON.parse(value) : '';
  }

  static unset(key: string) {
    storage.delete(key);
  }

  static clear() {
    storage.clearAll();
  }
}
