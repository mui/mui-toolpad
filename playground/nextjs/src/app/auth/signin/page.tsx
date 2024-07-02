import * as React from 'react';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { SignInPage } from '@toolpad/core/SignInPage';
import { providerMap, signIn } from '../../../auth';

export default async function SignIn() {
  return (
    <SignInPage
      providers={providerMap}
      signIn={async (provider) => {
        'use server';
        try {
          await signIn(provider.id, { redirectTo: '/' });
        } catch (error) {
          // Signin can fail for a number of reasons, such as the user
          // not existing, or the user not having the correct role.
          if (error instanceof AuthError) {
            redirect(`/auth/error?error=${error.type}`);
          }
          // Otherwise if a redirects happens NextJS can handle it
          // so you can just re-throw the error and let NextJS handle it.
          // Docs:
          // https://nextjs.org/docs/app/api-reference/functions/redirect#server-component
          throw error;
        }
      }}
    />
  );
}
