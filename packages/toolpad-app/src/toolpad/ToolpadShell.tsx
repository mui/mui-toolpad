import * as React from 'react';
import { styled, AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

export interface ToolpadShellProps {
  navigation?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

const ToolpadShellRoot = styled('div')({
  width: '100vw',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
});

const ViewPort = styled('div')({
  flex: 1,
  overflow: 'auto',
  position: 'relative',
});

export interface HeaderProps {
  navigation?: React.ReactNode;
  actions?: React.ReactNode;
}

function Header({ actions, navigation }: HeaderProps) {
  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{ zIndex: 2, borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar>
        <IconButton
          size="medium"
          edge="start"
          color="inherit"
          aria-label="Home"
          sx={{ mr: 2 }}
          component="a"
          href={`/`}
        >
          <HomeIcon fontSize="medium" />
        </IconButton>
        <Typography
          data-test-id="brand"
          variant="h6"
          color="inherit"
          component="div"
          sx={{ mr: 2 }}
        >
          MUI Toolpad {process.env.TOOLPAD_TARGET}
        </Typography>
        {navigation}
        <Box flex={1} />
        {actions}
      </Toolbar>
    </AppBar>
  );
}

export default function ToolpadShell({ children, ...props }: ToolpadShellProps) {
  return (
    <ToolpadShellRoot>
      <Header {...props} />
      <ViewPort>{children}</ViewPort>
    </ToolpadShellRoot>
  );
}
