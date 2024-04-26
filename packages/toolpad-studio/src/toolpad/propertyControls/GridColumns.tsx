import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Stack,
  TextField,
  TextFieldProps,
  TextFieldVariants,
  Tooltip,
  Typography,
} from '@mui/material';
import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  inferColumns,
  SerializableGridColumn,
  SerializableGridColumns,
} from '@toolpad/studio-components';
import { generateUniqueString } from '@toolpad/utils/strings';
import { NumberFormatEditor } from '@toolpad/studio-runtime/numberFormat';
import { DateFormatEditor } from '@toolpad/studio-runtime/dateFormat';
import { useAppHost } from '@toolpad/studio-runtime';
import type { EditorProps } from '../../types';
import { ToolpadComponentDefinition, useToolpadComponents } from '../AppEditor/toolpadComponents';
import PropertyControl from '../../components/PropertyControl';
// TODO: this import suggests leaky abstraction
import { usePageEditorState } from '../AppEditor/PageEditor/PageEditorProvider';
import { UpgradeChip } from '../AppEditor/UpgradeNotification';

type GridAlignment = SerializableGridColumn['align'];

const COLUMN_TYPES: string[] = [
  'string',
  'number',
  'date',
  'dateTime',
  'boolean',
  'link',
  'image',
  'codeComponent',
];
const ALIGNMENTS: GridAlignment[] = ['left', 'right', 'center'];

type ImmediateInputProps<V extends TextFieldVariants = TextFieldVariants> = TextFieldProps<V> & {
  validate?: (input: string) => string | null;
};

interface ImmediateInputState {
  input: string;
  error: string | null;
}

function useImmediateTextField<V extends TextFieldVariants = TextFieldVariants>(
  props: ImmediateInputProps<V>,
): TextFieldProps<V> {
  const { value, onChange, error, helperText, required, onBlur, validate } = props;
  const createInputState = React.useCallback(
    (rawInput: unknown): ImmediateInputState => {
      const input = String(rawInput);
      let inputError = null;
      if (required && !input) {
        inputError = 'Input required';
      } else if (validate) {
        inputError = validate(input);
      }
      return { input, error: inputError };
    },
    [validate, required],
  );
  const [state, setState] = React.useState<ImmediateInputState>(createInputState(value));
  React.useEffect(() => {
    setState(createInputState(value));
  }, [value, createInputState]);

  return {
    ...props,
    value: state.input,
    error: !!state.error || error,
    helperText: state.error || helperText,
    required,
    onBlur: (event) => {
      if (state.input !== value) {
        setState(createInputState(value));
      }
      onBlur?.(event);
    },
    onChange: (event) => {
      const newState = createInputState(event.target.value);
      setState(newState);
      if (!newState.error) {
        onChange?.(event);
      }
    },
  };
}

interface GridColumnEditorProps {
  value: SerializableGridColumn;
  onChange: (newValue: SerializableGridColumn) => void;
  disabled?: boolean;
}

