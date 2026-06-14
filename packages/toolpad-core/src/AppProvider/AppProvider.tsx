'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { createTheme, Theme } from '@mui/material/styles';
import { NotificationsProvider } from '../useNotifications';
import { DialogsProvider } from '../useDialogs';
import {
  BrandingContext,
  NavigationContext,
  RouterContext,
  WindowContext,
} from '../shared/context';
import type { LinkProps } from '../shared/Link';
import { AppThemeProvider } from './AppThemeProvider';
import { LocalizationProvider, type LocaleText } from './LocalizationProvider';

export interface NavigateOptions {
  history?: 'auto' | 'push' | 'replace';
}

export interface Navigate {
  (url: string | URL, options?: NavigateOptions): void;
}

/**
 * Abstract router used by Toolpad components.
 */
export interface Router {
  pathname: string;
  searchParams: URLSearchParams;
  navigate: Navigate;
  Link?: React.ComponentType<LinkProps>;
}

export interface Branding {
  title?: string;
  logo?: React.ReactNode;
  homeUrl?: string;
}

export interface NavigationPageItem {
  kind?: 'page';
  segment?: string;
  title?: string;
  icon?: React.ReactNode;
  pattern?: string;
  action?: React.ReactNode;
  children?: Navigation;
  searchParams?: URLSearchParams;
}

export interface NavigationSubheaderItem {
  kind: 'header';
  title: string;
}

export interface NavigationDividerItem {
  kind: 'divider';
}

export type NavigationItem = NavigationPageItem | NavigationSubheaderItem | NavigationDividerItem;

export type Navigation = NavigationItem[];

export interface Session {
  user?: {
    id?: string | null;
    name?: string | null;
    image?: string | null;
    email?: string | null;
  };
}

export interface Authentication {
  signIn: () => void;
  signOut: () => void;
}

export const AuthenticationContext = React.createContext<Authentication | null>(null);

export const SessionContext = React.createContext<Session | null>(null);

export type AppTheme = Theme | { light: Theme; dark: Theme };

export interface AppProviderProps {
  /**
   * The content of the app provider.
   */
  children: React.ReactNode;
  /**
   * [Theme or themes](https://mui.com/toolpad/core/react-app-provider/#theming) to be used by the app in light/dark mode. A [CSS variables theme](https://mui.com/material-ui/customization/css-theme-variables/overview/) is recommended.
   * @default createDefaultTheme()
   */
  theme?: AppTheme;
  /**
   * Branding options for the app.
   * @default null
   */
  branding?: Branding | null;
  /**
   * Navigation definition for the app. [Find out more](https://mui.com/toolpad/core/react-app-provider/#navigation).
   * @default []
   */
  navigation?: Navigation;
  /**
   * Router implementation used inside Toolpad components.
   * @default null
   */
  router?: Router;
  /**
   * Locale text for components
   */
  localeText?: Partial<LocaleText>;
  /**
   * Session info about the current user.
   * @default null
   */
  session?: Session | null;
  /**
   * Authentication methods.
   * @default null
   */
  authentication?: Authentication | null;
  /**
   * The window where the application is rendered.
   * This is needed when rendering the app inside an iframe, for example.
   * @default window
   */
  window?: Window;
  /**
   * The nonce to be used for inline scripts.
   */
  nonce?: string;
}

function createDefaultTheme(): Theme {
  return createTheme({
    cssVariables: {
      colorSchemeSelector: 'data-toolpad-color-scheme',
    },
    colorSchemes: { dark: true },
  });
}

/**
 *
 * Demos:
 *
 * - [App Provider](https://mui.com/toolpad/core/react-app-provider/)
 * - [Dashboard Layout](https://mui.com/toolpad/core/react-dashboard-layout/)
 *
 * API:
 *
 * - [AppProvider API](https://mui.com/toolpad/core/api/app-provider)
 */
function AppProvider(props: AppProviderProps) {
  const {
    children,
    theme = createDefaultTheme(),
    branding = null,
    navigation = [],
    localeText,
    router = null,
    authentication = null,
    session = null,
    window: appWindow,
    nonce,
  } = props;

  return (
    <WindowContext.Provider value={appWindow}>
      <AuthenticationContext.Provider value={authentication}>
        <SessionContext.Provider value={session}>
          <RouterContext.Provider value={router}>
            <AppThemeProvider theme={theme} window={appWindow} nonce={nonce}>
              <LocalizationProvider localeText={localeText}>
                <NotificationsProvider>
                  <DialogsProvider>
                    <BrandingContext.Provider value={branding}>
                      <NavigationContext.Provider value={navigation}>
                        {children}
                      </NavigationContext.Provider>
                    </BrandingContext.Provider>
                  </DialogsProvider>
                </NotificationsProvider>
              </LocalizationProvider>
            </AppThemeProvider>
          </RouterContext.Provider>
        </SessionContext.Provider>
      </AuthenticationContext.Provider>
    </WindowContext.Provider>
  );
}

AppProvider.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Authentication methods.
   * @default null
   */
  authentication: PropTypes.shape({
    signIn: PropTypes.func.isRequired,
    signOut: PropTypes.func.isRequired,
  }),
  /**
   * Branding options for the app.
   * @default null
   */
  branding: PropTypes.shape({
    homeUrl: PropTypes.string,
    logo: PropTypes.node,
    title: PropTypes.string,
  }),
  /**
   * The content of the app provider.
   */
  children: PropTypes.node,
  /**
   * Locale text for components
   */
  localeText: PropTypes.object,
  /**
   * Navigation definition for the app. [Find out more](https://mui.com/toolpad/core/react-app-provider/#navigation).
   * @default []
   */
  navigation: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.shape({
        action: PropTypes.node,
        children: PropTypes.arrayOf(
          PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.shape({
              kind: PropTypes.oneOf(['header']).isRequired,
              title: PropTypes.string.isRequired,
            }),
            PropTypes.shape({
              kind: PropTypes.oneOf(['divider']).isRequired,
            }),
          ]).isRequired,
        ),
        icon: PropTypes.node,
        kind: PropTypes.oneOf(['page']),
        pattern: PropTypes.string,
        searchParams: PropTypes.instanceOf(URLSearchParams),
        segment: PropTypes.string,
        title: PropTypes.string,
      }),
      PropTypes.shape({
        kind: PropTypes.oneOf(['header']).isRequired,
        title: PropTypes.string.isRequired,
      }),
      PropTypes.shape({
        kind: PropTypes.oneOf(['divider']).isRequired,
      }),
    ]).isRequired,
  ),
  /**
   * The nonce to be used for inline scripts.
   */
  nonce: PropTypes.string,
  /**
   * Router implementation used inside Toolpad components.
   * @default null
   */
  router: PropTypes.shape({
    Link: PropTypes.elementType,
    navigate: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    searchParams: PropTypes.instanceOf(URLSearchParams).isRequired,
  }),
  /**
   * Session info about the current user.
   * @default null
   */
  session: PropTypes.shape({
    user: PropTypes.shape({
      email: PropTypes.string,
      id: PropTypes.string,
      image: PropTypes.string,
      name: PropTypes.string,
    }),
  }),
  /**
   * [Theme or themes](https://mui.com/toolpad/core/react-app-provider/#theming) to be used by the app in light/dark mode. A [CSS variables theme](https://mui.com/material-ui/customization/css-theme-variables/overview/) is recommended.
   * @default createDefaultTheme()
   */
  theme: PropTypes.object,
  /**
   * The window where the application is rendered.
   * This is needed when rendering the app inside an iframe, for example.
   * @default window
   */
  window: PropTypes.object,
} as any;

export { AppProvider };
