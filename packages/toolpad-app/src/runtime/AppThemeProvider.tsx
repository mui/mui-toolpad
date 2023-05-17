import * as React from 'react';
import { createTheme, Theme, PaletteOptions, ThemeProvider } from '@mui/material';
import * as colors from '@mui/material/colors';
import * as appDom from '../appDom';
import { AppTheme } from '../types';

declare module '@mui/material/styles' {
  interface Theme {
    fontFamilyMonospaced: string;
  }
  // allow configuration using `createTheme`
  interface ThemeOptions {
    fontFamilyMonospaced?: string;
  }
}

function createMuiThemeFromToolpadTheme(toolpadTheme: AppTheme = {}): Theme {
  const palette: PaletteOptions = {};
  const primary = toolpadTheme['palette.primary.main'];
  if (primary) {
    palette.primary = (colors as any)[primary];
  }

  const secondary = toolpadTheme['palette.secondary.main'];
  if (secondary) {
    palette.secondary = (colors as any)[secondary];
  }

  const mode = toolpadTheme['palette.mode'];
  if (mode) {
    palette.mode = mode;
  }

  return createTheme({
    palette,
    typography: {
      h1: {
        fontSize: `3.25rem`,
        fontWeight: 800,
      },

      h2: {
        fontSize: `2.25rem`,
        fontWeight: 700,
      },

      h3: {
        fontSize: `1.75rem`,
        fontWeight: 700,
      },

      h4: {
        fontSize: `1.5rem`,
        fontWeight: 700,
      },

      h5: {
        fontSize: `1.25rem`,
        fontWeight: 700,
      },

      h6: {
        fontSize: `1.15rem`,
        fontWeight: 700,
      },
    },
    fontFamilyMonospaced: 'Consolas, Menlo, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
  });
}

export function createToolpadAppTheme(dom: appDom.AppDom): Theme {
  const root = appDom.getApp(dom);
  const { themes = [] } = appDom.getChildNodes(dom, root);
  const themeNode = themes.length > 0 ? themes[0] : null;
  const toolpadTheme: AppTheme = themeNode?.theme
    ? appDom.fromConstPropValues(themeNode.theme)
    : {};
  return createMuiThemeFromToolpadTheme(toolpadTheme);
}

export interface ThemeProviderProps {
  dom: appDom.AppDom;
  children?: React.ReactNode;
}

export default function AppThemeProvider({ dom, children }: ThemeProviderProps) {
  const theme = React.useMemo(() => createToolpadAppTheme(dom), [dom]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
