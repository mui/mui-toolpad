import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardActions,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  Skeleton,
  TextField,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import * as React from 'react';
import { LoadingButton } from '@mui/lab';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import client from '../api';
import DialogForm from './DialogForm';
import { App } from '../../prisma/generated/client';
import useLatest from '../utils/useLatest';
import ToolpadShell from './ToolpadShell';

export interface CreateAppDialogProps {
  open: boolean;
  onClose: () => void;
}

const AppCardMenuIconStyles = { fontSize: '1rem', mr: '0.5rem', color: 'grey.700' };

function CreateAppDialog({ onClose, ...props }: CreateAppDialogProps) {
  const [name, setName] = React.useState('');
  const createAppMutation = client.useMutation('createApp');

  return (
    <Dialog {...props} onClose={onClose}>
      <DialogForm
        onSubmit={async (event) => {
          event.preventDefault();

          const app = await createAppMutation.mutateAsync([name]);
          window.location.href = `/_toolpad/app/${app.id}/editor`;
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
            onChange={(event) => setName(event.target.value)}
          />
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
      <DialogForm>
        <DialogTitle>Confirm delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete application &quot;{latestApp?.name}&quot;
        </DialogContent>
        <DialogActions>
          <Button color="inherit" variant="text" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            loading={deleteAppMutation.isLoading}
            onClick={handleDeleteClick}
            color="error"
          >
            Delete
          </LoadingButton>
        </DialogActions>
      </DialogForm>
    </Dialog>
  );
}

interface AppCardProps {
  app?: App;
  onDelete?: () => void;
  onUpdate?: (app: App) => void;
}

function AppCard({ app, onDelete, onUpdate }: AppCardProps) {
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);

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
      if (app?.id && onUpdate) {
        onUpdate(await client.mutation.updateApp(app.id, name));
        // await client.refetchQueries('getApps');
      }
    },
    [app?.id, onUpdate],
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
      }
    },
    [app?.name],
  );

  React.useEffect(() => {
    if (appTitleInput.current && editingTitle) {
      appTitleInput.current.focus();
      appTitleInput.current.select();
    }
  }, [appTitleInput, editingTitle]);

  return (
    <React.Fragment>
      <Card sx={{ gridColumn: 'span 1' }}>
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
          title={
            editingTitle ? (
              <TextField
                variant="standard"
                size="small"
                inputRef={appTitleInput}
                sx={{ paddingBottom: '4px' }}
                InputProps={{ sx: { fontSize: '1.5rem', height: '1.5em' } }}
                onKeyUp={handleAppTitleInput}
                onBlur={handleAppTitleBlur}
                defaultValue={appTitle}
              />
            ) : (
              <Typography gutterBottom variant="h5" component="div">
                {app ? appTitle : <Skeleton />}
              </Typography>
            )
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              {app ? `Created: ${app.createdAt.toLocaleDateString('short')}` : <Skeleton />}
            </Typography>
          }
        />

        <CardActions>
          <Button
            size="small"
            component="a"
            href={app ? `/_toolpad/app/${app.id}/editor` : ''}
            disabled={!app}
          >
            Edit
          </Button>
          <Button size="small" component="a" href={app ? `deploy/${app.id}` : ''} disabled={!app}>
            View
          </Button>
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
          <DriveFileRenameOutlineIcon sx={AppCardMenuIconStyles} />
          Rename
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <FileCopyIcon sx={AppCardMenuIconStyles} /> Duplicate
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon sx={AppCardMenuIconStyles} />
          Delete
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
}

export default function Home() {
  const { data: apps = [], status, error } = client.useQuery('getApps', []);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  const [deletedApp, setDeletedApp] = React.useState<null | App>(null);

  const [updatedApp, setUpdatedApp] = React.useState<null | App>(null);

  const fetchedApps = React.useMemo(() => {
    if (updatedApp) {
      return apps.map((app) => (app.id === updatedApp.id ? updatedApp : app));
    }
    return apps;
  }, [updatedApp, apps]);

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
                return fetchedApps.length > 0
                  ? fetchedApps.map((app) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        onUpdate={setUpdatedApp}
                        onDelete={() => setDeletedApp(app)}
                      />
                    ))
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
