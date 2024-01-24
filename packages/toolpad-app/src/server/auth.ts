import express, { Router } from 'express';
import { Auth } from '@auth/core';
import GithubProvider, { GitHubEmail, GitHubProfile } from '@auth/core/providers/github';
import GoogleProvider from '@auth/core/providers/google';
import AzureADProvider from '@auth/core/providers/azure-ad';
import CredentialsProvider from '@auth/core/providers/credentials';
import { getToken } from '@auth/core/jwt';
import { AuthConfig, TokenSet } from '@auth/core/types';
import { OAuthConfig } from '@auth/core/providers';
import chalk from 'chalk';
import { asyncHandler } from '../utils/express';
import { adaptRequestFromExpressToFetch } from './httpApiAdapters';
import { ToolpadProject } from './localMode';
import * as appDom from '../appDom';
import { AuthProvider } from '../types';

const SKIP_VERIFICATION_PROVIDERS: AuthProvider[] = [
  // Azure AD should be fine to skip as the user has to belong to the organization to sign in
  'azure-ad',
  'credentials',
];

export async function getHasAuthentication(project: ToolpadProject): Promise<boolean> {
  const dom = await project.loadDom();
  const app = appDom.getApp(dom);

  const authProviders = app.attributes.authentication?.providers ?? [];

  return authProviders.length > 0;
}

function getMappedRoles(
  roles: string[],
  allRoles: string[],
  roleMappings: Record<string, string[]>,
): string[] {
  return (roles ?? []).flatMap((providerRole) =>
    allRoles
      .filter((role) =>
        roleMappings[role] ? roleMappings[role].includes(providerRole) : role === providerRole,
      )
      // Remove duplicates in case multiple provider roles map to the same role
      .filter((value, index, self) => self.indexOf(value) === index),
  );
}

