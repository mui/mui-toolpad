import * as React from 'react';
import {
  Box,
  Portal,
  Skeleton,
  IconButton,
  generateUtilityClasses,
  styled,
  Stack,
  useTheme,
  alpha,
  Typography,
  Button,
  Link,
  Snackbar,
  Toolbar,
} from '@mui/material';
import { errorFrom } from '@toolpad/utils/errors';
import { treeItemClasses, TreeItem, SimpleTreeView } from '@mui/x-tree-view';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import JavascriptIcon from '@mui/icons-material/Javascript';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import useBoolean from '@toolpad/utils/hooks/useBoolean';
import { useQuery } from '@tanstack/react-query';
import { ensureSuffix } from '@toolpad/utils/strings';
import { NodeId } from '@toolpad/studio-runtime';
import usePageTitle from '@toolpad/utils/hooks/usePageTitle';
import * as appDom from '@toolpad/studio-runtime/appDom';
import { Panel, PanelGroup, PanelResizeHandle } from '../../components/resizablePanels';
import OpenCodeEditorButton from '../OpenCodeEditor';
import FlexFill from '../../components/FlexFill';
import { FileIntrospectionResult } from '../../server/functionsTypesWorker';
import {
  parseFunctionId,
  parseLegacyFunctionId,
  serializeFunctionId,
} from '../../toolpadDataSources/local/shared';
import { LocalPrivateApi } from '../../toolpadDataSources/local/types';
import { useProjectApi } from '../../projectApi';
import ExplorerHeader from '../AppEditor/ExplorerHeader';
import EditableTreeItem, { EditableTreeItemProps } from '../../components/EditableTreeItem';
import { scrollIntoViewIfNeeded } from '../../utils/dom';

const fileTreeItemClasses = generateUtilityClasses('FileTreeItem', ['actionButton', 'handlerItem']);

