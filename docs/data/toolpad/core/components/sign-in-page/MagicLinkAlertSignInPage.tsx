import * as React from 'react';
import {
  AuthProvider,
  AppProvider,
  SignInPage,
  AuthResponse,
  SupportedAuthProvider,
} from '@toolpad/core';
import { useTheme } from '@mui/material/styles';

const providers: { id: SupportedAuthProvider; name: string }[] = [
  { id: 'nodemailer', name: 'Email' },
];

const signIn: (provider: AuthProvider) => Promise<AuthResponse> = async (
  provider,
) => {
  const promise = new Promise<AuthResponse>((resolve) => {
    setTimeout(() => {
      console.log(`Sign in with ${provider.id}`);
      // preview-start
      resolve({
        success: 'Check your email for a verification link.',
      });
      // preview-end
    }, 500);
  });
  return promise;
};

export default function MagicLinkAlertSignInPage() {
  const theme = useTheme();
  return (
    // preview-start
    <AppProvider theme={theme}>
      <SignInPage signIn={signIn} providers={providers} />
    </AppProvider>
    // preview-end
  );
}
