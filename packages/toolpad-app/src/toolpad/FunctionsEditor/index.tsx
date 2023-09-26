import * as React from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  InputBase,
  Popover,
  Portal,
  Skeleton,
  TextField,
  InputAdornment,
  IconButton,
  generateUtilityClasses,
  styled,
  Stack,
  useTheme,
  alpha,
  Typography,
  Button,
  Link,
  Tooltip,
  Snackbar,
  Toolbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { errorFrom } from '@mui/toolpad-utils/errors';
import { TreeView, treeItemClasses, TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import JavascriptIcon from '@mui/icons-material/Javascript';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ClearIcon from '@mui/icons-material/Clear';
import useBoolean from '@mui/toolpad-utils/hooks/useBoolean';
import { useQuery } from '@tanstack/react-query';
import { ensureSuffix } from '@mui/toolpad-utils/strings';
import { Panel, PanelGroup, PanelResizeHandle } from '../../components/resizablePanels';
import OpenCodeEditorButton from '../../components/OpenCodeEditor';
import FlexFill from '../../components/FlexFill';
import { FileIntrospectionResult } from '../../server/functionsTypesWorker';
import client from '../../api';
import {
  parseFunctionId,
  parseLegacyFunctionId,
  serializeFunctionId,
} from '../../toolpadDataSources/local/shared';
import { LocalPrivateApi } from '../../toolpadDataSources/local/types';
import usePageTitle from '../../utils/usePageTitle';
import * as appDom from '../../appDom';

const fileTreeItemClasses = generateUtilityClasses('FileTreeItem', ['actionButton', 'handlerItem']);

const FileTreeItemRoot = styled(TreeItem)(({ theme }) => ({
  [`& .${treeItemClasses.label}`]: {
    display: 'flex',
    fontSize: 15,
    flexDirection: 'row',
    alignItems: 'center',

    [`&:hover .${fileTreeItemClasses.actionButton}`]: {
      visibility: 'visible',
    },
  },

  [`& .${treeItemClasses.group}`]: {
    borderLeft: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
    position: 'relative',
    left: '-2px',
  },

  [`& .${fileTreeItemClasses.actionButton}`]: {
    visibility: 'hidden',
  },

  [`& .${fileTreeItemClasses.handlerItem} .${treeItemClasses.label}`]: {
    fontFamily: theme.typography.fontFamilyCode,
    fontSize: 14,
    padding: 4,
    display: 'inline-block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));

interface HandlerFileTreeItemProps {
  file: FileIntrospectionResult;
}

function HandlerFileTreeItem({ file }: HandlerFileTreeItemProps) {
  return (
    <FileTreeItemRoot
      key={file.name}
      nodeId={serializeFunctionId({ file: file.name })}
      label={
        <React.Fragment>
          <JavascriptIcon fontSize="large" />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: 14,
            }}
          >
            {file.name}
          </span>
          <FlexFill />
          <OpenCodeEditorButton
            className={fileTreeItemClasses.actionButton}
            iconButton
            filePath={file.name}
            fileType="query"
          />
        </React.Fragment>
      }
    >
      {file.handlers.map((handler) => {
        return (
          <TreeItem
            className={fileTreeItemClasses.handlerItem}
            key={handler.name}
            nodeId={serializeFunctionId({ file: file.name, handler: handler.name })}
            label={handler.name}
          />
        );
      })}
    </FileTreeItemRoot>
  );
}

export default function FunctionsEditor() {
  usePageTitle(`Functions | Toolpad editor`);

  const theme = useTheme();

  const [selectedHandler, setSelectedHandler] = React.useState<string | null>(null);
  const { file: selectedFile = undefined, handler: selectedFunction = undefined } = selectedHandler
    ? parseLegacyFunctionId(selectedHandler)
    : {};

  const selectedNodeId: string | null = selectedFile
    ? serializeFunctionId({
        file: selectedFile,
        handler: selectedFunction,
      })
    : null;

  const [expanded, setExpanded] = React.useState<string[]>(selectedFile ? [selectedFile] : []);

  const [search, setSearch] = React.useState('');

  const [latestCreatedHandler, setLatestCreatedHandler] = React.useState<string | null>(null);

  const execPrivate = React.useCallback(
    <K extends keyof LocalPrivateApi>(
      method: K,
      args: Parameters<LocalPrivateApi[K]>,
    ): Promise<Awaited<ReturnType<LocalPrivateApi[K]>>> => {
      return client.mutation.dataSourceExecPrivate('local', method, args);
    },
    [],
  );

  const introspection = useQuery({
    queryKey: ['introspection'],
    queryFn: () => execPrivate('introspection', []),
    retry: false,
  });

  const handleSelectFunction = React.useCallback(
    (_event: React.SyntheticEvent, nodeId: string) => {
      const parsed = parseFunctionId(nodeId);
      if (parsed.handler) {
        setSelectedHandler(nodeId);
      }
    },
    [setSelectedHandler],
  );

  const handlerTreeRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    handlerTreeRef.current?.querySelector(`.${treeItemClasses.selected}`)?.scrollIntoView();
  }, []);

  const [newHandlerInput, setNewHandlerInput] = React.useState('');
  const [newHandlerLoading, setNewHandlerLoading] = React.useState(false);

  const {
    value: isCreateNewHandlerOpen,
    setTrue: handleOpenCreateNewHandler,
    setFalse: handleCloseCreateNewHandlerDialog,
  } = useBoolean(false);

  const handleCloseCreateNewHandler = React.useCallback(() => {
    setNewHandlerInput('');
    handleCloseCreateNewHandlerDialog();
  }, [handleCloseCreateNewHandlerDialog]);

  const existingFileNames = React.useMemo(
    () =>
      new Set(
        introspection.data?.files.flatMap((file) => [
          file.name,
          `${file.name.substring(0, file.name.lastIndexOf('.'))}`,
        ]) ?? [],
      ),
    [introspection],
  );

  const nextProposedName = React.useMemo(
    () => appDom.proposeName('myfunctions', existingFileNames),
    [existingFileNames],
  );

  const createNewInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleCreateNewHandler = React.useCallback(() => {
    setNewHandlerInput(nextProposedName);
    handleOpenCreateNewHandler();
  }, [handleOpenCreateNewHandler, nextProposedName]);

  const [anchorEl, setAnchorEl] = React.useState<HTMLInputElement | null>(null);
  const open = !!anchorEl;

  const inputError: string | null = React.useMemo(() => {
    const alreadyExists = existingFileNames.has(newHandlerInput);
    return alreadyExists ? 'File already exists' : null;
  }, [existingFileNames, newHandlerInput]);

  React.useEffect(() => {
    const createNewInput = createNewInputRef.current;
    if (createNewInput) {
      setAnchorEl(inputError ? createNewInput : null);
    }
  }, [inputError]);

  const handleCreateNewCommit = React.useCallback(async () => {
    if (!newHandlerInput || inputError || newHandlerLoading) {
      handleCloseCreateNewHandler();
      return;
    }

    const fileName = ensureSuffix(newHandlerInput, '.ts');

    setNewHandlerLoading(true);
    try {
      await execPrivate('createNew', [fileName]);
      await introspection.refetch();
    } catch (error) {
      // eslint-disable-next-line no-alert
      window.alert(errorFrom(error).message);
    } finally {
      setNewHandlerLoading(false);
      setLatestCreatedHandler(fileName);
    }

    const newNodeId = serializeFunctionId({ file: fileName, handler: 'default' });
    setSelectedHandler(newNodeId);
    setExpanded([fileName]);

    handleCloseCreateNewHandler();

    setTimeout(() => {
      handlerTreeRef.current?.querySelector(`.${treeItemClasses.selected}`)?.scrollIntoView();
    }, 0);
  }, [
    execPrivate,
    handleCloseCreateNewHandler,
    inputError,
    introspection,
    newHandlerInput,
    newHandlerLoading,
  ]);

  const handleSearchChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  }, []);

  const handleClearSearch = React.useCallback(() => {
    setSearch('');
  }, []);

  const handleSnackbarClose = React.useCallback(() => {
    setLatestCreatedHandler(null);
  }, []);

  return (
    <React.Fragment>
      <Box sx={{ height: 'calc(100vh - 48px)' }}>
        <PanelGroup direction="horizontal">
          <Panel defaultSize={16} minSize={16}>
            <Box sx={{ height: '100%', overflow: 'auto', position: 'relative' }}>
              <Stack
                direction="row"
                alignItems="center"
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  position: 'sticky',
                  top: 0,
                  left: 0,
                  width: '100%',
                  pl: 1,
                  zIndex: 1,
                }}
              >
                <TextField
                  value={search}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: search ? (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClearSearch} edge="end">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                    sx: { fontSize: 14 },
                  }}
                  variant="outlined"
                  fullWidth
                  size="small"
                />
                <Tooltip title="Create new function file">
                  <IconButton size="medium" onClick={handleCreateNewHandler}>
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
              <TreeView
                ref={handlerTreeRef}
                selected={selectedNodeId}
                onNodeSelect={handleSelectFunction}
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                expanded={expanded}
                onNodeToggle={(_event, nodeIds) => setExpanded(nodeIds)}
                sx={{
                  px: 1,
                }}
              >
                {isCreateNewHandlerOpen ? (
                  <TreeItem
                    nodeId="::create::"
                    label={
                      <React.Fragment>
                        <InputBase
                          ref={createNewInputRef}
                          value={newHandlerInput}
                          onChange={(event) =>
                            setNewHandlerInput(event.target.value.replaceAll(/[^a-zA-Z0-9]/g, ''))
                          }
                          autoFocus
                          disabled={newHandlerLoading}
                          endAdornment={newHandlerLoading ? <CircularProgress size={16} /> : null}
                          onFocus={(event) => {
                            event.target.select();
                          }}
                          onBlur={(event) => {
                            if (event && event.target.value !== nextProposedName) {
                              handleCreateNewCommit();
                            } else {
                              handleCloseCreateNewHandler();
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              handleCreateNewCommit();
                            } else if (event.key === 'Escape') {
                              handleCloseCreateNewHandler();
                              event.stopPropagation();
                            }
                          }}
                          startAdornment={
                            <InputAdornment position="start" sx={{ ml: '-6px', mr: '0px' }}>
                              <JavascriptIcon fontSize="large" />
                            </InputAdornment>
                          }
                          fullWidth
                          sx={{
                            padding: 0.5,
                            fontSize: 14,
                          }}
                        />
                        <Popover
                          open={open}
                          anchorEl={anchorEl}
                          onClose={() => setAnchorEl(null)}
                          disableAutoFocus
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                          }}
                        >
                          <Alert severity="error" variant="outlined">
                            {inputError}
                          </Alert>
                        </Popover>
                      </React.Fragment>
                    }
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      '.MuiTreeItem-content': {
                        backgroundColor: 'transparent',
                      },
                    }}
                  />
                ) : null}

                {introspection.data?.files
                  ?.filter((file) =>
                    search ? file.name.toLowerCase().includes(search.toLowerCase()) : true,
                  )
                  .map((file) => (
                    <HandlerFileTreeItem key={file.name} file={file} />
                  ))}

                {introspection.data?.files.length === 0 ? (
                  <Stack alignItems="center" sx={{ mt: 2 }}>
                    <Typography variant="body1" fontSize={14}>
                      You don&apos;t have any functions yet…
                    </Typography>
                    <Button
                      onClick={handleCreateNewHandler}
                      variant="outlined"
                      startIcon={<AddIcon />}
                      size="medium"
                      sx={{ mt: 1 }}
                    >
                      Create function file
                    </Button>
                  </Stack>
                ) : null}

                {introspection.isLoading ? (
                  <React.Fragment>
                    <TreeItem disabled nodeId="::loading::" label={<Skeleton />} />
                    <TreeItem disabled nodeId="::loading::" label={<Skeleton />} />
                    <TreeItem disabled nodeId="::loading::" label={<Skeleton />} />
                  </React.Fragment>
                ) : null}
              </TreeView>
              {introspection.error ? (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: '0 0 0 0',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: theme.palette.error.main,
                  }}
                >
                  {errorFrom(introspection.error).message}
                </Box>
              ) : null}
            </Box>
          </Panel>
          <PanelResizeHandle />
          <Panel>
            {selectedHandler && selectedFile && selectedFunction ? (
              <Toolbar sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ width: '100%', p: 1 }}
                >
                  <Stack direction="row" alignItems="center">
                    <JavascriptIcon fontSize="large" />
                    <Typography variant="subtitle1" fontSize={15}>
                      {selectedFile}&nbsp;&nbsp;&gt;&nbsp;&nbsp;
                      <span style={{ fontFamily: theme.typography.fontFamilyCode }}>
                        <strong>{selectedFunction}</strong>
                      </span>
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <OpenCodeEditorButton
                      className={fileTreeItemClasses.actionButton}
                      filePath={selectedFile}
                      fileType="query"
                      actionText="Edit"
                      outlined
                      iconButton
                    />
                    <Button variant="contained" size="medium" startIcon={<PlayArrowIcon />}>
                      Preview
                    </Button>
                  </Stack>
                </Stack>
              </Toolbar>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Stack alignItems="center" sx={{ px: 4 }}>
                  <Typography variant="body1" textAlign="center" fontSize={14}>
                    <strong>Custom Functions</strong> allow you to run your own JavaScript code,
                    directly from your file system.
                  </Typography>
                  <Link
                    href="https://mui.com/toolpad/concepts/custom-functions"
                    target="_blank"
                    rel="noopener"
                    textAlign="center"
                    sx={{ mt: 1 }}
                    fontSize={14}
                  >
                    Read more about Custom Functions
                  </Link>
                </Stack>
              </Box>
            )}
          </Panel>
        </PanelGroup>
      </Box>
      <Portal>
        {latestCreatedHandler ? (
          <Snackbar
            open={!!latestCreatedHandler}
            onClose={handleSnackbarClose}
            message={`Function "${latestCreatedHandler}" created`}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            autoHideDuration={6000}
            action={
              <React.Fragment>
                <OpenCodeEditorButton
                  className={fileTreeItemClasses.actionButton}
                  filePath={latestCreatedHandler}
                  fileType="query"
                />
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={handleSnackbarClose}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </React.Fragment>
            }
          />
        ) : null}
      </Portal>
    </React.Fragment>
  );
}
