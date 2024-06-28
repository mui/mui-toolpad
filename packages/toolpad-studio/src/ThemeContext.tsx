import * as React from 'react';
import { PaletteMode, ScopedCssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
import useMediaQuery from '@mui/material/useMediaQuery';
import useLocalStorageState from '@toolpad/utils/hooks/useLocalStorageState';
import { getDesignTokens, getMetaThemeColor, getThemedComponents } from './theme';

interface ThemeProviderProps {
  children?: React.ReactNode;
}

export type ThemeMode = PaletteMode | 'system';

function usePreferredMode(): PaletteMode {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  return prefersDarkMode ? 'dark' : 'light';
}

export function useThemeMode() {
  const [themeMode, setThemeMode] = useLocalStorageState<ThemeMode>(
    'toolpad-palette-mode',
    'system',
  );
  return { themeMode, setThemeMode };
}

export function usePaletteMode(): PaletteMode {
  const preferredMode = usePreferredMode();
  const { themeMode } = useThemeMode();
  return themeMode === 'system' ? preferredMode : themeMode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const paletteMode = usePaletteMode();
  const theme = React.useMemo(() => {
    const brandingDesignTokens = getDesignTokens(paletteMode);
    let nextTheme = createTheme({
      ...brandingDesignTokens,
      palette: {
        ...brandingDesignTokens.palette,
        mode: paletteMode,
      },
    });
    nextTheme = deepmerge(nextTheme, getThemedComponents(nextTheme));

    return nextTheme;
  }, [paletteMode]);

  React.useMemo(() => {
    let meta: HTMLMetaElement | null = document.querySelector("meta[name='theme-color']");
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', getMetaThemeColor(paletteMode));
    meta.setAttribute('media', `(prefers-color-scheme: ${paletteMode})`);
  }, [paletteMode]);

  return (
    <MuiThemeProvider theme={theme}>
      <ScopedCssBaseline enableColorScheme>{children}</ScopedCssBaseline>
    </MuiThemeProvider>
  );
}
