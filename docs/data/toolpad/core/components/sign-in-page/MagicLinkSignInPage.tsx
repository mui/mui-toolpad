import * as React from 'react';
import {
  AuthProvider,
  AppProvider,
  SignInPage,
  SupportedAuthProvider,
} from '@toolpad/core';
import { useTheme } from '@mui/material/styles';

// preview-start
const providers: { id: SupportedAuthProvider; name: string }[] = [
  { id: 'nodemailer', name: 'Email' },
];
// preview-end

const signIn: (provider: AuthProvider) => void = async (provider) => {
  const promise = new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log(`Sign in with ${provider.id}`);
      resolve();
    }, 500);
  });
  return promise;
};

export default function MagicLinkSignInPage() {
  const theme = useTheme();
  return (
    // preview-start
    <AppProvider theme={theme}>
      <SignInPage signIn={signIn} providers={providers} />
    </AppProvider>
    // preview-end
  );
}
