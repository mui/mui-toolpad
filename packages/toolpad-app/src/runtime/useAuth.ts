import * as React from 'react';
import * as appDom from '../appDom';

const AUTH_API_PATH = `${window.location.origin}/api/auth`;

export const AUTH_SESSION_PATH = `${AUTH_API_PATH}/session`;
export const AUTH_CSRF_PATH = `${AUTH_API_PATH}/csrf`;
export const AUTH_SIGNIN_PATH = `${AUTH_API_PATH}/signin`;
export const AUTH_SIGNOUT_PATH = `${AUTH_API_PATH}/signout`;

export type AuthProvider = 'github' | 'google';
export interface AuthSession {
  user: {
    name: string;
    email: string;
    image: string;
    roles: string[];
  };
}

export interface AuthPayload {
  session: AuthSession | null;
  signIn: (provider: AuthProvider) => void | Promise<void>;
  signOut: () => void | Promise<void>;
  isSigningIn: boolean;
  isSigningOut: boolean;
  authProviders: AuthProvider[];
  hasAuthentication: boolean;
}

export const AuthContext = React.createContext<AuthPayload>({
  session: null,
  signIn: () => {},
  signOut: () => {},
  isSigningIn: false,
  isSigningOut: false,
  authProviders: [],
  hasAuthentication: false,
});

export function useAuth({ dom }: { dom: appDom.RenderTree }): AuthPayload {
  const app = appDom.getApp(dom);

  const authProviders = app.attributes.authorization?.providers ?? [];

  const hasAuthentication = authProviders.length > 0;

  const [session, setSession] = React.useState<AuthSession | null>(null);
  const [isSigningIn, setIsSigningIn] = React.useState(true);
  const [isSigningOut, setIsSigningOut] = React.useState(true);

  const getCsrfToken = React.useCallback(async () => {
    const csrfResponse = await fetch(AUTH_CSRF_PATH, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { csrfToken } = await csrfResponse.json();

    return csrfToken;
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      setIsSigningOut(true);

      const csrfToken = await getCsrfToken();

      await fetch(AUTH_SIGNOUT_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Auth-Return-Redirect': '1',
        },
        body: new URLSearchParams({ csrfToken }),
      });
    } catch (error) {
      console.error((error as Error).message);
    }

    setSession(null);
    setIsSigningOut(false);
  }, [getCsrfToken]);

  const getSession = React.useCallback(async () => {
    try {
      setIsSigningIn(true);
      const sessionResponse = await fetch(AUTH_SESSION_PATH);
      setSession(await sessionResponse.json());
    } catch (error) {
      console.error((error as Error).message);
      signOut();
    }

    setIsSigningIn(false);
  }, [signOut]);

  const signIn = React.useCallback(
    async (provider: AuthProvider) => {
      try {
        setIsSigningIn(true);

        const csrfToken = await getCsrfToken();

        const signInResponse = await fetch(`${AUTH_SIGNIN_PATH}/${provider}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Auth-Return-Redirect': '1',
          },
          body: new URLSearchParams({ csrfToken }),
        });
        const { url: signInUrl } = await signInResponse.json();

        window.location.href = signInUrl;
      } catch (error) {
        console.error((error as Error).message);
        signOut();

        setIsSigningIn(false);
      }
    },
    [getCsrfToken, signOut],
  );

  React.useEffect(() => {
    if (hasAuthentication) {
      getSession();
    }
  }, [getSession, hasAuthentication]);

  return {
    session,
    signIn,
    signOut,
    isSigningIn,
    isSigningOut,
    authProviders,
    hasAuthentication,
  };
}
