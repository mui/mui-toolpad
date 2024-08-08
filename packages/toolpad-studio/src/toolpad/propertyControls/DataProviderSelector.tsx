import * as React from 'react';
import {
  Autocomplete,
  TextField,
  styled,
  autocompleteClasses,
  createFilterOptions,
  DialogContentText,
  DialogContent,
  DialogTitle,
  Dialog,
  DialogActions,
  Button,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  Stack,
} from '@mui/material';
import { errorFrom } from '@toolpad/utils/errors';
import AddIcon from '@mui/icons-material/Add';
import { useMutation } from '@tanstack/react-query';
import { LoadingButton } from '@mui/lab';
import { generateUniqueString } from '@toolpad/utils/strings';
import { PaginationMode } from '@toolpad/studio-runtime';
import { EditorProps } from '../../types';
import { useProjectApi } from '../../projectApi';
import type {
  DataProviderIntrospectionResult,
  FileIntrospectionResult,
} from '../../server/functionsTypesWorker';
import OpenCodeEditorButton from '../OpenCodeEditor';
import type { CreateDataProviderOptions } from '../../server/FunctionsManager';

const PAGINATION_DOCUMENTATION_URL =
  'https://mui.com/toolpad/studio/concepts/data-providers/#pagination';

function useFunctionsIntrospectQuery() {
  const projectApi = useProjectApi();
  return projectApi.useQuery('introspect', []);
}

function handleInputFocus(event: React.FocusEvent<HTMLInputElement>) {
  event.target.select();
}

type DataProviderSelectorOption =
  | {
      kind: 'option';
      file: FileIntrospectionResult;
      dataProvider: DataProviderIntrospectionResult;
      displayName: string;
    }
  | {
      kind: 'create';
      inputValue: string;
    };

const filter = createFilterOptions<DataProviderSelectorOption>();

const classes = {
  editButton: 'DataProviderSelector_editButton',
};

const DataProviderSelectorRoot = styled('div')({
  [`& .${classes.editButton}`]: {
    visibility: 'hidden',
  },

  [`&:hover .${classes.editButton}, & .${autocompleteClasses.focused} .${classes.editButton}`]: {
    visibility: 'visible',
  },
});

interface CreateNewDataProviderDialogProps {
  open: boolean;
  onClose: () => void;
  onCommit: (newName: string) => void;
  existingNames: Set<string>;
  initialName: string;
}

