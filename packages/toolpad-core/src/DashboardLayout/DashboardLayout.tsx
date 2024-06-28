'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  BrandingContext,
  NavigationContext,
  PaletteModeContext,
  RouterContext,
} from '../shared/context';
import type { Navigation, NavigationPageItem } from '../AppProvider';
import { ToolpadLogo } from './ToolpadLogo';

const DRAWER_WIDTH = 320;

const LogoContainer = styled('div')({
  position: 'relative',
  height: 40,
  '& img': {
    maxHeight: 40,
  },
});

interface DashboardSidebarSubNavigationProps {
  subNavigation: Navigation;
  basePath?: string;
  depth?: number;
}

function DashboardSidebarSubNavigation({
  subNavigation,
  basePath = '',
  depth = 0,
}: DashboardSidebarSubNavigationProps) {
  const routerContext = React.useContext(RouterContext);

  const pathname = routerContext?.pathname ?? '/';

  const initialExpandedSidebarItemIds = React.useMemo(
    () =>
      subNavigation
        .map((navigationItem, navigationItemIndex) => ({
          navigationItem,
          originalIndex: navigationItemIndex,
        }))
        .filter(
          ({ navigationItem }) =>
            (!navigationItem.kind || navigationItem.kind === 'page') &&
            navigationItem.children &&
            navigationItem.children.some((nestedNavigationItem) => {
              const navigationItemFullPath = `${basePath}${(nestedNavigationItem as NavigationPageItem).slug ?? ''}`;

              return (
                (!nestedNavigationItem.kind || nestedNavigationItem.kind === 'page') &&
                navigationItemFullPath === pathname
              );
            }),
        )
        .map(
          ({ navigationItem, originalIndex }) =>
            `${(navigationItem as NavigationPageItem).title}-${depth}-${originalIndex}`,
        ),
    [basePath, depth, pathname, subNavigation],
  );

  const [expandedSidebarItemIds, setExpandedSidebarItemIds] = React.useState(
    initialExpandedSidebarItemIds,
  );

  const handleSidebarItemClick = React.useCallback(
    (itemId: string) => () => {
      setExpandedSidebarItemIds((previousValue) =>
        previousValue.includes(itemId)
          ? previousValue.filter((previousValueItemId) => previousValueItemId !== itemId)
          : [...previousValue, itemId],
      );
    },
    [],
  );

  const handleLinkClick = React.useMemo(() => {
    if (!routerContext) {
      return undefined;
    }
    return (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const url = new URL(event.currentTarget.href);
      routerContext.navigate(url.pathname, { history: 'push' });
    };
  }, [routerContext]);

  return (
    <List sx={{ mb: depth === 0 ? 4 : 1, pl: 2 * depth }}>
      {subNavigation.map((navigationItem, navigationItemIndex) => {
        if (navigationItem.kind === 'header') {
          return (
            <ListSubheader key={`subheader-${depth}-${navigationItemIndex}`} component="div">
              {navigationItem.title}
            </ListSubheader>
          );
        }

        if (navigationItem.kind === 'divider') {
          const nextItem = subNavigation[navigationItemIndex + 1];

          return (
            <Divider
              key={`divider-${depth}-${navigationItemIndex}`}
              sx={{ mt: 1, mb: nextItem?.kind === 'header' ? 0 : 1 }}
            />
          );
        }

        const navigationItemFullPath = `${basePath}${navigationItem.slug ?? ''}`;

        const navigationItemId = `${navigationItem.title}-${depth}-${navigationItemIndex}`;

        const isNestedNavigationExpanded = expandedSidebarItemIds.includes(navigationItemId);

        const nestedNavigationCollapseIcon = isNestedNavigationExpanded ? (
          <ExpandLessIcon />
        ) : (
          <ExpandMoreIcon />
        );

        const listItem = (
          <ListItem>
            <ListItemButton
              selected={pathname === navigationItemFullPath}
              onClick={handleSidebarItemClick(navigationItemId)}
            >
              <ListItemIcon>{navigationItem.icon}</ListItemIcon>
              <ListItemText primary={navigationItem.title} />
              {navigationItem.children ? nestedNavigationCollapseIcon : null}
            </ListItemButton>
          </ListItem>
        );

        return (
          <React.Fragment key={navigationItemId}>
            {navigationItem.slug && !navigationItem.children ? (
              <a
                href={navigationItemFullPath}
                onClick={handleLinkClick}
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {listItem}
              </a>
            ) : (
              listItem
            )}

            {navigationItem.children ? (
              <Collapse in={isNestedNavigationExpanded} timeout="auto" unmountOnExit>
                <DashboardSidebarSubNavigation
                  subNavigation={navigationItem.children}
                  basePath={navigationItemFullPath}
                  depth={depth + 1}
                />
              </Collapse>
            ) : null}
          </React.Fragment>
        );
      })}
    </List>
  );
}

export interface DashboardLayoutProps {
  /**
   * The content of the dashboard.
   */
  children: React.ReactNode;
}

/**
 *
 * Demos:
 *
 * - [Dashboard Layout](https://mui.com/toolpad/core/react-dashboard-layout/)
 *
 * API:
 *
 * - [DashboardLayout API](https://mui.com/toolpad/core/api/dashboard-layout)
 */
function DashboardLayout(props: DashboardLayoutProps) {
  const { children } = props;

  const branding = React.useContext(BrandingContext);
  const navigation = React.useContext(NavigationContext);
  const { paletteMode, setPaletteMode, isDualTheme } = React.useContext(PaletteModeContext);

  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const toggleMode = React.useCallback(() => {
    setPaletteMode(paletteMode === 'dark' ? 'light' : 'dark');
  }, [paletteMode, setPaletteMode]);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        color="inherit"
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            <Stack direction="row" alignItems="center">
              <Box sx={{ mr: 1 }}>
                <LogoContainer>{branding?.logo ?? <ToolpadLogo size={40} />}</LogoContainer>
              </Box>
              <Typography
                variant="h6"
                sx={{ color: (theme) => (theme.vars ?? theme).palette.primary.main }}
              >
                {branding?.title ?? 'Toolpad'}
              </Typography>
            </Stack>
          </a>
          <Box sx={{ flexGrow: 1 }} />
          {hasMounted && isDualTheme ? (
            <Tooltip title={`${paletteMode === 'dark' ? 'Light' : 'Dark'} mode`} enterDelay={500}>
              <IconButton
                aria-label={`Switch to ${paletteMode === 'dark' ? 'light' : 'dark'} mode`}
                onClick={toggleMode}
              >
                {paletteMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          ) : null}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box
          component="nav"
          sx={{ overflow: 'auto', pt: navigation[0]?.kind === 'header' ? 0 : 2 }}
        >
          <DashboardSidebarSubNavigation subNavigation={navigation} />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Toolbar />
        <Container maxWidth="lg">{children}</Container>
      </Box>
    </Box>
  );
}

DashboardLayout.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the dashboard.
   */
  children: PropTypes.node,
} as any;

export { DashboardLayout };
