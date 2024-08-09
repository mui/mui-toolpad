import * as React from 'react';
import { PaletteMode, Theme, useMediaQuery } from '@mui/material';
import { ThemeProvider, useColorScheme } from '@mui/material/styles';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import CssBaseline from '@mui/material/CssBaseline';
import invariant from 'invariant';
import { useLocalStorageState } from '../useLocalStorageState';
import { PaletteModeContext } from '../shared/context';
import type { AppTheme } from './AppProvider';

const COLOR_SCHEME_ATTRIBUTE = 'data-toolpad-color-scheme';
const COLOR_SCHEME_STORAGE_KEY = 'mui-toolpad-color-scheme';
const MODE_STORAGE_KEY = 'mui-toolpad-mode';

function usePreferredMode() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  return prefersDarkMode ? 'dark' : 'light';
}

type ThemeMode = PaletteMode | 'system';

type CssVarsTheme = Theme & { vars: Record<string, string> };

function isCssVarsTheme(theme: AppTheme): theme is CssVarsTheme {
  return 'vars' in theme;
}

interface LegacyThemeProviderProps {
  children: React.ReactNode;
  theme: AppTheme;
  window?: Window;
}

/**
 * Compatibility layer for classic v5 themes. It will handle state management for the theme switcher.
 * In the v6 theme, this state management is handled by `useColorScheme`. But this hook will crash if
 * not run under context with a css vars theme.
 */
function LegacyThemeProvider(props: LegacyThemeProviderProps) {
  const { children, theme, window: appWindow } = props;
  invariant(!isCssVarsTheme(theme), 'This provider only accepts legacy themes.');

  const isDualTheme = 'light' in theme || 'dark' in theme;

  const preferredMode = usePreferredMode();
  const [userMode, setUserMode] = useLocalStorageState<ThemeMode>(MODE_STORAGE_KEY, 'system');

  const paletteMode = !userMode || userMode === 'system' ? preferredMode : userMode;
  const dualAwareTheme = React.useMemo(
    () =>
      isDualTheme
        ? (theme[paletteMode === 'dark' ? 'dark' : 'light'] ??
          theme[paletteMode === 'dark' ? 'light' : 'dark'])
        : theme,
    [isDualTheme, paletteMode, theme],
  );

  // The v5 shim, based on local state
  const paletteModeContextValue = React.useMemo(
    () => ({
      paletteMode,
      setPaletteMode: setUserMode,
      isDualTheme,
    }),
    [isDualTheme, paletteMode, setUserMode],
  );

  return (
    <ThemeProvider
      theme={dualAwareTheme}
      documentNode={appWindow?.document}
      colorSchemeNode={appWindow?.document?.body}
      disableNestedContext
      colorSchemeStorageKey={COLOR_SCHEME_STORAGE_KEY}
      modeStorageKey={MODE_STORAGE_KEY}
    >
      <PaletteModeContext.Provider value={paletteModeContextValue}>
        <CssBaseline enableColorScheme />
        {children}
      </PaletteModeContext.Provider>
    </ThemeProvider>
  );
}

function CssVarsPaletteModeProvider(props: { children: React.ReactNode }) {
  const preferredMode = usePreferredMode();
  const { mode, setMode, allColorSchemes } = useColorScheme();

  // The v6 API, based on `useColorScheme`
  const paletteModeContextValue = React.useMemo(() => {
    return {
      paletteMode: !mode || mode === 'system' ? preferredMode : mode,
      setPaletteMode: setMode,
      isDualTheme: allColorSchemes.length > 1,
    };
  }, [allColorSchemes, mode, preferredMode, setMode]);

  return <PaletteModeContext.Provider value={paletteModeContextValue} {...props} />;
}

interface CssVarsThemeProviderProps {
  children: React.ReactNode;
  theme: Theme;
  window?: Window;
}

function CssVarsThemeProvider(props: CssVarsThemeProviderProps) {
  const { children, theme, window: appWindow } = props;
  invariant(isCssVarsTheme(theme), 'This provider only accepts CSS vars themes.');

  return (
    <ThemeProvider
      theme={theme}
      documentNode={appWindow?.document}
      colorSchemeNode={appWindow?.document.documentElement}
      disableNestedContext
      colorSchemeStorageKey={COLOR_SCHEME_STORAGE_KEY}
      modeStorageKey={MODE_STORAGE_KEY}
    >
      <InitColorSchemeScript
        attribute={COLOR_SCHEME_ATTRIBUTE}
        colorSchemeStorageKey={COLOR_SCHEME_STORAGE_KEY}
        modeStorageKey={MODE_STORAGE_KEY}
      />
      <CssVarsPaletteModeProvider>
        <CssBaseline enableColorScheme />
        {children}
      </CssVarsPaletteModeProvider>
    </ThemeProvider>
  );
}

interface AppThemeProviderProps {
  children: React.ReactNode;
  theme: AppTheme;
  window?: Window;
}

/**
 * @ignore - internal component.
 */
function AppThemeProvider(props: AppThemeProviderProps) {
  const { children, theme, ...rest } = props;

  const useCssVarsProvider = isCssVarsTheme(theme);

  return useCssVarsProvider ? (
    <CssVarsThemeProvider theme={theme} {...rest}>
      {children}
    </CssVarsThemeProvider>
  ) : (
    <LegacyThemeProvider theme={theme} {...rest}>
      {children}
    </LegacyThemeProvider>
  );
}

export { AppThemeProvider };
