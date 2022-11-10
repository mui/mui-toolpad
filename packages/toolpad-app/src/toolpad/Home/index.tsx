import * as React from 'react';
import {
  Button,
  Box,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  MenuItem,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Toolbar,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  Alert,
  AlertTitle,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import invariant from 'invariant';
import client from '../../api';
import DialogForm from '../../components/DialogForm';
import type { Deployment } from '../../../prisma/generated/client';
import ToolpadShell from '../ToolpadShell';
import getReadableDuration from '../../utils/readableDuration';
import type { AppMeta } from '../../server/data';
import useLocalStorageState from '../../utils/useLocalStorageState';
import ErrorAlert from '../AppEditor/PageEditor/ErrorAlert';
import config from '../../config';
import { AppTemplateId } from '../../types';
import AppOptions from '../AppOptions';
import AppNameEditable from '../AppOptions/AppNameEditable';
import { sendAppCreatedEvent } from '../../utils/ga';

export const APP_TEMPLATE_OPTIONS: Map<
  AppTemplateId,
  {
    label: string;
    description: string;
  }
> = new Map([
  [
    'blank',
    {
      label: 'Blank page',
      description: 'Start with an empty canvas',
    },
  ],
  [
    'stats',
    {
      label: 'Statistics',
      description: 'Table with statistics data',
    },
  ],
  [
    'images',
    {
      label: 'Images',
      description: 'Fetch remote images',
    },
  ],
]);

const NO_OP = () => {};

export interface CreateAppDialogProps {
  open: boolean;
  onClose: () => void;
}

function CreateAppDialog({ onClose, ...props }: CreateAppDialogProps) {
  const [name, setName] = React.useState('');
  const [appTemplateId, setAppTemplateId] = React.useState<AppTemplateId>('blank');
  const [dom, setDom] = React.useState('');
  const [isNavigating, setIsNavigating] = React.useState(false);

  const handleAppTemplateChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAppTemplateId(event.target.value as AppTemplateId);
    },
    [],
  );

  const handleDomChange = React.useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => setDom(event.target.value),
    [],
  );

  const createAppMutation = client.useMutation('createApp', {
    onSuccess: (app) => {
      window.location.href = `/_toolpad/app/${app.id}`;
      setIsNavigating(true);
    },
  });

  const isFormValid = Boolean(name);

  return (
    <Dialog {...props} onClose={config.isDemo ? NO_OP : onClose} maxWidth="xs">
      <DialogForm
        onSubmit={async (event) => {
          invariant(isFormValid, 'Invalid form should not be submitted when submit is disabled');

          event.preventDefault();
          let recaptchaToken;
          if (config.recaptchaSiteKey) {
            await new Promise<void>((resolve) => {
              grecaptcha.ready(resolve);
            });
            recaptchaToken = await grecaptcha.execute(config.recaptchaSiteKey, {
              action: 'submit',
            });
          }

          const appDom = dom.trim() ? JSON.parse(dom) : null;
          await createAppMutation.mutateAsync([
            name,
            {
              from: {
                ...(appDom
                  ? { kind: 'dom', dom: appDom }
                  : { kind: 'template', id: appTemplateId }),
              },
              recaptchaToken,
            },
          ]);

          sendAppCreatedEvent(name, appTemplateId);
        }}
      >
        <DialogTitle>Create a new MUI Toolpad App</DialogTitle>
        <DialogContent>
          {config.isDemo ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>For demo purposes only!</AlertTitle>
              Your application will be ephemeral and may be deleted at any time.
            </Alert>
          ) : null}
          <TextField
            sx={{ my: 1 }}
            required
            autoFocus
            fullWidth
            label="Name"
            value={name}
            error={createAppMutation.isError}
            helperText={(createAppMutation.error as Error)?.message || ''}
            onChange={(event) => {
              createAppMutation.reset();
              setName(event.target.value);
            }}
          />

          <TextField
            sx={{ my: 1 }}
            label="Use template"
            select
            fullWidth
            value={appTemplateId}
            onChange={handleAppTemplateChange}
          >
            {Array.from(APP_TEMPLATE_OPTIONS).map(([value, { label, description }]) => (
              <MenuItem key={value} value={value}>
                <span>
                  <Typography>{label}</Typography>
                  <Typography variant="caption">{description || ''}</Typography>
                </span>
              </MenuItem>
            ))}
          </TextField>

          {config.enableCreateByDom ? (
            <TextField
              sx={{ my: 1 }}
              label="Seed DOM"
              fullWidth
              multiline
              maxRows={10}
              value={dom}
              onChange={handleDomChange}
            />
          ) : null}
          {config.recaptchaSiteKey ? (
            <Typography variant="caption" color="text.secondary">
              This site is protected by reCAPTCHA and the Google{' '}
              <Link
                href="https://policies.google.com/privacy"
                underline="none"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                href="https://policies.google.com/terms"
                underline="none"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </Link>{' '}
              apply.
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            color="inherit"
            variant="text"
            onClick={() => {
              setName('');
              createAppMutation.reset();
              onClose();
            }}
            disabled={config.isDemo}
          >
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            loading={createAppMutation.isLoading || isNavigating}
            disabled={!isFormValid}
          >
            Create
          </LoadingButton>
        </DialogActions>
      </DialogForm>
    </Dialog>
  );
}

