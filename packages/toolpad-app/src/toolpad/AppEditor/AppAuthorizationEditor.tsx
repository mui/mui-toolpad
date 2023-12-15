import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  Link,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Tab,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRowModel,
  GridRowModes,
  GridRowModesModel,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import { TabContext, TabList } from '@mui/lab';
import { useAppState, useAppStateApi } from '../AppState';
import * as appDom from '../../appDom';
import { AuthProvider } from '../../types';
import TabPanel from '../../components/TabPanel';

const AUTH_PROVIDERS = new Map([
  ['github', { name: 'GitHub', Icon: GitHubIcon }],
  ['google', { name: 'Google', Icon: GoogleIcon }],
]);

export function AppAuthenticationEditor() {
  const { dom } = useAppState();
  const appState = useAppStateApi();

  const handleAuthProvidersChange = React.useCallback(
    (event: SelectChangeEvent<AuthProvider[]>) => {
      const {
        target: { value: providers },
      } = event;

      appState.update((draft) => {
        const app = appDom.getApp(draft);

        draft = appDom.setNodeNamespacedProp(draft, app, 'attributes', 'authorization', {
          ...app.attributes?.authorization,
          providers: (typeof providers === 'string'
            ? providers.split(',')
            : providers) as AuthProvider[],
        });

        return draft;
      });
    },
    [appState],
  );

  const appNode = appDom.getApp(dom);
  const authorization = appNode.attributes.authorization;

  const authProviders = React.useMemo(
    () => authorization?.providers ?? [],
    [authorization?.providers],
  );

  return (
    <Stack direction="column">
      <FormControl>
        <InputLabel id="auth-providers-label">Authentication providers</InputLabel>
        <Select<AuthProvider[]>
          labelId="auth-providers-label"
          label="Authentication providers"
          id="auth-providers"
          multiple
          value={authProviders}
          onChange={handleAuthProvidersChange}
          fullWidth
          renderValue={(selected) =>
            selected
              .map((selectedValue) => AUTH_PROVIDERS.get(selectedValue)?.name ?? '')
              .join(', ')
          }
        >
          {[...AUTH_PROVIDERS].map(([value, { name, Icon }]) => (
            <MenuItem key={value} value={value}>
              <Stack direction="row" alignItems="center">
                <Checkbox checked={authProviders.indexOf(value as AuthProvider) > -1} />
                <Icon fontSize="small" />
                <Typography ml={1}>{name}</Typography>
              </Stack>
            </MenuItem>
          ))}
        </Select>
        <FormHelperText id="auth-providers-helper-text">
          If set, only authenticated users can use the app.
        </FormHelperText>
      </FormControl>
      <Alert severity="info" sx={{ mt: 1 }}>
        Certain environment variables must be set for authentication providers to work.{' '}
        <Link href="/" target="_blank">
          Learn how to set up authentication
        </Link>
        .
      </Alert>
    </Stack>
  );
}

interface RolesToolbarProps {
  addNewRoleDisabled: boolean;
  onAddNewRole: () => void;
}

function RolesToolbar({ addNewRoleDisabled, onAddNewRole }: RolesToolbarProps) {
  return (
    <GridToolbarContainer>
      <Button
        color="primary"
        startIcon={<AddIcon />}
        onClick={onAddNewRole}
        disabled={addNewRoleDisabled}
      >
        Add role
      </Button>
    </GridToolbarContainer>
  );
}

interface Role {
  name: string;
  description?: string;
}

interface RoleRow extends Role {
  id: string;
  pages: string[];
  isNew?: boolean;
}

