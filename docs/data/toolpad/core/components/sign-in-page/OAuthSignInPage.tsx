import * as React from 'react';
import { AuthProvider, AppProvider, SignInPage } from '@toolpad/core';

// preview-start
const providers = [
  { id: 'github', name: 'GitHub' },
  { id: 'google', name: 'Google' },
  { id: 'facebook', name: 'Facebook' },
];
// preview-end

const signIn: (provider: AuthProvider) => Promise<string> = async (provider) => {
  const promise = new Promise<string>((resolve) => {
    setTimeout(() => {
      alert(`Signing in with "${provider.name}"`);
      resolve('');
    }, 300);
  });
  return promise;
};

export default function OAuthSignInPage() {
  return (
    // preview-start
    <AppProvider>
      <SignInPage signIn={signIn} providers={providers} />
    </AppProvider>
    // preview-end
  );
}
