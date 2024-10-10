'use client';
import * as React from 'react';
import type { AuthProvider } from '@toolpad/core';
import { SignInPage } from '@toolpad/core/SignInPage';
import { signIn as webauthnSignIn } from 'next-auth/webauthn';
import { providerMap } from '../../../auth';
import serverSignIn from './actions';

// Create a wrapper function for signIn
const signIn = async (provider: AuthProvider, formData: FormData, callbackUrl?: string) => {
  if (provider.id === 'passkey') {
    try {
      return await webauthnSignIn('passkey', {
        email: formData.get('email'),
        callbackUrl: callbackUrl || '/',
      });
    } catch (error) {
      console.error(error);
      return {
        error: (error as Error)?.message || 'Something went wrong',
        type: 'WebAuthnError',
      };
    }
  }
  // Use regular signIn for other providers
  return serverSignIn(provider, formData, callbackUrl);
};

export default function SignIn() {
  // TODO: Fix this
  return <SignInPage providers={providerMap} signIn={signIn} />;
}
