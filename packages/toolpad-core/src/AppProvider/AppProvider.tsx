'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { baseTheme } from '../themes';
import { NotificationsProvider } from '../useNotifications';
import { DialogsProvider } from '../useDialogs';
import { type Navigation, NavigationContext } from '../contexts/NavigationContext';

export { Navigation };

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

// TODO: hide these contexts from public API
export const BrandingContext = React.createContext<Branding | null>(null);

export const RouterContext = React.createContext<Router | null>(null);

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
   * Navigation definition for the app.
   * @default []
   */
  navigation?: Navigation;
  /**
   * Router implementation used inside Toolpad components.
   * @default null
   */
  router?: Router;
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
  const { children, theme = baseTheme, branding = null, navigation = [], router = null } = props;

  return (
    <RouterContext.Provider value={router}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationsProvider>
          <DialogsProvider>
            <BrandingContext.Provider value={branding}>
              <NavigationContext.Provider value={navigation}>{children}</NavigationContext.Provider>
            </BrandingContext.Provider>
          </DialogsProvider>
        </NotificationsProvider>
      </ThemeProvider>
    </RouterContext.Provider>
  );
}

AppProvider.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
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
   * Navigation definition for the app.
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
        slug: PropTypes.string.isRequired,
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
   * Router implementation used inside Toolpad components.
   * @default null
   */
  router: PropTypes /* @typescript-to-proptypes-ignore */.shape({
    navigate: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    searchParams: PropTypes.instanceOf(URLSearchParams),
  }),
  /**
   * [Theme](https://mui.com/material-ui/customization/theming/) used by the app.
   * @default baseTheme
   */
  theme: PropTypes.object,
} as any;

export { AppProvider };