function CreateNewDataProviderDialog({
  open,
  onClose,
  onCommit,
  existingNames,
  initialName,
}: CreateNewDataProviderDialogProps) {
  const projectApi = useProjectApi();
  const [newName, setNewName] = React.useState(initialName);
  React.useEffect(() => {
    if (open) {
      setNewName(initialName);
    }
  }, [open, initialName]);

  const [options, setOptions] = React.useState<CreateDataProviderOptions>({
    paginationMode: 'index',
  });

  const createProviderMutation = useMutation({
    mutationKey: [newName, options],
    mutationFn: () => projectApi.methods.createDataProvider(newName, options),
    onSuccess: () => {
      onCommit(newName);
      onClose();
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createProviderMutation.mutate();
  };

  const nameExists = existingNames.has(newName);

  const errorMessage = React.useMemo(() => {
    if (nameExists) {
      return `Provider "${newName}" already exists`;
    }
    if (createProviderMutation.error) {
      return errorFrom(createProviderMutation.error).message;
    }
    return null;
  }, [nameExists, createProviderMutation.error, newName]);

  const paginationModeSelectId = React.useId();

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create a new data provider</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To create a new data provider please enter the name here.
          </DialogContentText>
          <Stack sx={{ gap: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              fullWidth
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              label="name"
              type="text"
              onFocus={handleInputFocus}
              required
              error={!!errorMessage}
              helperText={errorMessage}
            />

            <FormControl>
              <FormLabel id={paginationModeSelectId}>Pagination mode</FormLabel>
              <RadioGroup
                row
                aria-labelledby={paginationModeSelectId}
                value={options.paginationMode}
                onChange={(event) =>
                  setOptions((existing) => ({
                    ...existing,
                    paginationMode: event.target.value as PaginationMode,
                  }))
                }
              >
                <FormControlLabel value="index" control={<Radio />} label="Index based" />
                <FormControlLabel value="cursor" control={<Radio />} label="Cursor based" />
              </RadioGroup>
              <FormHelperText>
                How is your backend data paginated? By index, or by cursor? Find more about
                pagination modes in the{' '}
                <a href={PAGINATION_DOCUMENTATION_URL} target="_blank" rel="noopener">
                  documentation
                </a>
                .
              </FormHelperText>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <LoadingButton
            type="submit"
            disabled={!newName || !!errorMessage}
            loading={createProviderMutation.isPending}
          >
            Create
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function getProviderNameFromFile(file: FileIntrospectionResult): string {
  return file.name.replace(/\.[^.]+$/, '');
}

function DataProviderSelector({ value, onChange }: EditorProps<string>) {
  const { data: introspection, isLoading, error } = useFunctionsIntrospectQuery();

  const options = React.useMemo<DataProviderSelectorOption[]>(() => {
    return (
      introspection?.files.flatMap((file) =>
        file.dataProviders
          ?.filter((dataProvider) => dataProvider.name === 'default')
          .map((dataProvider) => ({
            kind: 'option',
            file,
            dataProvider,
            displayName: getProviderNameFromFile(file),
          })),
      ) ?? []
    );
  }, [introspection]);

  const [fileName = null, providerName = null] = value ? value.split(':') : [];

  const autocompleteValue = React.useMemo(() => {
    return (
      options.find(
        (option) =>
          option.kind === 'option' &&
          option.file.name === fileName &&
          option.dataProvider.name === providerName,
      ) ?? null
    );
  }, [fileName, providerName, options]);

  const errorMessage = error ? errorFrom(error).message : undefined;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const handleClose = () => {
    setDialogOpen(false);
  };
  const [dialogValue, setDialogValue] = React.useState('');

  const existingNames = React.useMemo(
    () => new Set(introspection?.files.map((file) => getProviderNameFromFile(file))),
    [introspection],
  );

  const handleCreateNewDataProvider = React.useCallback((suggestion: string) => {
    setDialogValue(suggestion);
    setDialogOpen(true);
  }, []);

  return (
    <DataProviderSelectorRoot>
      <CreateNewDataProviderDialog
        open={dialogOpen}
        onClose={handleClose}
        onCommit={(newName) => onChange(`${newName}.ts:default`)}
        initialName={dialogValue}
        existingNames={existingNames}
      />

      <Autocomplete
        options={options}
        getOptionLabel={(option) => {
          if (typeof option === 'string' || option.kind === 'create') {
            const inputValue = typeof option === 'string' ? option : option.inputValue;
            return inputValue ? `Create data provider "${inputValue}"` : 'Create new data provider';
          }
          return option.displayName;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Data Provider"
            placeholder="Click to create or select a data provider"
            error={!!errorMessage}
            helperText={errorMessage}
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {fileName ? (
                      <OpenCodeEditorButton
                        className={classes.editButton}
                        filePath={fileName}
                        fileType="resource"
                        iconButton
                      />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              },

              inputLabel: {
                shrink: true,
              },
            }}
          />
        )}
        filterOptions={(unfilteredOptions, params) => {
          const filtered = filter(unfilteredOptions, params);

          if (!existingNames.has(params.inputValue)) {
            filtered.push({
              kind: 'create',
              inputValue: params.inputValue,
            });
          }

          return filtered;
        }}
        value={autocompleteValue}
        loading={isLoading}
        onChange={(event, newValue) => {
          if (typeof newValue === 'string') {
            handleCreateNewDataProvider(
              newValue || generateUniqueString('dataProvider', existingNames),
            );
          } else if (newValue && newValue.kind === 'create') {
            handleCreateNewDataProvider(
              newValue.inputValue || generateUniqueString('dataProvider', existingNames),
            );
          } else {
            onChange(newValue ? `${newValue.file.name}:${newValue.dataProvider.name}` : undefined);
          }
        }}
        renderOption={(props, option, state, ownerState) => {
          const icon = option.kind === 'create' ? <AddIcon /> : undefined;
          return (
            <li {...props}>
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                {icon}
                {ownerState.getOptionLabel(option)}
              </Box>
            </li>
          );
        }}
        selectOnFocus
        clearOnBlur
        freeSolo
        sx={{ flex: 1 }}
      />
    </DataProviderSelectorRoot>
  );
}

export default DataProviderSelector;
