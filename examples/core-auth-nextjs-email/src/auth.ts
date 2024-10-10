import NextAuth from 'next-auth';
import { AuthProvider, SupportedAuthProvider } from '@toolpad/core';
import GitHub from 'next-auth/providers/github';
// import Credentials from 'next-auth/providers/credentials';

import Nodemailer from 'next-auth/providers/nodemailer';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Provider } from 'next-auth/providers';
import { prisma } from './prisma';

const providers: Provider[] = [
  GitHub({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  }),
  // Credentials({
  //   credentials: {
  //     email: { label: 'Email Address', type: 'email' },
  //     password: { label: 'Password', type: 'password' },
  //   },
  //   authorize(c) {
  //     if (c.password !== 'password') {
  //       return null;
  //     }
  //     return {
  //       id: 'test',
  //       name: 'Test User',
  //       email: String(c.email),
  //     };
  //   },
  // }),
  Nodemailer({
    server: {
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
      secure: true,
    },
    from: process.env.EMAIL_FROM,
  }),
];

export const providerMap = providers.map((provider) => {
  if (typeof provider === 'function') {
    const providerData = provider();
    return {
      id: providerData.id as SupportedAuthProvider,
      name: providerData.name,
    } satisfies AuthProvider;
  }
  return { id: provider.id as SupportedAuthProvider, name: provider.name } satisfies AuthProvider;
});

const missingVars: string[] = [];

if (!process.env.GITHUB_CLIENT_ID) {
  missingVars.push('GITHUB_CLIENT_ID');
}
if (!process.env.GITHUB_CLIENT_SECRET) {
  missingVars.push('GITHUB_CLIENT_SECRET');
}

if (missingVars.length > 0) {
  const baseMessage =
    'Authentication is configured but the following environment variables are missing:';

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`error - ${baseMessage} ${missingVars.join(', ')}`);
  } else {
    console.warn(
      `\u001b[33mwarn\u001b[0m - ${baseMessage} \u001b[31m${missingVars.join(', ')}\u001b[0m`,
    );
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isPublicPage = nextUrl.pathname.startsWith('/public');

      if (isPublicPage || isLoggedIn) {
        return true;
      }

      return false; // Redirect unauthenticated users to login page
    },
  },
});
