'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        background: {
          default: 'var(--mui-palette-grey-50)',
          defaultChannel: 'var(--mui-palette-grey-50)',
        },
      },
    },
    dark: {
      palette: {
        background: {
          default: 'var(--mui-palette-grey-900)',
          defaultChannel: 'var(--mui-palette-grey-900)',
        },
        text: {
          primary: 'var(--mui-palette-grey-200)',
          primaryChannel: 'var(--mui-palette-grey-200)',
        },
      },
    },
  },
  colorSchemeSelector: 'data-toolpad-color-scheme',
});

export default theme;
