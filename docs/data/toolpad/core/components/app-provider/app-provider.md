---
productId: toolpad-core
title: App Provider
components: AppProvider
---

# App Provider

<p class="description">The app provider component provides the necessary context for a Toolpad application, such as routing, navigation and theming.</p>

By wrapping an application at the root level with an `AppProvider` component, many of Toolpad's features can be automatically enabled to their fullest extent, abstracting away complexity and helping you focus on the details that matter.

It is not mandatory that every application is wrapped in an `AppProvider`, but it is highly recommended for most apps that use Toolpad.

## Basic

Wrap an application page with the `AppProvider` component to enable many of Toolpad's features.

Ideally, the `AppProvider` should wrap every page in the application, therefore in most projects it should be imported and placed in the file that defines a **shared layout** for all pages.

In the following example, placing a `DashboardLayout` component inside an `AppProvider` automatically enables many of the navigation and routing capabilities of the `DashboardLayout`.

{{"demo": "AppProviderBasic.js", "height": 500, "iframe": true}}

## Theming

## Next.js

The `AppProvider` for Next.js applications includes some Next.js integrations out-of-the-box.

By using the specific `AppProvider` for Next.js you do not have to manually configure the integration between some Toolpad features and the corresponding Next.js features (such as routing), making the integration automatic and seamless.

```tsx
import { AppProvider } from '@toolpad/core/nextjs/AppProvider';
// or
import { AppProvider } from '@toolpad/core/nextjs';
```

### Next.js App Router

When using the Next.js App Router, the most typical file where to import and use `AppProvider` will be at the top level `app/layout.tsx` file that defines the layout for all the application pages.

```tsx
// app/layout.tsx
import { AppProvider } from '@toolpad/core/nextjs/AppProvider';

export default function Layout(props) {
  const { children } = props;

  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
```

### Next.js Pages Router

When using the Next.js Pages Router, the most typical file where to import and use `AppProvider` in order to wrap every page in the application will be the `pages/_app.tsx` file.

```tsx
// pages/_app.tsx
import { AppProvider } from '@toolpad/core/nextjs/AppProvider';

export default function App(props) {
  const { Component, pageProps } = props;

  return (
    <AppProvider>
      <Component {...pageProps} />
    </AppProvider>
  );
}
```
