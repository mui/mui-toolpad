'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { CssVarsTheme, Theme } from '@mui/material/styles';
import { baseTheme } from '../themes';
import { NotificationsProvider } from '../useNotifications';
import { DialogsProvider } from '../useDialogs';
import { BrandingContext, NavigationContext, RouterContext } from '../shared/context';
import { AppThemeProvider } from './AppThemeProvider';

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

export interface AppProviderProps {
  /**
   * The content of the app provider.
   */
  children: React.ReactNode;
  /**
   * [Theme](https://mui.com/material-ui/customization/theming/) to be used by the app in light/dark mode.
   * @default baseTheme
   */
  theme?: Theme | { light: Theme; dark: Theme } | CssVarsTheme;
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
      <AppThemeProvider theme={theme}>
        <NotificationsProvider>
          <DialogsProvider>
            <BrandingContext.Provider value={branding}>
              <NavigationContext.Provider value={navigation}>{children}</NavigationContext.Provider>
            </BrandingContext.Provider>
          </DialogsProvider>
        </NotificationsProvider>
      </AppThemeProvider>
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
   * [Theme](https://mui.com/material-ui/customization/theming/) to be used by the app in light/dark mode.
   * @default baseTheme
   */
  theme: PropTypes.object,
} as any;

export { AppProvider };