export function AppRolesEditor() {
  const { dom } = useAppState();
  const appState = useAppStateApi();

  const [draftRow, setDraftRow] = React.useState<RoleRow | null>(null);

  const addRole = React.useCallback(
    (role: Role) => {
      appState.update((draft) => {
        const app = appDom.getApp(draft);

        draft = appDom.setNodeNamespacedProp(draft, app, 'attributes', 'authorization', {
          ...app.attributes?.authorization,
          roles: [...(app.attributes?.authorization?.roles ?? []), role],
        });

        return draft;
      });
    },
    [appState],
  );

  const updateRole = React.useCallback(
    (name: string, values: Omit<Role, 'name'>) => {
      appState.update((draft) => {
        const app = appDom.getApp(draft);

        draft = appDom.setNodeNamespacedProp(draft, app, 'attributes', 'authorization', {
          ...app.attributes?.authorization,
          roles: (app.attributes?.authorization?.roles ?? []).map((role) => {
            if (role.name === name) {
              return {
                ...role,
                ...values,
              };
            }
            return role;
          }),
        });

        return draft;
      });
    },
    [appState],
  );

  const deleteRole = React.useCallback(
    (name: string) => {
      appState.update((draft) => {
        const app = appDom.getApp(draft);

        draft = appDom.setNodeNamespacedProp(draft, app, 'attributes', 'authorization', {
          ...app.attributes?.authorization,
          roles: (app.attributes?.authorization?.roles ?? []).filter((role) => role.name !== name),
        });

        return draft;
      });
    },
    [appState],
  );

  const rolesRows = React.useMemo<RoleRow[]>(() => {
    const appNode = appDom.getApp(dom);
    const authorization = appNode.attributes.authorization;
    const roles = authorization?.roles;

    const { pages = [] } = appDom.getChildNodes(dom, appNode);

    const existingRows =
      roles?.map((role) => ({
        ...role,
        id: role.name,
        pages: pages
          .filter((page) => page.attributes.authorization?.allowedRoles?.includes(role.name))
          .map((page) => page.name),
      })) ?? [];

    return [...existingRows, ...(draftRow ? [draftRow] : [])];
  }, [dom, draftRow]);

  const rolesColumns = React.useMemo<GridColDef[]>(() => {
    return [
      {
        field: 'name',
        headerName: 'Name',
        editable: true,
        flex: 0.25,
      },
      {
        field: 'description',
        headerName: 'Description',
        editable: true,
        flex: 1,
      },
      {
        field: 'pages',
        headerName: 'Pages',
        type: 'number',
        renderCell: ({ value }) => {
          const previewLength = 3;
          const preview = `${value.slice(0, previewLength).join(', ')}${
            value.length > previewLength ? '...' : ''
          }`;
          return (
            <Tooltip title={preview}>
              <span>{value.length}</span>
            </Tooltip>
          );
        },
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: '',
        width: 50,
        cellClassName: 'actions',
        getActions: ({ row }) => {
          const isBlockedByPages = row.pages.length > 0;

          const deleteButton = (
            <GridActionsCellItem
              key="delete"
              disabled={isBlockedByPages || row.isNew}
              icon={<DeleteIcon />}
              label="Delete"
              onClick={() => deleteRole(row.name)}
              color="inherit"
            />
          );

          return [
            isBlockedByPages ? (
              <Tooltip
                key="delete"
                title="This role can't be deleted because it is still associated with existing pages."
              >
                <span>{deleteButton}</span>
              </Tooltip>
            ) : (
              deleteButton
            ),
          ];
        },
      },
    ];
  }, [deleteRole]);

  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const processRowUpdate = (
    newRow: GridRowModel<RoleRow>,
    oldRow: GridRowModel<RoleRow>,
  ): RoleRow => {
    setDraftRow(null);

    if (!newRow.name) {
      throw new Error(`Invalid row`);
    }

    const exists = rolesRows.some((row) => row.id !== newRow.id && row.name === newRow.name);

    if (exists) {
      throw new Error(`Role "${newRow.name}" already exists`);
    }

    if (oldRow.isNew) {
      addRole({
        name: newRow.name,
        description: newRow.description,
      });
    } else {
      updateRole(newRow.name, {
        description: newRow.description,
      });
    }

    return {
      ...newRow,
      id: newRow.name,
      pages: [],
      isNew: false,
    };
  };

  const handleAddNewRole = React.useCallback(() => {
    const draftRowId = `<draft_row>-${Math.random()}`;
    setDraftRow({ id: draftRowId, name: '', description: '', pages: [], isNew: true });
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [draftRowId]: { mode: GridRowModes.Edit, fieldToFocus: 'name' },
    }));
  }, []);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      style={{ height: 350, width: '100%' }}
      onKeyDown={(event) => {
        if (Object.keys(rowModesModel).length > 0) {
          // Avoid the escape key from closing a dialog this grid is rendered in
          event.stopPropagation();
        }
      }}
    >
      <DataGrid
        rows={rolesRows}
        columns={rolesColumns}
        hideFooter
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        processRowUpdate={processRowUpdate}
        // onProcessRowUpdateError={(error) => console.log(error)}
        isCellEditable={(params) => {
          if (params.field === 'name') {
            return !!params.row.isNew;
          }
          return true;
        }}
        slots={{
          toolbar: RolesToolbar,
        }}
        slotProps={{
          toolbar: {
            onAddNewRole: handleAddNewRole,
            addNewRoleDisabled: !!draftRow,
          },
        }}
        autoHeight
      />
    </div>
  );
}

