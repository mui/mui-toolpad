'use client';
import { UseStorageState, useStorageState, useStorageStateServer } from '../persistence';

/**
 * Sync state to local storage so that it persists through a page refresh. Usage is
 * similar to useState except we pass in a storage key so that we can default
 * to that value on page load instead of the specified initial value.
 *
 * Since the storage API isn't available in server-rendering environments, we
 * return null during SSR and hydration.
 */
const useLocalStorageStateBrowser: UseStorageState = (...args: [any, any, any]) =>
  useStorageState(window.localStorage, ...args);

export const useLocalStorageState: UseStorageState =
  typeof window === 'undefined' ? useStorageStateServer : useLocalStorageStateBrowser;
