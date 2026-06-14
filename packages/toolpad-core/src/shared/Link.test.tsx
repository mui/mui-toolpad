/**
 * @vitest-environment jsdom
 */

import * as React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefaultLink } from './Link';
import { RouterContext } from './context';
import type { Router } from '../AppProvider';

describe('DefaultLink', () => {
  test('preserves search params and hash when navigating', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();

    const router: Router = {
      pathname: '/current',
      searchParams: new URLSearchParams(),
      navigate,
    };

    render(
      <RouterContext.Provider value={router}>
        <DefaultLink href="/jobs?page=2&filter=active#section">Jobs</DefaultLink>
      </RouterContext.Provider>,
    );

    const link = screen.getByText('Jobs');
    await user.click(link);

    expect(navigate).toHaveBeenCalledWith('/jobs?page=2&filter=active#section', {
      history: undefined,
    });
  });

  test('preserves only hash when no search params', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();

    const router: Router = {
      pathname: '/current',
      searchParams: new URLSearchParams(),
      navigate,
    };

    render(
      <RouterContext.Provider value={router}>
        <DefaultLink href="/about#team">About</DefaultLink>
      </RouterContext.Provider>,
    );

    const link = screen.getByText('About');
    await user.click(link);

    expect(navigate).toHaveBeenCalledWith('/about#team', { history: undefined });
  });

  test('preserves only search params when no hash', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();

    const router: Router = {
      pathname: '/current',
      searchParams: new URLSearchParams(),
      navigate,
    };

    render(
      <RouterContext.Provider value={router}>
        <DefaultLink href="/products?category=electronics">Products</DefaultLink>
      </RouterContext.Provider>,
    );

    const link = screen.getByText('Products');
    await user.click(link);

    expect(navigate).toHaveBeenCalledWith('/products?category=electronics', {
      history: undefined,
    });
  });

  test('works with history prop', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();

    const router: Router = {
      pathname: '/current',
      searchParams: new URLSearchParams(),
      navigate,
    };

    render(
      <RouterContext.Provider value={router}>
        <DefaultLink href="/jobs?page=2" history="replace">
          Jobs
        </DefaultLink>
      </RouterContext.Provider>,
    );

    const link = screen.getByText('Jobs');
    await user.click(link);

    expect(navigate).toHaveBeenCalledWith('/jobs?page=2', { history: 'replace' });
  });

  test('uses default anchor behavior when no router context', async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());

    render(<DefaultLink href="/jobs?page=2" onClick={onClick} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/jobs?page=2');
  });
});
