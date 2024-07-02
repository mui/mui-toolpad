/// <reference types="@testing-library/jest-dom/vitest" />

/**
 * @vitest-environment jsdom
 */

import * as React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import describeConformance from '@toolpad/utils/describeConformance';
import { SignInPage } from './SignInPage';

describe('SignInPage', () => {
  describeConformance(<SignInPage />, () => ({
    skip: ['themeDefaultProps'],
  }));

  test('renders oauth button', async () => {
    const signIn = vi.fn();
    render(<SignInPage signIn={signIn} providers={[{ id: 'github', name: 'GitHub' }]} />);

    const signInButton = screen.getByRole('button', { name: 'Sign in with GitHub' });

    await userEvent.click(signInButton);

    expect(signIn).toHaveBeenCalled();
    expect(signIn.mock.calls[0][0]).toHaveProperty('id', 'github');
  });

  test('renders credentials provider', async () => {
    const signIn = vi.fn();
    render(<SignInPage signIn={signIn} providers={[{ id: 'credentials', name: 'Credentials' }]} />);

    const emailField = screen.getByRole('textbox', { name: 'Email Address' });
    const passwordField = screen.getByLabelText(/Password/);
    const signInButton = screen.getByRole('button', { name: 'Sign in with username and password' });

    await userEvent.type(emailField, 'john@example.com');
    await userEvent.type(passwordField, 'thepassword');
    await userEvent.click(signInButton);

    expect(signIn).toHaveBeenCalled();
    expect(signIn.mock.calls[0][0]).toHaveProperty('id', 'credentials');
    expect(signIn.mock.calls[0][1].get('email')).toBe('john@example.com');
    expect(signIn.mock.calls[0][1].get('password')).toBe('thepassword');
  });
});
