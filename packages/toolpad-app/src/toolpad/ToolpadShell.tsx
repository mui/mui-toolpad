import * as React from 'react';
import {
  styled,
  Alert,
  AppBar,
  Button,
  Box,
  Collapse,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Divider,
  ListItemText,
  Tooltip,
  Stack,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import useMenu from '../utils/useMenu';
import useLocalStorageState from '../utils/useLocalStorageState';

const DOCUMENTATION_URL = 'https://mui.com/toolpad/getting-started/setup/';
const REPORT_BUG_URL =
  'https://github.com/mui/mui-toolpad/issues/new?assignees=&labels=status%3A+needs+triage&template=1.bug.yml';
const FEATURE_REQUEST_URL = 'https://github.com/mui/mui-toolpad/issues';
const LATEST_RELEASE_API_URL = 'https://api.github.com/repos/mui/mui-toolpad/releases/latest';

const CURRENT_RELEASE_VERSION = `v${process.env.TOOLPAD_VERSION}`;

interface FeedbackMenuItemLinkProps {
  href: string;
  children: React.ReactNode;
}

function FeedbackMenuItemLink({ href, children }: FeedbackMenuItemLinkProps) {
  return (
    <MenuItem component="a" target="_blank" href={href}>
      <ListItemText>{children}</ListItemText>
      <OpenInNewIcon fontSize="inherit" sx={{ ml: 3, color: 'text.secondary' }} />
    </MenuItem>
  );
}

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

function UserFeedback() {
  const { buttonProps, menuProps } = useMenu();

  return (
    <React.Fragment>
      <Tooltip title="Help and resources">
        <IconButton {...buttonProps} color="inherit">
          <HelpOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Menu {...menuProps}>
        <FeedbackMenuItemLink href={DOCUMENTATION_URL}>Documentation</FeedbackMenuItemLink>
        <FeedbackMenuItemLink href={REPORT_BUG_URL}>Report bug</FeedbackMenuItemLink>
        <FeedbackMenuItemLink href={FEATURE_REQUEST_URL}>
          Request or upvote feature
        </FeedbackMenuItemLink>
        <Divider />
        <MenuItem disabled>Version {process.env.TOOLPAD_VERSION}</MenuItem>
      </Menu>
    </React.Fragment>
  );
}

function UpdateBanner() {
  const [latestVersion, setLatestVersion] = React.useState(CURRENT_RELEASE_VERSION);

  const [dismissedVersion, setDismissedVersion] = useLocalStorageState<string | null>(
    'update-banner-dismissed-version',
    null,
  );

  const showBanner = dismissedVersion !== CURRENT_RELEASE_VERSION;

  const handleDismissClick = React.useCallback(() => {
    setDismissedVersion(CURRENT_RELEASE_VERSION);
  }, [setDismissedVersion]);

  const [changelogPath, setChangelogPath] = React.useState('');

  // Fetch latest release from the Github API
  // https://developer.github.com/v3/repos/releases/#get-the-latest-release
  React.useEffect(() => {
    const fetchLatestRelease = async () => {
      const latestRelease = await (await fetch(LATEST_RELEASE_API_URL))?.json();
      if (latestRelease?.tag_name !== CURRENT_RELEASE_VERSION) {
        setLatestVersion(latestRelease?.tag_name);
        setChangelogPath(latestRelease?.html_url);
      }
    };
    fetchLatestRelease();
  }, []);

  return (
    <Collapse in={showBanner}>
      <Alert
        action={
          <Stack direction="row" sx={{ gap: 2 }}>
            <Button
              aria-label="update"
              color="inherit"
              endIcon={<OpenInNewIcon fontSize="inherit" />}
              component="a"
              target="_blank"
              href={DOCUMENTATION_URL}
            >
              Update
            </Button>
            <Button
              aria-label="view changelog"
              color="inherit"
              endIcon={<OpenInNewIcon fontSize="inherit" />}
              component="a"
              target="_blank"
              href={changelogPath}
            >
              View changelog
            </Button>
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleDismissClick}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Stack>
        }
        severity="info"
      >
        A new version <strong>{latestVersion}</strong> of Toolpad is available.
      </Alert>
    </Collapse>
  );
}

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
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          size="medium"
          edge="start"
          color="inherit"
          aria-label="Home"
          component="a"
          href={`/`}
        >
          <HomeIcon fontSize="medium" />
        </IconButton>
        <Typography data-test-id="brand" variant="h6" color="inherit" component="div">
          MUI Toolpad {process.env.TOOLPAD_TARGET}
        </Typography>
        {navigation}
        <Box flex={1} />
        {actions}
        <UserFeedback />
      </Toolbar>
    </AppBar>
  );
}

export default function ToolpadShell({ children, ...props }: ToolpadShellProps) {
  return (
    <ToolpadShellRoot>
      <Header {...props} />
      <UpdateBanner />
      <ViewPort>{children}</ViewPort>
    </ToolpadShellRoot>
  );
}
