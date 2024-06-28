import { experimental_extendTheme as extendTheme } from '@mui/material/styles';
import type {} from '@mui/material/themeCssVarsAugmentation';

const baseTheme = extendTheme({
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
  typography: {
    h6: {
      fontWeight: '700',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
          borderWidth: 0,
          borderBottomWidth: 1,
          borderStyle: 'solid',
          borderColor: theme.vars.palette.divider,
          boxShadow: 'none',
        }),
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          backgroundColor: 'inherit',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.vars.palette.primary.dark,
          padding: 8,
        }),
      },
    },
    MuiListSubheader: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.vars.palette.grey['600'],
          fontSize: 12,
          fontWeight: '700',
          height: 40,
          paddingLeft: 32,
          [theme.getColorSchemeSelector('dark')]: {
            color: theme.vars.palette.grey['500'],
          },
        }),
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          paddingTop: 0,
          paddingBottom: 0,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          '&.Mui-selected': {
            '& .MuiListItemIcon-root': {
              color: theme.vars.palette.primary.dark,
            },
            '& .MuiTypography-root': {
              color: theme.vars.palette.primary.dark,
            },
            '& .MuiSvgIcon-root': {
              color: theme.vars.palette.primary.dark,
            },
            '& .MuiTouchRipple-child': {
              backgroundColor: theme.vars.palette.primary.dark,
            },
          },
          '& .MuiSvgIcon-root': {
            color: theme.vars.palette.action.active,
          },
        }),
      },
    },
    MuiListItemText: {
      styleOverrides: {
        root: {
          '& .MuiTypography-root': {
            fontWeight: '500',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 34,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderBottomWidth: 2,
          marginLeft: '16px',
          marginRight: '16px',
        },
      },
    },
  },
});

export { baseTheme };
