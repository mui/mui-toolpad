import * as React from 'react';
import { AppBar, Box, Toolbar, Tooltip, Chip, Link, useTheme } from '@mui/material';
import Image from 'next/image';
import UserFeedback from './UserFeedback';
import ThemeModeMenu from './ThemeModeMenu';
import { useThemeMode, ThemeMode } from '../../../ThemeContext';
import productIconDark from '../../../../public/product-icon-dark.svg';
import productIconLight from '../../../../public/product-icon-light.svg';

export interface HeaderProps {
  actions?: React.ReactNode;
  status?: React.ReactNode;
}

function Header({ actions, status }: HeaderProps) {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeMode();

  const handleThemeModeChange = React.useCallback(
    (event: React.MouseEvent, mode: ThemeMode) => {
      setThemeMode(mode);
    },
    [setThemeMode],
  );
  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{ zIndex: 2, borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'start',
          }}
        >
          <Tooltip title="Home">
            <Link
              color="inherit"
              aria-label="Home"
              href="/"
              underline="none"
              sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}
            >
              <Image
                src={theme.palette.mode === 'dark' ? productIconDark : productIconLight}
                alt="Toolpad product icon"
                width={25}
                height={25}
              />
              <Box
                data-testid="brand"
                sx={{
                  color: 'primary.main',
                  lineHeight: '21px',
                  fontSize: '16px',
                  fontWeight: 700,
                }}
              >
                MUI Toolpad
              </Box>
            </Link>
          </Tooltip>
          {process.env.TOOLPAD_DEMO ? (
            <Chip sx={{ ml: 2 }} label="Demo Version" color="primary" size="small" />
          ) : null}
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {actions}
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'end',
            gap: 2,
          }}
        >
          {status}
          <ThemeModeMenu mode={themeMode} onChange={handleThemeModeChange} />
          <UserFeedback />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
