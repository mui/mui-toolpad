import * as React from 'react';
import useStorageState from './useStorageState';

/**
 * Sync state to local storage so that it persists through a page refresh. Usage is
 * similar to useState except we pass in a local storage key so that we can default
 * to that value on page load instead of the specified initial value.
 *
 * Since the local storage API isn't available in server-rendering environments, we
 * return initialValue during SSR and hydration.
 *
 * Things this hook does different from existing solutions:
 * - SSR-capable: it shows initial value during SSR and hydration, but immediately
 *   initializes when clientside mounted.
 * - Sync state across tabs: When another tab changes the value in local storage, the
 *   current tab follows suit.
 */
export default function useLocalStorageState<V>(
  key: string,
  initialValue: V,
): [V, React.Dispatch<React.SetStateAction<V>>] {
  const [input, setInput] = useStorageState('local', key, () => JSON.stringify(initialValue));

  const value: V = React.useMemo(() => JSON.parse(input), [input]);
  const handleChange: React.Dispatch<React.SetStateAction<V>> = React.useCallback(
    (newValue) =>
      setInput(
        JSON.stringify(typeof newValue === 'function' ? (newValue as Function)(value) : newValue),
      ),
    [setInput, value],
  );

  return [value, handleChange];
}
