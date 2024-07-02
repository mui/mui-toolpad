'use client';
import * as React from 'react';
import { CODEC_STRING, Codec } from './codec';

// storage events only work across tabs, we'll use an event emitter to announce within the current tab
const currentTabChangeListeners = new Map<string, Set<() => void>>();

function onCurrentTabStorageChange(key: string, handler: () => void) {
  let listeners = currentTabChangeListeners.get(key);

  if (!listeners) {
    listeners = new Set();
    currentTabChangeListeners.set(key, listeners);
  }

  listeners.add(handler);
}

function offCurrentTabStorageChange(key: string, handler: () => void) {
  const listeners = currentTabChangeListeners.get(key);
  if (!listeners) {
    return;
  }

  listeners.delete(handler);

  if (listeners.size === 0) {
    currentTabChangeListeners.delete(key);
  }
}

function emitCurrentTabStorageChange(key: string) {
  const listeners = currentTabChangeListeners.get(key);
  if (listeners) {
    listeners.forEach((listener) => listener());
  }
}

if (typeof window !== 'undefined') {
  const origSetItem = window.localStorage.setItem;
  window.localStorage.setItem = function setItem(key, value) {
    const result = origSetItem.call(this, key, value);
    emitCurrentTabStorageChange(key);
    return result;
  };
}

function subscribe(area: Storage, key: string | null, callback: () => void): () => void {
  if (!key) {
    return () => {};
  }
  const storageHandler = (event: StorageEvent) => {
    if (event.storageArea === area && event.key === key) {
      callback();
    }
  };
  window.addEventListener('storage', storageHandler);
  onCurrentTabStorageChange(key, callback);
  return () => {
    window.removeEventListener('storage', storageHandler);
    offCurrentTabStorageChange(key, callback);
  };
}

function getSnapshot(area: Storage, key: string | null): string | null {
  if (!key) {
    return null;
  }
  try {
    return area.getItem(key);
  } catch {
    // ignore
    // See https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#feature-detecting_localstorage
    return null;
  }
}

function setValue(area: Storage, key: string | null, value: string | null) {
  if (!key) {
    return;
  }
  try {
    if (value === null) {
      area.removeItem(key);
    } else {
      area.setItem(key, String(value));
    }
  } catch {
    // ignore
    // See https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#feature-detecting_localstorage
    return;
  }
  emitCurrentTabStorageChange(key);
}

export type StorageStateInitializer<T> = () => T | null;

export type UseStorageStateHookResult<T> = [
  T | null,
  React.Dispatch<React.SetStateAction<T | null>>,
];

const serverValue: UseStorageStateHookResult<any> = [null, () => {}];

export function useStorageStateServer<T = string>(): UseStorageStateHookResult<T> {
  return serverValue;
}

export interface DefaultStorageStateoptions<T = string> {
  codec?: Codec<T>;
}
export interface StorageStateOptions<T> extends DefaultStorageStateoptions<T> {
  codec: Codec<T>;
}

function encode<V>(codec: Codec<V>, value: V | null): string | null {
  return value === null ? null : codec.stringify(value);
}

function decode<V>(codec: Codec<V>, value: string | null): V | null {
  return value === null ? null : codec.parse(value);
}

// Start with null for the hydration, and then switch to the actual value.
const getKeyServerSnapshot = () => null;

/**
 * Sync state to local storage so that it persists through a page refresh. Usage is
 * similar to useState except we pass in a storage key so that we can default
 * to that value on page load instead of the specified initial value.
 *
 * Since the storage API isn't available in server-rendering environments, we
 * return null during SSR and hydration.
 */
export function useStorageState(
  area: Storage,
  key: string | null,
  initializer?: string | null | StorageStateInitializer<string>,
  options?: DefaultStorageStateoptions,
): UseStorageStateHookResult<string>;
export function useStorageState<T>(
  area: Storage,
  key: string | null,
  initializer: T | null | StorageStateInitializer<T>,
  options: StorageStateOptions<T>,
): UseStorageStateHookResult<T>;
export function useStorageState<T = string>(
  area: Storage,
  key: string | null,
  initializer: T | null | StorageStateInitializer<T> = null,
  options?: DefaultStorageStateoptions | StorageStateOptions<T>,
): UseStorageStateHookResult<T> {
  const codec = (options?.codec ?? CODEC_STRING) as Codec<T>;

  const [initialValue] = React.useState(initializer);
  const encodedInitialValue = React.useMemo(
    () => encode(codec, initialValue),
    [codec, initialValue],
  );

  const subscribeKey = React.useCallback(
    (callback: () => void) => subscribe(area, key, callback),
    [area, key],
  );

  const getKeySnapshot = React.useCallback<() => string | null>(
    () => getSnapshot(area, key) ?? encodedInitialValue,
    [area, encodedInitialValue, key],
  );

  const encodedStoredValue = React.useSyncExternalStore(
    subscribeKey,
    getKeySnapshot,
    getKeyServerSnapshot,
  );

  const storedValue = React.useMemo(
    () => decode(codec, encodedStoredValue),
    [codec, encodedStoredValue],
  );

  const setStoredValue = React.useCallback(
    (value: React.SetStateAction<T | null>) => {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      const encodedValueToStore = encode(codec, valueToStore);
      setValue(area, key, encodedValueToStore);
    },
    [area, codec, storedValue, key],
  );

  const [nonStoredValue, setNonStoredValue] = React.useState(initialValue);

  if (!key) {
    return [nonStoredValue, setNonStoredValue];
  }

  return [storedValue, setStoredValue];
}

export interface UseStorageState {
  /**
   * Sync state to local or session storage so that it persists through a page refresh. Usage is
   * similar to useState except we pass in a storage key that uniquely identifies the value.
   * @param key The key to use for storing the value in local or session storage.
   * @param initializer The initial value to use if the key is not present in storage.
   * @param options Additional options for the storage state.
   */
  (
    key: string | null,
    initializer?: string | null | StorageStateInitializer<string>,
    options?: DefaultStorageStateoptions,
  ): UseStorageStateHookResult<string>;
  /**
   * Sync state to local or session storage so that it persists through a page refresh. Usage is
   * similar to useState except we pass in a storage key that uniquely identifies the value.
   * @param key The key to use for storing the value in local or session storage.
   * @param initializer The initial value to use if the key is not present in storage.
   * @param options Additional options for the storage state.
   */
  <T>(
    key: string | null,
    initializer: T | null | StorageStateInitializer<T>,
    options: StorageStateOptions<T>,
  ): UseStorageStateHookResult<T>;
  /**
   * Sync state to local or session storage so that it persists through a page refresh. Usage is
   * similar to useState except we pass in a storage key that uniquely identifies the value.
   * @param key The key to use for storing the value in local or session storage.
   * @param initializer The initial value to use if the key is not present in storage.
   * @param options Additional options for the storage state.
   */
  <T>(
    key: string | null,
    initializer?: T | null | StorageStateInitializer<T>,
    options?: StorageStateOptions<T>,
  ): UseStorageStateHookResult<T>;
}
