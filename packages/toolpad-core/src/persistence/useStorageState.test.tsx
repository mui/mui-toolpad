/**
 * @vitest-environment jsdom
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStorageState } from './useStorageState';

describe('useStorageState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('can do basic local storage with initial value', async () => {
    const { result, rerender } = renderHook(() =>
      useStorageState(window.localStorage, 'foo', 'bar'),
    );

    expect(result.current[0]).toBe('bar');
    result.current[1]('baz');

    rerender();

    expect(result.current[0]).toBe('baz');
  });

  test('can do basic local storage without initial value', async () => {
    const { result, rerender } = renderHook(() => useStorageState(window.localStorage, 'foo'));

    expect(result.current[0]).toBe(null);
    result.current[1]('baz');

    rerender();

    expect(result.current[0]).toBe('baz');
  });

  test('can clear storage value, and reset to intiial value', async () => {
    const { result, rerender } = renderHook(() =>
      useStorageState(window.localStorage, 'foo', 'bar'),
    );

    result.current[1]('baz');

    rerender();

    expect(result.current[0]).toBe('baz');
    result.current[1](null);

    rerender();

    expect(result.current[0]).toBe('bar');
  });

  test('can clear storage value', async () => {
    const { result, rerender } = renderHook(() => useStorageState(window.localStorage, 'foo'));

    result.current[1]('baz');

    rerender();

    expect(result.current[0]).toBe('baz');
    result.current[1](null);

    rerender();

    expect(result.current[0]).toBe(null);
  });

  test('can handle complex types', async () => {
    const { result, rerender } = renderHook(() =>
      useStorageState(window.localStorage, 'foo', { a: 1 }, { codec: JSON }),
    );

    expect(result.current[0]).toEqual({ a: 1 });
    result.current[1]({ b: 2 });

    rerender();

    expect(result.current[0]).toEqual({ b: 2 });
  });
});
