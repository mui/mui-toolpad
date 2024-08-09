'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { styled, useTheme } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
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
import type {} from '@mui/material/themeCssVarsAugmentation';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import useSsr from '@toolpad/utils/hooks/useSsr';
import { Account } from '../Account';
import { Link } from '../shared/Link';
import {
  BrandingContext,
  NavigationContext,
  PaletteModeContext,
  RouterContext,
  WindowContext,
} from '../shared/context';
import type { Navigation, NavigationPageItem } from '../AppProvider';
import { ToolpadLogo } from './ToolpadLogo';
import {
  getItemTitle,
  getPageItemFullPath,
  hasSelectedNavigationChildren,
} from '../shared/navigation';
import { useApplicationTitle } from '../shared/branding';

const DRAWER_WIDTH = 320; // px

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  borderWidth: 0,
  borderBottomWidth: 1,
  borderStyle: 'solid',
  borderColor: (theme.vars ?? theme).palette.divider,
  boxShadow: 'none',
  // TODO: Temporary fix to issue reported in https://github.com/mui/material-ui/issues/43244
  left: 0,
  zIndex: theme.zIndex.drawer + 1,
}));

const LogoContainer = styled('div')({
  position: 'relative',
  height: 40,
  '& img': {
    maxHeight: 40,
  },
});

const NavigationListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: 8,
  '&.Mui-selected': {
    '& .MuiListItemIcon-root': {
      color: (theme.vars ?? theme).palette.primary.dark,
    },
    '& .MuiTypography-root': {
      color: (theme.vars ?? theme).palette.primary.dark,
    },
    '& .MuiSvgIcon-root': {
      color: (theme.vars ?? theme).palette.primary.dark,
    },
    '& .MuiTouchRipple-child': {
      backgroundColor: (theme.vars ?? theme).palette.primary.dark,
    },
  },
  '& .MuiSvgIcon-root': {
    color: (theme.vars ?? theme).palette.action.active,
  },
}));