export function createAuthHandler(project: ToolpadProject): Router {
  if (!process.env.TOOLPAD_AUTH_SECRET) {
    console.error(
      `\n${chalk.red(
        'Missing secret for authentication. Please provide a secret in the TOOLPAD_AUTH_SECRET environment variable. Read more at [insert link to docs here]',
      )}\n`,
    );
  }

  const { base } = project.options;

  const router = express.Router();

  const githubProvider = GithubProvider({
    clientId: process.env.TOOLPAD_GITHUB_CLIENT_ID,
    clientSecret: process.env.TOOLPAD_GITHUB_CLIENT_SECRET,
    userinfo: {
      url: 'https://api.github.com/user',
      async request({
        tokens,
        provider,
      }: {
        tokens: TokenSet;
        provider: OAuthConfig<GitHubProfile>;
      }) {
        const dom = await project.loadDom();
        const app = appDom.getApp(dom);

        const restrictedDomains = app.attributes.authentication?.restrictedDomains ?? [];

        const headers = {
          Authorization: `Bearer ${tokens.access_token}`,
          'User-Agent': 'authjs',
        };

        const profile = await fetch(provider.userinfo?.url as URL, {
          headers,
        }).then(async (githubRes) => githubRes.json());

        if (!profile.email) {
          // If the user does not have a public email, get another via the GitHub API
          // See https://docs.github.com/en/rest/users/emails#list-public-email-addresses-for-the-authenticated-user
          const githubRes = await fetch('https://api.github.com/user/emails', {
            headers,
          });

          if (githubRes.ok) {
            const githubEmails: GitHubEmail[] = await githubRes.json();

            const activeEmail =
              (restrictedDomains.length > 0
                ? githubEmails.find(
                    (githubEmail) =>
                      githubEmail.verified &&
                      restrictedDomains.some((restrictedDomain) =>
                        githubEmail.email.endsWith(`@${restrictedDomain}`),
                      ),
                  )
                : null) ??
              githubEmails.find((githubEmail) => githubEmail.primary) ??
              githubEmails[0];

            profile.email = activeEmail.email;
            profile.email_verified = activeEmail.verified;
          }
        }

        return profile;
      },
    },
  });

  const googleProvider = GoogleProvider({
    clientId: process.env.TOOLPAD_GOOGLE_CLIENT_ID,
    clientSecret: process.env.TOOLPAD_GOOGLE_CLIENT_SECRET,
    authorization: {
      params: {
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
      },
    },
  });

  const azureADProvider = AzureADProvider({
    clientId: process.env.TOOLPAD_AZURE_AD_CLIENT_ID,
    clientSecret: process.env.TOOLPAD_AZURE_AD_CLIENT_SECRET,
    tenantId: process.env.TOOLPAD_AZURE_AD_TENANT_ID,
  });

  const credentialsProvider = CredentialsProvider({
    name: 'Credentials',
    async authorize({ username, password }) {
      if (process.env.NODE_ENV !== 'test') {
        throw new Error('Credentials authentication provider can only be used in test mode.');
      }

      if (username === 'admin' && password === 'admin') {
        return {
          id: 'admin',
          name: 'Mr. Admin',
          email: 'admin@example.com',
          roles: ['credentials-admin'],
        };
      }
      if (username === 'mui' && password === 'mui') {
        return { id: 'mui', name: 'MUI', email: 'test@mui.com', roles: [] };
      }
      if (username === 'test' && password === 'test') {
        return { id: 'test', name: 'Mrs. Test', email: 'test@example.com', roles: [] };
      }

      return null;
    },
  });

  const authConfig: AuthConfig = {
    pages: {
      signIn: `${base}/signin`,
      signOut: base,
      error: `${base}/signin`, // Error code passed in query string as ?error=
      verifyRequest: base,
    },
    providers: [githubProvider, googleProvider, azureADProvider, credentialsProvider],
    secret: process.env.TOOLPAD_AUTH_SECRET,
    trustHost: true,
    callbacks: {
      async signIn({ profile, account, user }) {
        const dom = await project.loadDom();
        const app = appDom.getApp(dom);

        const restrictedDomains = app.attributes.authentication?.restrictedDomains ?? [];

        const skipEmailVerification =
          !!account?.provider &&
          SKIP_VERIFICATION_PROVIDERS.includes(account.provider as AuthProvider);

        return Boolean(
          (profile?.email_verified || skipEmailVerification) &&
            user?.email &&
            (restrictedDomains.length === 0 ||
              restrictedDomains.some(
                (restrictedDomain) => user.email!.endsWith(`@${restrictedDomain}`) ?? false,
              )),
        );
      },
      async redirect({ baseUrl }) {
        return `${baseUrl}${base}`;
      },
      async jwt({ token, account, user }) {
        const dom = await project.loadDom();
        const app = appDom.getApp(dom);

        const authorization = app.attributes.authorization ?? {};
        const roleNames = authorization?.roles?.map((role) => role.name) ?? [];
        const roleMappings = account?.provider
          ? authorization?.roleMappings?.[account.provider as AuthProvider] ?? {}
          : {};

        if (account?.provider === 'azure-ad' && account.id_token) {
          const [, payload] = account.id_token.split('.');
          const idToken: { roles?: string[] } = JSON.parse(
            Buffer.from(payload, 'base64').toString('utf8'),
          );

          token.roles = getMappedRoles(idToken?.roles ?? [], roleNames, roleMappings);
        }

        if (account?.provider === 'credentials') {
          token.roles = getMappedRoles(user?.roles ?? [], roleNames, roleMappings);
        }

        return token;
      },
      // @TODO: Types for session callback are broken as it says token does not exist but it does
      // Github issue: https://github.com/nextauthjs/next-auth/issues/9437
      // @ts-ignore
      session({ session, token }) {
        if (session.user) {
          session.user.roles = token.roles ?? [];
        }

        return session;
      },
    },
  };

  router.use(
    '/*',
    asyncHandler(async (req, res) => {
      if (!process.env.TOOLPAD_AUTH_SECRET) {
        res.status(400).json({ url: `${base}/signin?error=MissingSecretError` });
        return;
      }

      const request = adaptRequestFromExpressToFetch(req);

      const response = (await Auth(request, authConfig)) as Response;

      // Converting Fetch API's Response to Express' res
      res.status(response.status);
      res.contentType(response.headers.get('content-type') ?? 'text/plain');
      response.headers.forEach((value, key) => {
        if (value) {
          res.setHeader(key, value);
        }
      });
      const body = await response.text();
      res.send(body);
    }),
  );

  return router;
}

export async function createRequireAuthMiddleware(project: ToolpadProject) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { options } = project;
    const { base } = options;

    const isPageRequest = req.get('sec-fetch-dest') === 'document';
    const signInPath = `${base}/signin`;

    let isAuthorized = true;
    if ((!project.options.dev || isPageRequest) && req.originalUrl.split('?')[0] !== signInPath) {
      const request = adaptRequestFromExpressToFetch(req);

      let token;
      if (process.env.TOOLPAD_AUTH_SECRET) {
        // @TODO: Library types are wrong as salt should not be required, remove once fixed
        // Github discussion: https://github.com/nextauthjs/next-auth/discussions/9133
        // @ts-ignore
        token = await getToken({
          req: request,
          secret: process.env.TOOLPAD_AUTH_SECRET,
        });
      }

      if (!token) {
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      if (isPageRequest) {
        res.redirect(signInPath);
      } else {
        res.status(401).send('Unauthorized');
      }
      res.end();
    } else {
      next();
    }
  };
}
