/**
 * @vitest-environment jsdom
 */

import * as React from 'react';
import { describe, test, expect } from 'vitest';
import { renderHook, within, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useNotifications } from './useNotifications';
import { NotificationsProvider } from './NotificationsProvider';

interface TestWrapperProps {
  children: React.ReactNode;
}

function TestWrapper({ children }: TestWrapperProps) {
  return <NotificationsProvider>{children}</NotificationsProvider>;
}

describe('useNotifications', () => {
  test('can do basic notifications', async () => {
    const { result, rerender } = renderHook(() => useNotifications(), { wrapper: TestWrapper });

    expect(screen.queryByRole('alert')).toBeNull();

    const key = result.current.show('Hello');
    expect(key).toBeTypeOf('string');

    rerender();

    const snackbar = screen.getByRole('alert');
    expect(snackbar.textContent).toBe('Hello');

    await userEvent.click(within(snackbar).getByRole('button', { name: 'Close' }));

    rerender();

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });
});