interface UsersToolbarProps {
  addNewUserDisabled: boolean;
  onAddNewUser: () => void;
}

function UsersToolbar({ addNewUserDisabled, onAddNewUser }: UsersToolbarProps) {
  return (
    <GridToolbarContainer>
      <Button
        color="primary"
        startIcon={<AddIcon />}
        onClick={onAddNewUser}
        disabled={addNewUserDisabled}
      >
        Add user
      </Button>
    </GridToolbarContainer>
  );
}

interface User {
  email: string;
  roles: string[];
}

interface UserRow extends User {
  id: string;
  isNew?: boolean;
}

export function AppAuthorizationUsersEditor() {
  const { dom } = useAppState();
  const appState = useAppStateApi();

  const [draftRow, setDraftRow] = React.useState<UserRow | null>(null);

  const appNode = appDom.getApp(dom);
  const authorization = appNode.attributes.authorization;

  const addUser = React.useCallback(
    (user: User) => {
      appState.update((draft) => {
        const app = appDom.getApp(draft);

        draft = appDom.setNodeNamespacedProp(draft, app, 'attributes', 'authorization', {
          ...app.attributes?.authorization,
          users: [...(app.attributes?.authorization?.users ?? []), user],
        });

        return draft;
      });
    },
    [appState],
  );

  const updateUser = React.useCallback(
    (email: string, values: Omit<User, 'email'>) => {
      appState.update((draft) => {
        const app = appDom.getApp(draft);

        draft = appDom.setNodeNamespacedProp(draft, app, 'attributes', 'authorization', {
          ...app.attributes?.authorization,
          users: (app.attributes?.authorization?.users ?? []).map((user) => {
            if (user.email === email) {
              return {
                ...user,
                ...values,
              };
            }
            return user;
          }),
        });

        return draft;
      });
    },
    [appState],
  );

  const deleteUser = React.useCallback(
    (email: string) => {
      appState.update((draft) => {
        const app = appDom.getApp(draft);

        draft = appDom.setNodeNamespacedProp(draft, app, 'attributes', 'authorization', {
          ...app.attributes?.authorization,
          users: (app.attributes?.authorization?.users ?? []).filter(
            (user) => user.email !== email,
          ),
        });

        return draft;
      });
    },
    [appState],
  );

  const handleEditRoles = React.useCallback(
    (email: string) => (event: SelectChangeEvent<AuthProvider[]>) => {
      const {
        target: { value: roles },
      } = event;

      appState.update((draft) => {
        const app = appDom.getApp(draft);

        draft = appDom.setNodeNamespacedProp(draft, app, 'attributes', 'authorization', {
          ...app.attributes?.authorization,
          users: (app.attributes?.authorization?.users ?? []).map((user) => {
            if (user.email === email) {
              return {
                ...user,
                roles: (typeof roles === 'string' ? roles.split(',') : roles) as string[],
              };
            }
            return user;
          }),
        });

        return draft;
      });
    },
    [appState],
  );

  const usersRows = React.useMemo<UserRow[]>(() => {
    const users = authorization?.users;

    const existingRows =
      users?.map((user) => ({
        ...user,
        id: user.email,
      })) ?? [];

    return [...existingRows, ...(draftRow ? [draftRow] : [])];
  }, [authorization?.users, draftRow]);

  const usersColumns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'email',
        headerName: 'Email',
        editable: true,
        flex: 0.25,
      },
      {
        field: 'roles',
        headerName: 'Roles',
        renderCell: ({ row, value }) => {
          return (
            <Select
              multiple
              value={value}
              onChange={handleEditRoles(row.email)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((selectedValue) => (
                    <Chip key={selectedValue} label={selectedValue} size="small" />
                  ))}
                </Box>
              )}
              fullWidth
              sx={{ height: '100%' }}
            >
              {(authorization?.roles ?? []).map((role) => (
                <MenuItem key={role.name} value={role.name}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          );
        },
        flex: 1,
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: '',
        width: 50,
        cellClassName: 'actions',
        getActions: ({ row }) => {
          return [
            <GridActionsCellItem
              key="delete"
              icon={<DeleteIcon />}
              label="Delete"
              onClick={() => deleteUser(row.email)}
              color="inherit"
            />,
          ];
        },
      },
    ],
    [authorization?.roles, deleteUser, handleEditRoles],
  );

  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const processRowUpdate = (
    newRow: GridRowModel<UserRow>,
    oldRow: GridRowModel<UserRow>,
  ): UserRow => {
    setDraftRow(null);

    if (!newRow.email) {
      throw new Error(`Invalid row`);
    }

    const exists = usersRows.some((row) => row.id !== newRow.id && row.email === newRow.email);

    if (exists) {
      throw new Error(`User with email "${newRow.email}" already exists`);
    }

    if (oldRow.isNew) {
      addUser({
        email: newRow.email,
        roles: newRow.roles,
      });
    } else {
      updateUser(newRow.email, {
        roles: newRow.roles,
      });
    }

    return {
      ...newRow,
      id: newRow.email,
      roles: [],
      isNew: false,
    };
  };

  const handleAddNewUser = React.useCallback(() => {
    const draftRowId = `<draft_row>-${Math.random()}`;
    setDraftRow({ id: draftRowId, email: '', roles: [], isNew: true });
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [draftRowId]: { mode: GridRowModes.Edit, fieldToFocus: 'email' },
    }));
  }, []);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      style={{ height: 350, width: '100%' }}
      onKeyDown={(event) => {
        if (Object.keys(rowModesModel).length > 0) {
          // Avoid the escape key from closing a dialog this grid is rendered in
          event.stopPropagation();
        }
      }}
    >
      <DataGrid
        rows={usersRows}
        columns={usersColumns}
        hideFooter
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        processRowUpdate={processRowUpdate}
        // onProcessRowUpdateError={(error) => console.log(error)}
        isCellEditable={(params) => {
          if (params.field === 'email') {
            return !!params.row.isNew;
          }
          return true;
        }}
        slots={{
          toolbar: UsersToolbar,
        }}
        slotProps={{
          toolbar: {
            onAddNewUser: handleAddNewUser,
            addNewUserDisabled: !!draftRow,
          },
        }}
        autoHeight
      />
    </div>
  );
}
export interface AppAuthorizationDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AppAuthorizationDialog({ open, onClose }: AppAuthorizationDialogProps) {
  const [activeTab, setActiveTab] = React.useState<'authentication' | 'roles' | 'users'>(
    'authentication',
  );

