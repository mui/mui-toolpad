import type { SupportedAuthProvider } from '@toolpad/core';
import { kebabToConstant, kebabToPascal } from '@toolpad/utils/strings';
import { requiresIssuer, requiresTenantId } from './utils';
import { Template } from '../../types';

const CredentialsProviderTemplate = `Credentials({
  credentials: {
    email: { label: 'Email Address', type: 'email' },
    password: { label: 'Password', type: 'password' },
  },
  authorize(c) {
    if (c.password !== 'password') {
      return null;
    }
    return {
      id: 'test',
      name: 'Test User',
      email: String(c.email),
    };
  },
}),`;

const oAuthProviderTemplate = (provider: SupportedAuthProvider) => `${kebabToPascal(provider)}({
  clientId: process.env.${kebabToConstant(provider)}_CLIENT_ID,
  clientSecret: process.env.${kebabToConstant(provider)}_CLIENT_SECRET,
  ${requiresIssuer(provider) ? `issuer: process.env.${kebabToConstant(provider)}_ISSUER,\n` : ''}${requiresTenantId(provider) ? `tenantId: process.env.${kebabToConstant(provider)}_TENANT_ID,` : ''}
  })`;

const checkEnvironmentVariables = (providers: SupportedAuthProvider[] | undefined) => `

const missingVars: string[] = [];

const isMissing = (name: string, envVar: string | undefined) => {
  if (!envVar) {
    missingVars.push(name);
  }
};


${providers
  ?.filter((p) => p !== 'credentials')
  .map(
    (provider) =>
      `isMissing('${kebabToConstant(provider)}_CLIENT_ID', process.env.${kebabToConstant(provider)}_CLIENT_ID);\nisMissing('${kebabToConstant(provider)}_CLIENT_SECRET', process.env.${kebabToConstant(provider)}_CLIENT_SECRET)`,
  )
  .join('\n')}

if (missingVars.length > 0) {
  const baseMessage = 'Authentication is configured but the following environment variables are missing:';
  
  if (process.env.NODE_ENV === 'production') {
    console.warn(\`warn: \${baseMessage} \${missingVars.join(', ')}\`);
  } else {
    console.warn(\`\\u001b[33mwarn:\\u001b[0m \${baseMessage} \\u001b[31m\${missingVars.join(', ')}\\u001b[0m\`);
  }
}`;

const auth: Template = (options) => {
  const providers = options.authProviders;

  return `import NextAuth from 'next-auth';
  import { AuthProvider, SupportedAuthProvider } from '@toolpad/core';
  ${providers
    ?.map(
      (provider) =>
        `import ${kebabToPascal(provider)} from 'next-auth/providers/${provider.toLowerCase()}';`,
    )
    .join('\n')}
import type { Provider } from 'next-auth/providers';

const providers: Provider[] = [
    ${providers
      ?.map((provider) => {
        if (provider === 'credentials') {
          return CredentialsProviderTemplate;
        }
        return oAuthProviderTemplate(provider);
      })
      .join('\n')}
];

${checkEnvironmentVariables(providers)}

export const providerMap = providers.map((provider) => {
  if (typeof provider === 'function') {
    const providerData = provider();
      return { id: providerData.id as SupportedAuthProvider, name: providerData.name } satisfies AuthProvider;
  }
  return { id: provider.id as SupportedAuthProvider, name: provider.name } satisfies AuthProvider;
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
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
  `;
};

export default auth;
