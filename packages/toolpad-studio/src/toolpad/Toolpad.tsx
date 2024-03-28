import { CircularProgress, Box, styled, CssBaseline, Button, Stack, Tooltip } from '@mui/material';
import * as React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SyncIcon from '@mui/icons-material/Sync';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useBoolean from '@toolpad/utils/hooks/useBoolean';
import AppEditor from './AppEditor';
import ErrorAlert from './AppEditor/PageEditor/ErrorAlert';
import { ThemeProvider } from '../ThemeContext';
import ToolpadShell from './ToolpadShell';
import { getViewFromPathname } from '../utils/domView';
import AppProvider, { AppState, useAppStateContext } from './AppState';
import FunctionsEditor from './FunctionsEditor';
import { FEATURE_FLAG_GLOBAL_FUNCTIONS } from '../constants';
import { ProjectProvider } from '../project';
import AppAuthorizationDialog from './AppEditor/AppAuthorizationEditor';
import AppformatPrettierDialog from './AppEditor/AppformatPrettierDialog';
import { ToolpadAppRoutes } from '../runtime/ToolpadApp';
import { RuntimeState } from '../runtime';

const Centered = styled('div')({
  height: '100%',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

function FullPageLoader() {
  return (
    <Centered>
      <CircularProgress />
    </Centered>
  );
}

interface FullPageErrorProps {
  error: Error;
}

function FullPageError({ error }: FullPageErrorProps) {
  return (
    <Centered sx={{ p: 4 }}>
      <ErrorAlert sx={{ width: '100%' }} error={error} />
    </Centered>
  );
}

function ErrorFallback({ error }: FallbackProps) {
  return <FullPageError error={error} />;
}

function renderAppSaveState(appState: AppState): React.ReactNode {
  if (appState.saveDomError) {
    return (
      <Tooltip title="Error while saving">
        <SyncProblemIcon color="primary" />
      </Tooltip>
    );
  }

  const isSaving = appState.unsavedDomChanges > 0;

  if (isSaving) {
    return (
      <Tooltip title="Saving changes…">
        <SyncIcon color="primary" />
      </Tooltip>
    );
  }

  return (
    <Tooltip title="All changes saved!">
      <CloudDoneIcon color="primary" />
    </Tooltip>
  );
}

export interface EditorShellProps {
  children: React.ReactNode;
}

function EditorShell({ children }: EditorShellProps) {
  const appState = useAppStateContext();

  const location = useLocation();

  const previewPath: string | null = React.useMemo(() => {
    const currentView = getViewFromPathname(location.pathname);
    if (!currentView) {
      return null;
    }
    const currentPageName = currentView?.kind === 'page' ? currentView.name : null;
    return currentPageName ? `${appState.appUrl}/pages/${currentPageName}` : appState.appUrl;
  }, [appState.appUrl, location.pathname]);

  const {
    value: authorizationDialogOpen,
    setTrue: handleAuthorizationDialogOpen,
    setFalse: handleAuthorizationDialogClose,
  } = useBoolean(false);

  const {
    value: appformatPrettierDialogOpenValue,
    setTrue: appformatPrettierDialogOpen,
    setFalse: appformatPrettierDialogClose,
  } = useBoolean(false);

  React.useEffect(() => {
    if (appState.saveDomError) {
      appformatPrettierDialogOpen();
    }
  });

  return (
    <ToolpadShell
      navigation={
        <Stack sx={{ ml: 3 }}>
          <Button onClick={handleAuthorizationDialogOpen}>Authorization</Button>
        </Stack>
      }
      actions={
        previewPath ? (
          <Stack direction="row" gap={1} alignItems="center">
            <Button
              variant="outlined"
              endIcon={<OpenInNewIcon />}
              color="primary"
              component="a"
              href={previewPath}
              target="_blank"
            >
              Preview
            </Button>
          </Stack>
        ) : null
      }
      status={renderAppSaveState(appState)}
    >
      {children}
      <AppAuthorizationDialog
        open={authorizationDialogOpen}
        onClose={handleAuthorizationDialogClose}
      />
      <AppformatPrettierDialog
        open={appformatPrettierDialogOpenValue}
        onClose={appformatPrettierDialogClose}
      />
    </ToolpadShell>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
    },
    mutations: {
      networkMode: 'always',
    },
  },
});

export interface ToolpadEditorRoutesProps {
  appUrl: string;
}

export function ToolpadEditorRoutes({ appUrl }: ToolpadEditorRoutesProps) {
  return (
    <ThemeProvider>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      {/* Container that allows children to size to it with height: 100% */}
      <Box sx={{ height: '1px', minHeight: '100vh' }}>
        <ErrorBoundary fallbackRender={ErrorFallback}>
          <React.Suspense fallback={<FullPageLoader />}>
            <QueryClientProvider client={queryClient}>
              <ProjectProvider url={appUrl} fallback={<FullPageLoader />}>
                <AppProvider appUrl={appUrl}>
                  <EditorShell>
                    <Routes>
                      {FEATURE_FLAG_GLOBAL_FUNCTIONS ? (
                        <Route path="/app/functions" element={<FunctionsEditor />} />
                      ) : null}
                      <Route path="*" element={<AppEditor />} />
                    </Routes>
                  </EditorShell>
                </AppProvider>
              </ProjectProvider>
            </QueryClientProvider>
          </React.Suspense>
        </ErrorBoundary>
      </Box>
    </ThemeProvider>
  );
}

export interface ToolpadEditorProps {
  basename: string;
  state: RuntimeState;
}

export function ToolpadEditor({ basename, state }: ToolpadEditorProps) {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/editor/*" element={<ToolpadEditorRoutes appUrl={basename} />} />
        <Route path="/*" element={<ToolpadAppRoutes basename={basename} state={state} />} />
      </Routes>
    </BrowserRouter>
  );
}

export interface ToolpadEditorLegacyProps {
  basename: string;
  appUrl: string;
}

export default function ToolpadEditorLegacy({ basename, appUrl }: ToolpadEditorLegacyProps) {
  return (
    <BrowserRouter basename={basename}>
      <ToolpadEditorRoutes appUrl={appUrl} />
    </BrowserRouter>
  );
}