  const handleActiveTabChange = React.useCallback((event: React.SyntheticEvent, newTab: string) => {
    setActiveTab(newTab as 'authentication' | 'roles' | 'users');
  }, []);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Authorization</DialogTitle>
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList
            onChange={handleActiveTabChange}
            aria-label="Authorization configuration options"
          >
            <Tab label="Authentication" value="authentication" sx={{ px: 2 }} />
            <Tab label="Roles" value="roles" sx={{ px: 2 }} />
            <Tab label="Users" value="users" sx={{ px: 2 }} />
          </TabList>
        </Box>
        <DialogContent sx={{ minHeight: 460 }}>
          <TabPanel disableGutters value="authentication">
            <Typography variant="subtitle1" mb={1}>
              Authentication
            </Typography>
            <AppAuthenticationEditor />
          </TabPanel>
          <TabPanel disableGutters value="roles">
            <Typography variant="subtitle1" mb={1}>
              Roles
            </Typography>
            <Typography variant="body2">
              Define the roles for your application. You can configure your pages to be accessible
              to specific roles only.
            </Typography>
            <AppRolesEditor />
          </TabPanel>
          <TabPanel disableGutters value="users">
            <Typography variant="body2">
              Assign one or more roles to users of the app by their email addresses.
            </Typography>
            <AppAuthorizationUsersEditor />
          </TabPanel>
        </DialogContent>
      </TabContext>
      <DialogActions>
        <Button color="inherit" variant="text" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