const FileTreeItemRoot = styled(EditableTreeItem)(({ theme }) => ({
  [`& .${treeItemClasses.label}`]: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',

    [`&:hover .${fileTreeItemClasses.actionButton}`]: {
      visibility: 'visible',
    },
  },

  [`& .${treeItemClasses.groupTransition}`]: {
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

interface HandlerFileTreeItemProps extends EditableTreeItemProps {
  file: FileIntrospectionResult;
  onRename: (nodeId: NodeId, updatedName: string) => void | Promise<void>;
}

function HandlerFileTreeItem({
  file,
  itemId,
  validateItemName,
  onRename,
  ...other
}: HandlerFileTreeItemProps) {
  const { value: isEditing, setFalse: stopEditing } = useBoolean(false);

  const labelText = file.name;

  // const handleRename = React.useCallback(
  //   async (newName: string) => {
  //     await onRename(nodeId as NodeId, newName);
  //     stopEditing();
  //   },
  //   [nodeId, onRename, stopEditing],
  // );

  const validateEditableFileName = React.useCallback(
    (newName: string) => {
      if (newName !== labelText && validateItemName) {
        return validateItemName(newName);
      }
      return { isValid: true };
    },
    [labelText, validateItemName],
  );

  return (
    <FileTreeItemRoot
      key={file.name}
      itemId={itemId}
      labelText={labelText}
      renderLabel={(children) => (
        <React.Fragment>
          <JavascriptIcon fontSize="large" />
          {children}
          <FlexFill />
          <OpenCodeEditorButton
            className={fileTreeItemClasses.actionButton}
            iconButton
            filePath={file.name}
            fileType="resource"
          />
        </React.Fragment>
      )}
      isEditing={isEditing}
      // onEdit={handleRename}
      suggestedNewItemName={labelText}
      onCancel={stopEditing}
      validateItemName={validateEditableFileName}
      {...other}
    >
      {file.handlers.map((handler) => {
        return (
          <TreeItem
            className={fileTreeItemClasses.handlerItem}
            key={handler.name}
            itemId={serializeFunctionId({ file: file.name, handler: handler.name })}
            label={handler.name}
          />
        );
      })}
    </FileTreeItemRoot>
  );
}

export default function FunctionsEditor() {
  usePageTitle(`Functions | Toolpad Studio editor`);

  const theme = useTheme();

  const projectApi = useProjectApi();

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

  const [latestCreatedHandler, setLatestCreatedHandler] = React.useState<string | null>(null);

  const execPrivate = React.useCallback(
    <K extends keyof LocalPrivateApi>(
      method: K,
      args: Parameters<LocalPrivateApi[K]>,
    ): Promise<Awaited<ReturnType<LocalPrivateApi[K]>>> => {
      return projectApi.methods.dataSourceExecPrivate('local', method, args);
    },
    [projectApi.methods],
  );

  const introspection = useQuery({
    queryKey: ['introspection'],
    queryFn: () => execPrivate('introspection', []),
    retry: false,
  });

  const handleSelectFunction = React.useCallback(
    (_event: React.SyntheticEvent, itemId: string | null) => {
      if (!itemId) {
        return;
      }
      const parsed = parseFunctionId(itemId);
      if (parsed.handler) {
        setSelectedHandler(itemId);
      }
    },
    [setSelectedHandler],
  );

  const handlerTreeRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    handlerTreeRef.current?.querySelector(`.${treeItemClasses.selected}`)?.scrollIntoView();
  }, []);

  const [newHandlerLoading, setNewHandlerLoading] = React.useState(false);

  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    const handlerTree = handlerTreeRef.current;
    if (handlerTree && hasMounted) {
      const selectedItem = handlerTree.querySelector(`.${treeItemClasses.selected}`);

      if (selectedItem) {
        scrollIntoViewIfNeeded(selectedItem);
      }
    }
  }, [hasMounted, introspection.data]);

  const {
    value: isCreateNewHandlerOpen,
    setTrue: handleOpenCreateNewHandler,
    setFalse: handleCloseCreateNewHandler,
  } = useBoolean(false);

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

  const validateFileName = React.useCallback(
    (fileName: string) => {
      const alreadyExists = existingFileNames.has(fileName);

      return {
        isValid: !alreadyExists,
        ...(alreadyExists ? { errorMessage: 'File already exists' } : {}),
      };
    },
    [existingFileNames],
  );

  const nextProposedName = React.useMemo(
    () => appDom.proposeName('myfunctions', existingFileNames),
    [existingFileNames],
  );

  const handleCreateNewCommit = React.useCallback(
    async (newFileName: string) => {
      const fileName = ensureSuffix(newFileName, '.ts');

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
    },
    [execPrivate, handleCloseCreateNewHandler, introspection],
  );

  const handleSnackbarClose = React.useCallback(() => {
    setLatestCreatedHandler(null);
  }, []);

  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearch = React.useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  }, []);

  const handleFileRename = React.useCallback(async () => {
    try {
      // @TODO: Rename file
      await introspection.refetch();
    } catch (error) {
      // eslint-disable-next-line no-alert
      window.alert(errorFrom(error).message);
    }
  }, [introspection]);

  const functionFiles = React.useMemo(() => {
    const regex = new RegExp(searchTerm.split('').join('.*'), 'i');
    return (
      introspection.data?.files?.filter((file) => (searchTerm ? regex.test(file.name) : true)) || []
    ).filter((file) => file.handlers.length > 0);
  }, [introspection.data?.files, searchTerm]);

  return (
    <React.Fragment>
      <Box sx={{ height: 'calc(100vh - 48px)' }}>
        <PanelGroup direction="horizontal">
          <Panel defaultSize={16} minSize={16}>
            <Stack
              direction="column"
              sx={{
                height: '100%',
                position: 'relative',
              }}
            >
              <ExplorerHeader
                headerText="Functions"
                createLabelText="Create new function file"
                onCreate={handleOpenCreateNewHandler}
                onSearch={handleSearch}
                hasPersistentSearch
              />
              <SimpleTreeView
                ref={handlerTreeRef}
                selectedItems={selectedNodeId}
                onSelectedItemsChange={handleSelectFunction}
                expandedItems={expanded}
                onExpandedItemsChange={(_event, itemIds) => setExpanded(itemIds)}
                sx={{
                  px: 1,
                  overflow: 'auto',
                  scrollbarGutter: 'stable',
                }}
              >
                {isCreateNewHandlerOpen ? (
                  <EditableTreeItem
                    itemId="::create::"
                    isEditing
                    suggestedNewItemName={nextProposedName}
                    onEdit={handleCreateNewCommit}
                    onCancel={handleCloseCreateNewHandler}
                    validateItemName={validateFileName}
                    isLoading={newHandlerLoading}
                    renderLabel={(children) => (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <JavascriptIcon fontSize="large" />
                        {children}
                      </Box>
                    )}
                  />
                ) : null}
                {functionFiles.map((file) => (
                  <HandlerFileTreeItem
                    key={file.name}
                    itemId={serializeFunctionId({ file: file.name })}
                    file={file}
                    validateItemName={validateFileName}
                    onRename={handleFileRename}
                  />
                ))}

                {introspection.data?.files.length === 0 ? (
                  <Stack alignItems="center" sx={{ mt: 2 }}>
                    <Typography variant="body1" fontSize={14}>
                      You don&apos;t have any functions yet…
                    </Typography>
                    <Button
                      onClick={handleOpenCreateNewHandler}
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
                    <TreeItem disabled itemId="loading-1" label={<Skeleton />} />
                    <TreeItem disabled itemId="loading-2" label={<Skeleton />} />
                    <TreeItem disabled itemId="loading-3" label={<Skeleton />} />
                  </React.Fragment>
                ) : null}
              </SimpleTreeView>
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
            </Stack>
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
                    <Typography variant="subtitle1" fontSize={14}>
                      {selectedFile}&nbsp;&nbsp;&rsaquo;&nbsp;&nbsp;
                      <span style={{ fontFamily: theme.typography.fontFamilyCode }}>
                        {selectedFunction}
                      </span>
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <OpenCodeEditorButton
                      className={fileTreeItemClasses.actionButton}
                      filePath={selectedFile}
                      fileType="resource"
                      actionText="Edit"
                      variant="outlined"
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
                    href="https://mui.com/toolpad/studio/concepts/custom-functions"
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
                  fileType="resource"
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
