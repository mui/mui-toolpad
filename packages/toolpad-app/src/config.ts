import { RUNTIME_CONFIG_WINDOW_PROPERTY } from './constants';

/**
 * There are three ways of configuring toolpad:
 *
 * 1. Build time:
 *    These can be used both serverside and browserside.
 *    They are inlined at build time. Use when you know the values at build time.
 *    They can be used to tree-shake code at build time
 *      - Configure in next.config.js `env` option
 *      - Use as process.env.MY_VARIABLE
 *
 * 2. Runtime, public:
 *    These can be used both on the server and in the browser
 *      - Configure in this file in the default export
 *      - Use by importing this module (`./src/config`)
 *
 * 3. Runtime, private:
 *    These can be used both on the server only, they are suitable for secrets
 *      - Configure in the file `./src/server.config`
 *      - Use by importing the module `./src/server.config`
 */

// These are inlined at build time
export type BuildEnvVars = Record<
  // Identifier for the product line (CE, EE, Cloud, ...)
  | 'TOOLPAD_TARGET'
  // Whether Toolpad is running in demo mode
  | 'TOOLPAD_DEMO'
  // The current Toolpad version
  | 'TOOLPAD_VERSION'
  // The current Toolpad build number
  | 'TOOLPAD_BUILD',
  string
>;

// These are set at runtime and passed to the browser.
// Do not add secrets
export interface RuntimeConfig {
  // Enable input field for seeding a dom in the app creation dialog
  // (For testing purposes)
  enableCreateByDom?: boolean;
  // Sentry DSN
  sentryDsn?: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends BuildEnvVars {}
  }
}

declare global {
  interface Window {
    [RUNTIME_CONFIG_WINDOW_PROPERTY]?: RuntimeConfig;
  }
}

function getBrowsersideRuntimeConfig(): RuntimeConfig {
  // These are being initialized in ./pages/_document.tsx
  const maybeRuntimeConfig = window[RUNTIME_CONFIG_WINDOW_PROPERTY];
  if (!maybeRuntimeConfig) {
    throw new Error(`Unable to access the runtime config in the browser`);
  }
  return maybeRuntimeConfig;
}

const runtimeConfig: RuntimeConfig =
  typeof window === 'undefined'
    ? {
        // Define runtime config here
        enableCreateByDom: !!process.env.TOOLPAD_ENABLE_CREATE_BY_DOM,
        sentryDsn: process.env.TOOLPAD_SENTRY_DSN,
      }
    : getBrowsersideRuntimeConfig();

export default runtimeConfig;