function ThemeSwitcher() {
  const isSsr = useSsr();
  const theme = useTheme();

  const { paletteMode, setPaletteMode, isDualTheme } = React.useContext(PaletteModeContext);

  const toggleMode = React.useCallback(() => {
    setPaletteMode(paletteMode === 'dark' ? 'light' : 'dark');
  }, [paletteMode, setPaletteMode]);

  return isDualTheme ? (
    <Tooltip
      title={isSsr ? 'Switch mode' : `${paletteMode === 'dark' ? 'Light' : 'Dark'} mode`}
      enterDelay={1000}
    >
      <div>
        <IconButton
          aria-label={
            isSsr
              ? 'Switch theme mode'
              : `Switch to ${paletteMode === 'dark' ? 'light' : 'dark'} mode`
          }
          onClick={toggleMode}
          sx={{
            color: (theme.vars ?? theme).palette.primary.dark,
            padding: 1,
            marginRight: 1,
          }}
        >
          {theme.getColorSchemeSelector ? (
            <React.Fragment>
              <DarkModeIcon
                sx={{
                  display: 'inline',
                  [theme.getColorSchemeSelector('dark')]: {
                    display: 'none',
                  },
                }}
              />
              <LightModeIcon
                sx={{
                  display: 'none',
                  [theme.getColorSchemeSelector('dark')]: {
                    display: 'inline',
                  },
                }}
              />
            </React.Fragment>
          ) : (
            <React.Fragment>
              {isSsr || paletteMode !== 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
            </React.Fragment>
          )}
        </IconButton>
      </div>
    </Tooltip>
  ) : null;
}

interface DashboardSidebarSubNavigationProps {
  subNavigation: Navigation;
  basePath?: string;
  depth?: number;
  onSidebarLinkClick?: (item: NavigationPageItem) => void;
  validatedItemIds: Set<string>;
  uniqueItemPaths: Set<string>;
}

function DashboardSidebarSubNavigation({
  subNavigation,
  basePath = '',
  depth = 0,
  onSidebarLinkClick,
  validatedItemIds,
  uniqueItemPaths,
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
        .filter(({ navigationItem }) =>
          hasSelectedNavigationChildren(navigationItem, basePath, pathname),
        )
        .map(({ originalIndex }) => `${depth}-${originalIndex}`),
    [basePath, depth, pathname, subNavigation],
  );

  const [expandedSidebarItemIds, setExpandedSidebarItemIds] = React.useState(
    initialExpandedSidebarItemIds,
  );

  const handleLinkClick = React.useCallback(
    (item: NavigationPageItem) => () => {
      if (onSidebarLinkClick) {
        onSidebarLinkClick(item);
      }
    },
    [onSidebarLinkClick],
  );

  const handleOpenFolderClick = React.useCallback(
    (itemId: string) => () => {
      setExpandedSidebarItemIds((previousValue) =>
        previousValue.includes(itemId)
          ? previousValue.filter((previousValueItemId) => previousValueItemId !== itemId)
          : [...previousValue, itemId],
      );
    },
    [],
  );

  return (
    <List sx={{ padding: 0, mb: depth === 0 ? 4 : 1, pl: 2 * depth }}>
      {subNavigation.map((navigationItem, navigationItemIndex) => {
        if (navigationItem.kind === 'header') {
          return (
            <ListSubheader
              key={`subheader-${depth}-${navigationItemIndex}`}
              component="div"
              sx={{
                fontSize: 12,
                fontWeight: '700',
                height: 40,
                pl: 4,
              }}
            >
              {getItemTitle(navigationItem)}
            </ListSubheader>
          );
        }

        if (navigationItem.kind === 'divider') {
          const nextItem = subNavigation[navigationItemIndex + 1];

          return (
            <Divider
              key={`divider-${depth}-${navigationItemIndex}`}
              sx={{
                borderBottomWidth: 2,
                mx: 2,
                mt: 1,
                mb: nextItem?.kind === 'header' ? 0 : 1,
              }}
            />
          );
        }

        const navigationItemFullPath = getPageItemFullPath(basePath, navigationItem);

        const navigationItemId = `${depth}-${navigationItemIndex}`;

        const isNestedNavigationExpanded = expandedSidebarItemIds.includes(navigationItemId);

        const nestedNavigationCollapseIcon = isNestedNavigationExpanded ? (
          <ExpandLessIcon />
        ) : (
          <ExpandMoreIcon />
        );

        const listItem = (
          <ListItem sx={{ pt: 0, pb: 0 }}>
            <NavigationListItemButton
              selected={pathname === navigationItemFullPath && !navigationItem.children}
              {...(navigationItem.children
                ? {
                    onClick: handleOpenFolderClick(navigationItemId),
                  }
                : {
                    LinkComponent: Link,
                    href: navigationItemFullPath,
                    onClick: handleLinkClick(navigationItem),
                  })}
            >
              {navigationItem.icon ? (
                <ListItemIcon
                  sx={{
                    minWidth: 34,
                  }}
                >
                  {navigationItem.icon}
                </ListItemIcon>
              ) : null}
              <ListItemText
                primary={getItemTitle(navigationItem)}
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: '500',
                  },
                }}
              />
              {navigationItem.action ?? null}
              {navigationItem.children ? nestedNavigationCollapseIcon : null}
            </NavigationListItemButton>
          </ListItem>
        );

        if (process.env.NODE_ENV !== 'production' && !validatedItemIds.has(navigationItemId)) {
          if (!uniqueItemPaths.has(navigationItemFullPath)) {
            uniqueItemPaths.add(navigationItemFullPath);
          } else {
            console.warn(`Duplicate path in navigation: ${navigationItemFullPath}`);
          }

          validatedItemIds.add(navigationItemId);
        }

        return (
          <React.Fragment key={navigationItemId}>
            {listItem}

            {navigationItem.children ? (
              <Collapse in={isNestedNavigationExpanded} timeout="auto" unmountOnExit>
                <DashboardSidebarSubNavigation
                  subNavigation={navigationItem.children}
                  basePath={navigationItemFullPath}
                  depth={depth + 1}
                  onSidebarLinkClick={onSidebarLinkClick}
                  validatedItemIds={validatedItemIds}
                  uniqueItemPaths={uniqueItemPaths}
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
  const appWindow = React.useContext(WindowContext);
  const applicationTitle = useApplicationTitle();

  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = React.useState(false);

  const validatedItemIdsRef = React.useRef(new Set<string>());
  const uniqueItemPathsRef = React.useRef(new Set<string>());

  const handleSetMobileNavigationOpen = React.useCallback(
    (newOpen: boolean) => () => {
      setIsMobileNavigationOpen(newOpen);
    },
    [],
  );

  const toggleMobileNavigation = React.useCallback(() => {
    setIsMobileNavigationOpen((previousOpen) => !previousOpen);
  }, []);

  const handleNavigationItemClick = React.useCallback(() => {
    setIsMobileNavigationOpen(false);
  }, []);

  // If useEffect was used, the reset would also happen on the client render after SSR which we don't need
  React.useMemo(() => {
    validatedItemIdsRef.current = new Set();
    uniqueItemPathsRef.current = new Set();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const drawerContent = (
    <React.Fragment>
      <Toolbar />
      <Box component="nav" sx={{ overflow: 'auto', pt: navigation[0]?.kind === 'header' ? 0 : 2 }}>
        <DashboardSidebarSubNavigation
          subNavigation={navigation}
          onSidebarLinkClick={handleNavigationItemClick}
          validatedItemIds={validatedItemIdsRef.current}
          uniqueItemPaths={uniqueItemPathsRef.current}
        />
      </Box>
    </React.Fragment>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar color="inherit" position="fixed">
        {
          // TODO: (minWidth: 100vw) Temporary fix to issue reported in https://github.com/mui/material-ui/issues/43244
        }
        <Toolbar sx={{ backgroundColor: 'inherit', minWidth: '100vw' }}>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Tooltip
              title={`${isMobileNavigationOpen ? 'Close' : 'Open'} menu`}
              placement="right"
              enterDelay={1000}
            >
              <div>
                <IconButton
                  aria-label={`${isMobileNavigationOpen ? 'Close' : 'Open'} navigation menu`}
                  onClick={toggleMobileNavigation}
                  edge="start"
                  sx={{ ml: 0 }}
                >
                  {isMobileNavigationOpen ? <MenuOpenIcon /> : <MenuIcon />}
                </IconButton>
              </div>
            </Tooltip>
          </Box>
          <Box
            sx={{
              position: { xs: 'absolute', md: 'static' },
              left: { xs: '50%', md: 'auto' },
              transform: { xs: 'translateX(-50%)', md: 'none' },
            }}
          >
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              <Stack direction="row" alignItems="center">
                <LogoContainer>{branding?.logo ?? <ToolpadLogo size={40} />}</LogoContainer>
                <Typography
                  variant="h6"
                  sx={{
                    color: (theme) => (theme.vars ?? theme).palette.primary.main,
                    fontWeight: '700',
                    ml: 0.5,
                  }}
                >
                  {applicationTitle}
                </Typography>
              </Stack>
            </Link>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <ThemeSwitcher />
          <Account />
        </Toolbar>
      </AppBar>
      <Drawer
        container={appWindow?.document.body}
        variant="temporary"
        open={isMobileNavigationOpen}
        onClose={handleSetMobileNavigationOpen(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundImage: 'none',
            borderRight: (theme) => `1px solid ${(theme.vars ?? theme).palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundImage: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // TODO: Temporary fix to issue reported in https://github.com/mui/material-ui/issues/43244
          minWidth: { xs: isMobileNavigationOpen ? '100vw' : 'auto', md: 'auto' },
        }}
      >
        <Toolbar />
        {children}
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
