'use server';
import { AuthError } from 'next-auth';
import type { AuthProvider } from '@toolpad/core';

import { signIn as signInAction } from '../../../auth';

async function signIn(provider: AuthProvider, formData: FormData, callbackUrl?: string) {
  try {
    return await signInAction(provider.id, {
      ...(formData && { email: formData.get('email'), password: formData.get('password') }),
      redirectTo: callbackUrl ?? '/',
    });
  } catch (error) {
    // The desired flow for successful sign in in all cases
    // and unsuccessful sign in for OAuth providers will cause a `redirect`,
    // and `redirect` is a throwing function, so we need to re-throw
    // to allow the redirect to happen
    // Source: https://github.com/vercel/next.js/issues/49298#issuecomment-1542055642
    // Detect a `NEXT_REDIRECT` error and re-throw it
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    // Handle Auth.js errors
    if (error instanceof AuthError) {
      return {
        error:
          error.type === 'CredentialsSignin'
            ? 'Invalid credentials.'
            : 'An error with Auth.js occurred.',
        type: error.type,
      };
    }
    // An error boundary must exist to handle unknown errors
    return {
      error: 'Something went wrong.',
      type: 'UnknownError',
    };
  }
}

export default signIn;
