import * as React from 'react';
import {
  Drawer,
  Box,
  List,
  ListSubheader,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
} from '@mui/material';
import { useNavigate, useLocation, useHref } from 'react-router-dom';
import * as appDom from '../appDom';

const NAV_LIST_SUBHEADER_ID = 'nav-list-subheader';

const DRAWER_WIDTH = 250; // px

interface AppNavigationProps {
  pages: appDom.PageNode[];
  isPreview?: boolean;
}

export default function AppNavigation({ pages, isPreview = false }: AppNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const href = useHref('');

  const handlePageClick = React.useCallback(
    (page: appDom.PageNode) => () => {
      navigate(`pages/${page.id}`);
    },
    [navigate],
  );

  const activePagePath = location.pathname.replace(href, '');

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      open
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      {isPreview ? <Toolbar /> : null}
      <Box>
        <List
          component="nav"
          subheader={
            <ListSubheader id={NAV_LIST_SUBHEADER_ID} sx={{ px: 4 }}>
              Pages
            </ListSubheader>
          }
          aria-labelledby={NAV_LIST_SUBHEADER_ID}
        >
          {pages.map((page) => (
            <ListItem key={page.id} onClick={handlePageClick(page)} disablePadding>
              <ListItemButton selected={activePagePath === `/pages/${page.id}`}>
                <ListItemText primary={page.name} sx={{ ml: 2 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