function GridColumnEditor({
  disabled,
  value: editedColumn,
  onChange: handleColumnChange,
}: GridColumnEditorProps) {
  const toolpadComponents = useToolpadComponents();
  const codeComponents: ToolpadComponentDefinition[] = React.useMemo(() => {
    return Object.values(toolpadComponents)
      .filter(Boolean)
      .filter((definition) => !definition.builtIn);
  }, [toolpadComponents]);

  const fieldInput = useImmediateTextField({
    label: 'field',
    disabled,
    required: true,
    value: editedColumn.field,
    onChange: (event) => {
      handleColumnChange({ ...editedColumn, field: event.target.value });
    },
  });

  const appHost = useAppHost();
  const isProPlan = appHost.plan === 'pro';

  return (
    <Stack gap={1} py={1}>
      <TextField {...fieldInput} />

      <TextField
        label="header"
        value={editedColumn.headerName || ''}
        disabled={disabled}
        onChange={(event) =>
          handleColumnChange({
            ...editedColumn,
            headerName: event.target.value ? event.target.value : undefined,
          })
        }
      />

      <TextField
        select
        fullWidth
        label="align"
        value={editedColumn.align ?? ''}
        disabled={disabled}
        onChange={(event) =>
          handleColumnChange({
            ...editedColumn,
            align: (event.target.value as GridAlignment) || undefined,
          })
        }
      >
        {ALIGNMENTS.map((alignment) => (
          <MenuItem key={alignment} value={alignment}>
            {alignment}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="width"
        type="number"
        value={editedColumn.width}
        disabled={disabled}
        onChange={(event) =>
          handleColumnChange({ ...editedColumn, width: Number(event.target.value) })
        }
      />

      <TextField
        select
        fullWidth
        label="type"
        value={editedColumn.type ?? ''}
        disabled={disabled}
        onChange={(event) =>
          handleColumnChange({
            ...editedColumn,
            type: event.target.value,
            numberFormat: undefined,
          })
        }
      >
        {COLUMN_TYPES.map((type) => (
          <MenuItem key={type} value={type}>
            {type}
          </MenuItem>
        ))}
      </TextField>

      <Box sx={{ ml: 1, pl: 1, borderLeft: 1, borderColor: 'divider' }}>
        {editedColumn.type === 'number' ? (
          <NumberFormatEditor
            disabled={disabled}
            value={editedColumn.numberFormat}
            onChange={(numberFormat) => handleColumnChange({ ...editedColumn, numberFormat })}
          />
        ) : null}

        {editedColumn.type === 'date' ? (
          <DateFormatEditor
            disabled={disabled}
            disableTimeFormat
            value={editedColumn.dateFormat}
            onChange={(dateFormat) => {
              handleColumnChange({ ...editedColumn, dateFormat });
            }}
          />
        ) : null}

        {editedColumn.type === 'dateTime' ? (
          <DateFormatEditor
            disabled={disabled}
            value={editedColumn.dateTimeFormat}
            onChange={(dateTimeFormat) => {
              handleColumnChange({ ...editedColumn, dateTimeFormat });
            }}
          />
        ) : null}

        {editedColumn.type === 'codeComponent' ? (
          <TextField
            select
            required
            fullWidth
            label="Custom component"
            value={editedColumn.codeComponent ?? ''}
            disabled={disabled}
            error={!editedColumn.codeComponent}
            helperText={editedColumn.codeComponent ? undefined : 'Please select a component'}
            onChange={(event) =>
              handleColumnChange({
                ...editedColumn,
                codeComponent: event.target.value,
              })
            }
          >
            {codeComponents.map(({ displayName }) => (
              <MenuItem key={displayName} value={displayName}>
                {displayName}
              </MenuItem>
            ))}
          </TextField>
        ) : null}
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={editedColumn.sortable ?? true}
            disabled={disabled}
            onChange={(event) =>
              handleColumnChange({
                ...editedColumn,
                sortable: event.target.checked,
              })
            }
          />
        }
        label="Sortable"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={editedColumn.filterable ?? true}
            disabled={disabled}
            onChange={(event) =>
              handleColumnChange({
                ...editedColumn,
                filterable: event.target.checked,
              })
            }
          />
        }
        label="Filterable"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={editedColumn.editable ?? true}
            disabled={disabled}
            onChange={(event) =>
              handleColumnChange({
                ...editedColumn,
                editable: event.target.checked,
              })
            }
          />
        }
        label="Editable"
      />

      {isProPlan ? (
        <React.Fragment>
          <FormControlLabel
            control={
              <Checkbox
                checked={editedColumn.groupable ?? true}
                disabled={disabled}
                onChange={(event) =>
                  handleColumnChange({
                    ...editedColumn,
                    groupable: event.target.checked,
                  })
                }
              />
            }
            label="Groupable"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={editedColumn.aggregable ?? true}
                disabled={disabled}
                onChange={(event) =>
                  handleColumnChange({
                    ...editedColumn,
                    aggregable: event.target.checked,
                  })
                }
              />
            }
            label="Aggregable"
          />
        </React.Fragment>
      ) : (
        <Typography variant="body2">
          Grouping/aggregation
          <UpgradeChip
            sx={{ ml: 1 }}
            url="https://mui.com/toolpad/studio/components/data-grid/#grouping-and-aggregating-pro"
          />
        </Typography>
      )}
    </Stack>
  );
}

