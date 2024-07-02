'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { baseTheme } from '../themes';
import { NotificationsProvider } from '../useNotifications';
import { DialogsProvider } from '../useDialogs';

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
}

export interface Branding {
  title?: string;
  logo?: React.ReactNode;
}

export interface NavigationPageItem {
  kind?: 'page';
  title: string;
  slug?: string;
  icon?: React.ReactNode;
  children?: Navigation;
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

// TODO: hide these contexts from public API
export const BrandingContext = React.createContext<Branding | null>(null);

export const NavigationContext = React.createContext<Navigation>([]);

export const RouterContext = React.createContext<Router | null>(null);

export const SessionContext = React.createContext<Session | null>(null);

export const AuthenticationContext = React.createContext<Authentication | null>(null);

export interface AppProviderProps {
  /**
   * The content of the app provider.
   */
  children: React.ReactNode;
  /**
   * [Theme](https://mui.com/material-ui/customization/theming/) used by the app.
   * @default baseTheme
   */
  theme?: Theme;
  /**
   * Branding options for the app.
   * @default null
   */
  branding?: Branding | null;
  /**
   * Navigation definition        for the app.
   * @default []
   */
  navigation?: Navigation;

  /**
   * Router implementation used inside Toolpad components.
   * @default null
   */
  router?: Router;
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
    theme = baseTheme,
    branding = null,
    navigation = [],
    router = null,
    session = null,
    authentication = null,
  } = props;

  return (
    <AuthenticationContext.Provider value={authentication}>
      <SessionContext.Provider value={session}>
        <RouterContext.Provider value={router}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <NotificationsProvider>
              <DialogsProvider>
                <BrandingContext.Provider value={branding}>
                  <NavigationContext.Provider value={navigation}>
                    {children}
                  </NavigationContext.Provider>
                </BrandingContext.Provider>
              </DialogsProvider>
            </NotificationsProvider>
          </ThemeProvider>
        </RouterContext.Provider>
      </SessionContext.Provider>
    </AuthenticationContext.Provider>
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
    logo: PropTypes.node,
    title: PropTypes.string,
  }),
  /**
   * The content of the app provider.
   */
  children: PropTypes.node,
  /**
   * Navigation definition        for the app.
   * @default []
   */
  navigation: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.shape({
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
        slug: PropTypes.string,
        title: PropTypes.string.isRequired,
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
   * Router implementation used inside Toolpad components.
   * @default null
   */
  router: PropTypes /* @typescript-to-proptypes-ignore */.shape({
    navigate: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    searchParams: PropTypes.instanceOf(URLSearchParams),
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
   * [Theme](https://mui.com/material-ui/customization/theming/) used by the app.
   * @default baseTheme
   */
  theme: PropTypes.object,
} as any;

export { AppProvider };