interface AppEditButtonProps {
  app?: AppMeta;
}

function AppEditButton({ app }: AppEditButtonProps) {
  return (
    <Button size="small" component="a" href={app ? `/_toolpad/app/${app.id}` : ''} disabled={!app}>
      Edit
    </Button>
  );
}

interface AppOpenButtonProps {
  app?: AppMeta;
  activeDeployment?: Deployment;
}

function AppOpenButton({ app, activeDeployment }: AppOpenButtonProps) {
  const openDisabled = !app || !activeDeployment;
  let openButton = (
    <Button disabled={!app || !activeDeployment} component="a" href={app ? `deploy/${app.id}` : ''}>
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
  return openButton;
}

interface AppCardProps {
  app?: AppMeta;
  activeDeployment?: Deployment;
  existingAppNames?: string[];
}

function AppCard({ app, activeDeployment, existingAppNames }: AppCardProps) {
  const [editingName, setEditingName] = React.useState<boolean>(false);

  const handleRename = React.useCallback(() => {
    setEditingName(true);
  }, []);

  return (
    <Card
      role="article"
      sx={{
        gridColumn: 'span 1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <CardHeader
        action={
          <AppOptions
            app={app}
            existingAppNames={existingAppNames}
            allowDelete
            allowDuplicate
            onRename={handleRename}
          />
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
        <AppNameEditable
          app={app}
          editing={editingName}
          setEditing={setEditingName}
          loading={Boolean(!app)}
          existingAppNames={existingAppNames}
        />
      </CardContent>
      <CardActions>
        <AppEditButton app={app} />
        <AppOpenButton app={app} activeDeployment={activeDeployment} />
      </CardActions>
    </Card>
  );
}

interface AppRowProps {
  app?: AppMeta;
  activeDeployment?: Deployment;
  existingAppNames?: string[];
}

function AppRow({ app, activeDeployment, existingAppNames }: AppRowProps) {
  const [editingName, setEditingName] = React.useState<boolean>(false);

  const handleRename = React.useCallback(() => {
    setEditingName(true);
  }, []);

  return (
    <TableRow hover role="row">
      <TableCell component="th" scope="row">
        <AppNameEditable
          loading={Boolean(!app)}
          app={app}
          editing={editingName}
          setEditing={setEditingName}
          existingAppNames={existingAppNames}
        />
        <Typography variant="caption">
          {app ? `Edited ${getReadableDuration(app.editedAt)}` : <Skeleton />}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={1} justifyContent={'flex-end'}>
          <AppEditButton app={app} />
          <AppOpenButton app={app} activeDeployment={activeDeployment} />
          <AppOptions
            app={app}
            existingAppNames={existingAppNames}
            allowDelete
            allowDuplicate
            onRename={handleRename}
          />
        </Stack>
      </TableCell>
    </TableRow>
  );
}

interface AppsViewProps {
  apps: AppMeta[];
  loading?: boolean;
  activeDeploymentsByApp: { [appId: string]: Deployment } | null;
  existingAppNames?: string[];
}

function AppsGridView({ loading, apps, activeDeploymentsByApp, existingAppNames }: AppsViewProps) {
  return (
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
        if (loading) {
          return <AppCard />;
        }
        if (apps.length <= 0) {
          return 'No apps yet';
        }
        return apps.map((app) => {
          const activeDeployment = activeDeploymentsByApp?.[app.id];
          return (
            <AppCard
              key={app.id}
              app={app}
              activeDeployment={activeDeployment}
              existingAppNames={existingAppNames}
            />
          );
        });
      })()}
    </Box>
  );
}

function AppsListView({ loading, apps, activeDeploymentsByApp, existingAppNames }: AppsViewProps) {
  return (
    <Table aria-label="apps list" size="medium">
      <TableBody>
        {(() => {
          if (loading) {
            return <AppRow />;
          }
          if (apps.length <= 0) {
            return (
              <TableRow>
                <TableCell>No apps yet</TableCell>
              </TableRow>
            );
          }
          return apps.map((app) => {
            const activeDeployment = activeDeploymentsByApp?.[app.id];
            return (
              <AppRow
                key={app.id}
                app={app}
                activeDeployment={activeDeployment}
                existingAppNames={existingAppNames}
              />
            );
          });
        })()}
      </TableBody>
    </Table>
  );
}

export default function Home() {
  const {
    data: apps = [],
    isLoading,
    error,
  } = client.useQuery('getApps', [], {
    enabled: !config.isDemo,
  });
  const { data: activeDeployments } = client.useQuery('getActiveDeployments', []);

  const existingAppNames = React.useMemo(() => {
    return apps.map((app) => app.name);
  }, [apps]);

  const activeDeploymentsByApp = React.useMemo(() => {
    if (!activeDeployments) {
      return null;
    }
    return Object.fromEntries(
      activeDeployments.map((deployment) => [deployment.appId, deployment]),
    );
  }, [activeDeployments]);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(config.isDemo);

  const [viewMode, setViewMode] = useLocalStorageState<string>('home-app-view-mode', 'list');

  const handleViewModeChange = React.useCallback(
    (event: React.MouseEvent, value: string) => setViewMode(value),
    [setViewMode],
  );

  const AppsView = viewMode === 'list' ? AppsListView : AppsGridView;

  return (
    <ToolpadShell>
      {!config.isDemo ? (
        <Container sx={{ my: 1 }}>
          <Typography variant="h2">Apps</Typography>
          <Toolbar variant={'dense'} disableGutters sx={{ justifyContent: 'space-between' }}>
            <Button onClick={() => setCreateDialogOpen(true)}>Create New</Button>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              aria-label="view mode"
            >
              <ToggleButton
                value="list"
                aria-label="list view"
                color={viewMode === 'list' ? 'primary' : undefined}
              >
                <ViewListIcon />
              </ToggleButton>
              <ToggleButton
                value="grid"
                aria-label="grid view"
                color={viewMode === 'grid' ? 'primary' : undefined}
              >
                <GridViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Toolbar>
          {error ? (
            <ErrorAlert error={error} />
          ) : (
            <AppsView
              apps={apps}
              loading={isLoading}
              activeDeploymentsByApp={activeDeploymentsByApp}
              existingAppNames={existingAppNames}
            />
          )}
        </Container>
      ) : null}
      <CreateAppDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />
    </ToolpadShell>
  );
}
