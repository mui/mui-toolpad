---
productId: toolpad-core
title: Sign In Page
components: SignInPage, Account, NotificationsProvider
---

# Sign In Page

<p class="description">A customizable sign in UI component that abstracts away the pain needed to wire together a secure authentication page for your application.</p>

The `SignInPage` component is a quick way to generate a ready-to-use authentication page with multiple OAuth providers, or a credentials form.

## OAuth

The `SignInPage` component can be set up with an OAuth provider by passing in a list of providers in the `providers` prop, along with a `signIn` function that accepts the `provider` as a parameter.

{{"demo": "OAuthSignInPage.js", "iframe": true}}

## Credentials

:::warning
It is recommended to use the OAuth provider for more robust maintenance, support, and security.
:::

To render a username password form, pass in a provider with `credentials` as the `id` property. The `signIn` function accepts a `formData` parameter in this case.

{{"demo": "CredentialsSignInPage.js", "iframe": true, "height": 500}}

### Alerts

The `signIn` prop takes a function which can either return `void` or a `Promise` which resolves with an `AuthResponse` object of the form:

```ts
interface AuthResponse {
  error?: string;
  type?: string;
}
```

This renders an alert with the `error` string as the message.

{{"demo": "NotificationsSignInPageError.js", "iframe": true, "height": 600}}

## Usage with authentication libraries

### Auth.js

#### Next.js App Directory and GitHub

The component is composable with any authentication library you might want to use. The following is a `SignInPage` with [Auth.js](https://authjs.dev/) using GitHub, Next.js App router and server actions.

{{"component": "modules/components/DocsImage.tsx", "src": "/static/toolpad/docs/core/auth-next.png", "alt": "Auth.js & Next.js with Toolpad Core sign in page", "caption": "Auth.js & Next.js app router with Toolpad Core Sign In page", "zoom": true, "indent": 1 }}

#### Setting up

If you're using [`create-toolpad-app`](/toolpad/core/installation/), or the [Next.js app directory example](https://github.com/mui/mui-toolpad/tree/master/examples/core-auth-nextjs/), Auth.js is already installed. To proceed, add `AUTH_SECRET` to the environment variables by running:

```bash
npx auth secret
```

Otherwise, follow the detailed [Auth.js installation instructions](https://authjs.dev/getting-started/installation).

##### GitHub configuration

To get the required credentials, create an application in the GitHub developer settings. Read this [guide on Auth.js](https://authjs.dev/guides/configuring-github#adding-environment-variables) on how to obtain those.

If you already have a `CLIENT_ID` and `CLIENT_SECRET`, you can skip this step and add them to the environment variables, like so:

```bash title=".env.local"
GITHUB_CLIENT_ID=<your-client-id>
GITHUB_CLIENT_SECRET=<your-client-secret>
```

##### Server Configuration

If you're using [`create-toolpad-app`](/toolpad/core/installation/), or the default [Next.js app directory example](https://github.com/mui/mui-toolpad/tree/master/examples/core-auth-nextjs/), this server configuration is already set up for you.

Otherwise, follow the [custom sign in page instructions](https://authjs.dev/guides/pages/signin) to set up the server configuration.

The `SignInPage` component can slot in as a custom sign in page inside Auth.js:

```ts title="./auth.ts"
// ...
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/signin', // you can customize this based on your requirement
  },
// ...
```

To have a fully built "Sign in with GitHub" page appear at the `/auth/signin` route, add `SignInPage` to `page.tsx`:

```tsx title="./app/auth/signin/page.tsx"
// ...
import * as React from 'react';
import type { AuthProvider } from '@toolpad/core';
import { SignInPage } from '@toolpad/core/SignInPage';
import { AuthError } from 'next-auth';
import { providerMap, signIn } from '../../../auth';

export default function SignIn() {
  return (
    <SignInPage
      providers={providerMap}
      signIn={async (
        provider: AuthProvider,
        formData: FormData,
        callbackUrl?: string,
      ) => {
        'use server';
        try {
          return await signIn(provider.id, {
            ...(formData && {
              email: formData.get('email'),
              password: formData.get('password'),
            }),
            redirectTo: callbackUrl ?? '/',
          });
        } catch (error) {
          if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
          }
          if (error instanceof AuthError) {
            return {
              error:
                error.type === 'CredentialsSignin'
                  ? 'Invalid credentials.'
                  : 'An error with Auth.js occurred.',
              type: error.type,
            };
          }
          return {
            error: 'Something went wrong.',
            type: 'UnknownError',
          };
        }
      }}
    />
  );
}
```

## Customization

### Theme and Branding

Through the `branding` and `theme` props in the [AppProvider](https://mui.com/toolpad/core/react-app-provider/), the `SignInPage` can be customized to match your own styles.

{{"demo": "BrandingSignInPage.js", "iframe": true, "height": 700 }}

### Components

`SignInPage` can be customized by passing in `slotProps` to the underlying components of the credentials form.

{{"demo": "SlotPropsSignIn.js", "iframe": true, "height": 540 }}

#### 🚧 Composition

To enable deep customization beyond what is possible with custom props, the `SignInPage` component allows bringing your own custom granular components, such as inputs and buttons. This is in progress.

### 🚧 Layouts

The `SignInPage` component has versions with different layouts for authentication - one column, two column and others such. The APIs of these components are identical. This is in progress.

## 🚧 Other authentication Flows

The `SignInPage` will be accompanied by other components to allow users to sign up, verify emails and reset passwords. This is in progress.