function GridColumnsPropEditor({
  propType,
  label,
  nodeId,
  value = [],
  onChange,
  disabled,
}: EditorProps<SerializableGridColumns>) {
  const { nodeData } = usePageEditorState();
  const [editedIndex, setEditedIndex] = React.useState<number | null>(null);

  const editedColumn = typeof editedIndex === 'number' ? value[editedIndex] : null;

  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setMenuAnchorEl(null);
  };

  const gridNodeData = nodeId && nodeData[nodeId];

  const rawRows: unknown = gridNodeData && gridNodeData.rawRows;

  const inferredColumns = React.useMemo(
    () => inferColumns(Array.isArray(rawRows) ? rawRows : []),
    [rawRows],
  );

  const columnSuggestions = React.useMemo(() => {
    const existingFields = new Set(value.map(({ field }) => field));
    return inferredColumns.filter((column) => !existingFields.has(column.field));
  }, [inferredColumns, value]);

  const handleCreateColumn = React.useCallback(
    (suggestion: SerializableGridColumn) => () => {
      const existingFields = new Set(value.map(({ field }) => field));
      const newFieldName = generateUniqueString(suggestion.field, existingFields);
      const newValue = [...value, { ...suggestion, field: newFieldName }];
      onChange(newValue);
      setEditedIndex(newValue.length - 1);
      handleClose();
    },
    [value, onChange],
  );

  const handleColumnItemClick = React.useCallback(
    (index: number) => () => {
      setEditedIndex(index);
    },
    [],
  );

  const handleColumnChange = React.useCallback<React.Dispatch<SerializableGridColumn>>(
    (newValue) => {
      onChange(value.map((column, i) => (i === editedIndex ? newValue : column)));
    },
    [editedIndex, onChange, value],
  );

  const handleColumnDelete = React.useCallback(
    (deletedIndex: number) => (event: React.MouseEvent) => {
      event.stopPropagation();
      onChange(value.filter((column, i) => i !== deletedIndex));
    },
    [onChange, value],
  );

  const handleRecreateColumns = React.useCallback(() => {
    if (inferredColumns.length > 0) {
      onChange(inferredColumns);
    }
  }, [inferredColumns, onChange]);

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handlePopoverClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  const popoverIdValue = React.useId();
  const popoverId = open ? popoverIdValue : undefined;

  React.useEffect(() => {
    if (open) {
      setEditedIndex(null);
    }
  }, [open]);

  return (
    <React.Fragment>
      <PropertyControl propType={propType}>
        <Button aria-describedby={popoverId} onClick={handlePopoverClick}>
          {label}
        </Button>
      </PropertyControl>
      <Popover
        id={popoverId}
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
      >
        <Box sx={{ minWidth: 300, p: 2 }} aria-label="Column editor">
          {editedColumn ? (
            <React.Fragment>
              <IconButton aria-label="Back" onClick={() => setEditedIndex(null)}>
                <ArrowBackIcon />
              </IconButton>
              <GridColumnEditor
                value={editedColumn}
                onChange={handleColumnChange}
                disabled={disabled}
              />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Tooltip describeChild title="Recreate columns">
                <span>
                  <IconButton
                    aria-label="Recreate columns"
                    onClick={handleRecreateColumns}
                    disabled={inferredColumns.length <= 0}
                  >
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Add column">
                <IconButton onClick={handleMenuClick} disabled={disabled}>
                  <AddIcon />
                </IconButton>
              </Tooltip>
              <Menu
                id="new-column-menu"
                anchorEl={menuAnchorEl}
                open={menuOpen}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                {columnSuggestions.map((suggestion) => (
                  <MenuItem key={suggestion.field} onClick={handleCreateColumn(suggestion)}>
                    {suggestion.field}
                  </MenuItem>
                ))}
                <MenuItem onClick={handleCreateColumn({ field: 'new' })}>New column</MenuItem>
              </Menu>
              <List>
                {value.map((colDef, i) => {
                  return (
                    <ListItem
                      key={colDef.field}
                      disableGutters
                      onClick={handleColumnItemClick(i)}
                      secondaryAction={
                        <IconButton
                          aria-label="Remove column"
                          edge="end"
                          onClick={handleColumnDelete(i)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemButton>
                        <ListItemText primary={colDef.headerName || colDef.field} />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </React.Fragment>
          )}
        </Box>
      </Popover>
    </React.Fragment>
  );
}

export default GridColumnsPropEditor;
