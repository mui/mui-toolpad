import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  TextField,
  Toolbar,
  Typography,
  Box,
  Tooltip,
} from '@mui/material';
import * as React from 'react';
import { LoadingButton } from '@mui/lab';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import client from '../api';
import DialogForm from './DialogForm';
import type { App, Deployment } from '../../prisma/generated/client';
import useLatest from '../utils/useLatest';
import ToolpadShell from './ToolpadShell';
import getReadableDuration from '../utils/readableDuration';
import EditableText from './EditableText';

export interface CreateAppDialogProps {
  open: boolean;
  onClose: () => void;
}

function CreateAppDialog({ onClose, ...props }: CreateAppDialogProps) {
  const [name, setName] = React.useState('');
  const createAppMutation = client.useMutation('createApp');
  const [showAppNameErrorAlert, setShowNameErrorAlert] = React.useState<boolean>(false);

  return (
    <React.Fragment>
      <Dialog {...props} onClose={onClose}>
        <DialogForm
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              const app = await createAppMutation.mutateAsync([name]);
              window.location.href = `/_toolpad/app/${app.id}/editor`;
            } catch (err) {
              setShowNameErrorAlert(true);
            }
          }}
        >
          <DialogTitle>Create a new MUI Toolpad App</DialogTitle>
          <DialogContent>
            <TextField
              sx={{ my: 1 }}
              autoFocus
              fullWidth
              label="name"
              value={name}
              onChange={(event) => {
                if (showAppNameErrorAlert) {
                  setShowNameErrorAlert(false);
                }
                setName(event.target.value);
              }}
            />
            {showAppNameErrorAlert ? (
              <Alert action={<React.Fragment />} severity="error">
                An app named &quot;{name}&quot; already exists
              </Alert>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button color="inherit" variant="text" onClick={onClose}>
              Cancel
            </Button>
            <LoadingButton type="submit" loading={createAppMutation.isLoading} disabled={!name}>
              Create
            </LoadingButton>
          </DialogActions>
        </DialogForm>
      </Dialog>
    </React.Fragment>
  );
}

export interface AppDeleteDialogProps {
  app: App | null;
  onClose: () => void;
}

