import * as React from 'react';
import {
  Box,
  Drawer,
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  AppBar,
  Toolbar,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  Tooltip,
  Button,
  useTheme,
  Link as MuiLink,
} from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import { PREVIEW_HEADER_HEIGHT } from './constants';
import { AuthContext } from './useAuth';
import productIconDark from '../../public/product-icon-dark.svg';
import productIconLight from '../../public/product-icon-light.svg';

function interopNextImg(img: any) {
  if (typeof img.src === 'string') {
    return img.src;
  }
  return img;
}

const productIconDarkSrc = interopNextImg(productIconDark);
const productIconLightSrc = interopNextImg(productIconLight);

const TOOLPAD_DISPLAY_MODE_URL_PARAM = 'toolpad-display';

// Url params that will be carried over to the next page
const RETAINED_URL_PARAMS = new Set([TOOLPAD_DISPLAY_MODE_URL_PARAM]);

export interface NavigationEntry {
  slug: string;
  displayName: string;
  hasShell?: boolean;
}

const DRAWER_WIDTH = 250; // px

interface AppPagesNavigationProps {
  activePageSlug?: string;
  pages: NavigationEntry[];
  clipped?: boolean;
  search?: string;
}

function AppPagesNavigation({
  activePageSlug,
  pages,
  clipped = false,
  search,
}: AppPagesNavigationProps) {
  const navListSubheaderId = React.useId();

  const theme = useTheme();

  const productIcon = theme.palette.mode === 'dark' ? productIconDarkSrc : productIconLightSrc;

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      open
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
        },
      }}
    >
      {clipped ? <Box sx={{ height: PREVIEW_HEADER_HEIGHT }} /> : null}
      <MuiLink
        component={Link}
        color="inherit"
        aria-label="Go to home page"
        to="/"
        underline="none"
        sx={{
          ml: 3,
          mt: 2,
          mb: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <img src={productIcon} alt="Toolpad logo" width={35} height={35} />
        <Box
          data-testid="brand"
          sx={{
            color: 'primary.main',
            lineHeight: '21px',
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: 0,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Toolpad Studio
        </Box>
      </MuiLink>
      <List component="nav" sx={{ px: 2 }} aria-labelledby={navListSubheaderId}>
        {pages.map((page) => (
          <ListItem
            key={page.slug}
            disablePadding
            sx={{
              borderRadius: '24px',
              overflow: 'hidden',
            }}
          >
            <ListItemButton
              component={Link}
              to={`pages/${page.slug}${search}`}
              selected={activePageSlug === page.slug}
            >
              <ListItemText
                primary={page.displayName}
                primaryTypographyProps={{ fontSize: '14px' }}
                sx={{ ml: 2 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export interface ToolpadAppLayoutProps {
  activePageSlug?: string;
  pages?: NavigationEntry[];
  hasNavigation?: boolean;
  hasHeader?: boolean;
  children?: React.ReactNode;
  clipped?: boolean;
}

export function AppLayout({
  activePageSlug,
  pages = [],
  hasNavigation: hasNavigationProp = true,
  hasHeader = false,
  children,
  clipped,
}: ToolpadAppLayoutProps) {
  const theme = useTheme();

  const [urlParams] = useSearchParams();

  const retainedSearch = React.useMemo(() => {
    for (const name of urlParams.keys()) {
      if (!RETAINED_URL_PARAMS.has(name)) {
        urlParams.delete(name);
      }
    }

    return urlParams.size > 0 ? `?${urlParams.toString()}` : '';
  }, [urlParams]);

  const navEntry = pages.find((page) => page.slug === activePageSlug);

  const displayMode = urlParams.get(TOOLPAD_DISPLAY_MODE_URL_PARAM);

  const hasShell = navEntry?.hasShell !== false && displayMode !== 'standalone';

  const hasNavigation = hasNavigationProp && hasShell;

  const { session, signOut, isSigningIn } = React.useContext(AuthContext);

  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleSignOut = React.useCallback(() => {
    signOut();
    handleCloseUserMenu();
  }, [signOut]);

  return (
    <Box sx={{ flex: 1, display: 'flex' }}>
      {hasNavigation ? (
        <AppPagesNavigation
          activePageSlug={activePageSlug}
          pages={pages}
          clipped={clipped}
          search={retainedSearch}
        />
      ) : null}
      <Box sx={{ minWidth: 0, flex: 1, position: 'relative', flexDirection: 'column' }}>
        {hasHeader ? (
          <React.Fragment>
            <AppBar
              position="fixed"
              color="inherit"
              sx={{
                boxShadow: 'none',
              }}
            >
              {clipped ? <Box sx={{ height: PREVIEW_HEADER_HEIGHT }} /> : null}
              <Toolbar variant="dense">
                <Stack flex={1} direction="row" alignItems="center" justifyContent="end">
                  {session?.user && !isSigningIn ? (
                    <React.Fragment>
                      <Button color="inherit" onClick={handleOpenUserMenu}>
                        <Typography variant="body2" sx={{ mr: 2, textTransform: 'none' }}>
                          {session.user.name || session.user.email}
                        </Typography>
                        <Tooltip title="User settings">
                          <Avatar
                            alt={session.user.name || session.user.email}
                            src={session.user.image}
                            imgProps={{
                              referrerPolicy: 'no-referrer',
                            }}
                            sx={{
                              bgcolor: theme.palette.secondary.main,
                              width: 32,
                              height: 32,
                            }}
                          />
                        </Tooltip>
                      </Button>
                      <Menu
                        sx={{ mt: '45px' }}
                        id="menu-appbar-user"
                        anchorEl={anchorElUser}
                        anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                        }}
                        open={Boolean(anchorElUser)}
                        onClose={handleCloseUserMenu}
                      >
                        <MenuItem onClick={handleSignOut}>
                          <ListItemText>Sign out</ListItemText>
                        </MenuItem>
                      </Menu>
                    </React.Fragment>
                  ) : null}
                </Stack>
              </Toolbar>
            </AppBar>
            <Toolbar variant="dense" />
          </React.Fragment>
        ) : null}
        {children}
      </Box>
    </Box>
  );
}