function AppDeleteDialog({ app, onClose }: AppDeleteDialogProps) {
  const latestApp = useLatest(app);
  const deleteAppMutation = client.useMutation('deleteApp');

  const handleDeleteClick = React.useCallback(async () => {
    if (app) {
      await deleteAppMutation.mutateAsync([app.id]);
    }
    await client.refetchQueries('getApps');
    onClose();
  }, [app, deleteAppMutation, onClose]);

  return (
    <Dialog open={!!app} onClose={onClose}>
      <DialogTitle>Confirm delete</DialogTitle>
      <DialogContent>
        Are you sure you want to delete application &quot;{latestApp?.name}&quot;
      </DialogContent>
      <DialogActions>
        <Button color="inherit" variant="text" onClick={onClose}>
          Cancel
        </Button>
        <LoadingButton
          loading={deleteAppMutation.isLoading}
          onClick={handleDeleteClick}
          color="error"
        >
          Delete
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

export interface AppRenameErrorDialogProps {
  open: boolean;
  title: string | undefined;
  content: string | undefined;
  onContinue: () => void;
  onDiscard: () => void;
}

function AppRenameErrorDialog({
  open,
  title,
  content,
  onContinue,
  onDiscard,
}: AppRenameErrorDialogProps) {
  return (
    <Dialog open={open} onClose={onDiscard}>
      <DialogForm>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          <Button onClick={onDiscard} color={'error'}>
            Discard
          </Button>
          <Button color="inherit" variant="text" onClick={onContinue}>
            Keep editing
          </Button>
        </DialogActions>
      </DialogForm>
    </Dialog>
  );
}

interface AppCardProps {
  app?: App;
  activeDeployment?: Deployment;
  onDelete?: () => void;
}

function AppCard({ app, activeDeployment, onDelete }: AppCardProps) {
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [showAppRenameErrorDialog, setShowAppRenameErrorDialog] = React.useState<boolean>(false);
  const [editingTitle, setEditingTitle] = React.useState<boolean>(false);
  const [appTitle, setAppTitle] = React.useState<string | undefined>(app?.name);
  const appTitleInput = React.useRef<HTMLInputElement | null>(null);

  const menuOpen = Boolean(menuAnchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = React.useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleRenameClick = React.useCallback(() => {
    setMenuAnchorEl(null);
    setEditingTitle(true);
  }, []);

  const handleDeleteClick = React.useCallback(() => {
    setMenuAnchorEl(null);
    if (onDelete) {
      onDelete();
    }
  }, [onDelete]);

  const handleAppRename = React.useCallback(
    async (name: string) => {
      if (app?.id) {
        try {
          await client.mutation.updateApp(app.id, name);
          await client.refetchQueries('getApps');
        } catch (err) {
          setShowAppRenameErrorDialog(true);
        }
      }
    },
    [app?.id],
  );

  const handleAppTitleBlur = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setEditingTitle(false);
      handleAppRename(event.target.value);
    },
    [handleAppRename],
  );

  const handleAppTitleInput = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      setAppTitle((event.target as HTMLInputElement).value);
      if (event.key === 'Escape') {
        if (appTitleInput.current?.value && app?.name) {
          setAppTitle(app.name);
          appTitleInput.current.value = app.name;
        }
        setEditingTitle(false);
        return;
      }
      if (event.key === 'Enter') {
        setEditingTitle(false);
        handleAppRename((event.target as HTMLInputElement).value);
      }
    },
    [app?.name, handleAppRename],
  );

  React.useEffect(() => {
    if (appTitleInput.current && editingTitle) {
      appTitleInput.current.focus();
      appTitleInput.current.select();
    }
  }, [appTitleInput, editingTitle]);

  const openDisabled = !app || !activeDeployment;
  let openButton = (
    <Button
      disabled={!app || !activeDeployment}
      size="small"
      component="a"
      href={app ? `deploy/${app.id}` : ''}
    >
      Open
    </Button>
  );

  if (openDisabled) {
    openButton = (
      <Tooltip title="The app hasn't been deployed yet">
        <span>{openButton}</span>
      </Tooltip>
    );
  }

  return (
    <React.Fragment>
      <Card
        sx={{
          gridColumn: 'span 1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <CardHeader
          action={
            <IconButton
              aria-label="settings"
              aria-controls={menuOpen ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={menuOpen ? 'true' : undefined}
              onClick={handleMenuClick}
            >
              <MoreVertIcon />
            </IconButton>
          }
          disableTypography
          subheader={
            <Typography variant="body2" color="text.secondary">
              {app ? (
                <Tooltip title={app.editedAt.toLocaleString('short')}>
                  <span>Edited {getReadableDuration(app.editedAt)}</span>
                </Tooltip>
              ) : (
                <Skeleton />
              )}
            </Typography>
          }
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <EditableText
            onBlur={handleAppTitleBlur}
            onKeyUp={handleAppTitleInput}
            editing={editingTitle}
            loading={Boolean(!app)}
            defaultValue={appTitle}
            variant={'h5'}
            ref={appTitleInput}
          />
        </CardContent>
        <CardActions>
          <Button
            size="small"
            component="a"
            href={app ? `/_toolpad/app/${app.id}/editor` : ''}
            disabled={!app}
          >
            Edit
          </Button>
          {openButton}
        </CardActions>
      </Card>
      <Menu
        id="basic-menu"
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
          dense: true,
        }}
      >
        <MenuItem onClick={handleRenameClick}>
          <ListItemIcon>
            <DriveFileRenameOutlineIcon />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      <AppRenameErrorDialog
        open={showAppRenameErrorDialog}
        title={`Can't rename app "${app?.name}"`}
        content={`An app with the name "${appTitle}" already exists`}
        onDiscard={() => {
          setEditingTitle(false);
          setAppTitle(app?.name);
          setShowAppRenameErrorDialog(false);
        }}
        onContinue={() => {
          setEditingTitle(true);
          setShowAppRenameErrorDialog(false);
        }}
      />
    </React.Fragment>
  );
}

export default function Home() {
  const { data: apps = [], status, error } = client.useQuery('getApps', []);
  const { data: activeDeployments } = client.useQuery('getActiveDeployments', []);

  const activeDeploymentsByApp = React.useMemo(() => {
    if (!activeDeployments) {
      return null;
    }
    return Object.fromEntries(
      activeDeployments.map((deployment) => [deployment.appId, deployment]),
    );
  }, [activeDeployments]);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  const [deletedApp, setDeletedApp] = React.useState<null | App>(null);

  return (
    <ToolpadShell>
      <AppDeleteDialog app={deletedApp} onClose={() => setDeletedApp(null)} />
      <Container>
        <Typography variant="h2">Apps</Typography>
        <CreateAppDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />

        <Toolbar disableGutters>
          <Button onClick={() => setCreateDialogOpen(true)}>Create New</Button>
        </Toolbar>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              lg: 'repeat(4, 1fr)',
              md: 'repeat(3, 1fr)',
              sm: 'repeat(2, fr)',
              xs: 'repeat(1, fr)',
            },
            gap: 2,
          }}
        >
          {(() => {
            switch (status) {
              case 'loading':
                return <AppCard />;
              case 'error':
                return <Alert severity="error">{(error as Error)?.message}</Alert>;
              case 'success':
                return apps.length > 0
                  ? apps.map((app) => {
                      const activeDeployment = activeDeploymentsByApp?.[app.id];
                      return (
                        <AppCard
                          key={app.id}
                          app={app}
                          activeDeployment={activeDeployment}
                          onDelete={() => setDeletedApp(app)}
                        />
                      );
                    })
                  : 'No apps yet';
              default:
                return '';
            }
          })()}
        </Box>
      </Container>
    </ToolpadShell>
  );
}
