import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
} from '@mui/material';
import * as React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { EditorProps } from '../../types';
import PropertyControl from '../../components/PropertyControl';

interface SelectOption {
  label?: string;
  value: string;
}

function SelectOptionsPropEditor({
  propType,
  label,
  value = [],
  onChange,
}: EditorProps<(string | SelectOption)[]>) {
  const [addOptionState, setAddOptionState] = React.useState(false);
  const [editOptionsDialogOpen, setEditOptionsDialogOpen] = React.useState(false);
  const optionInputRef = React.useRef<HTMLInputElement | null>(null);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

  const editingOption: SelectOption | null = React.useMemo(() => {
    if (typeof editingIndex === 'number') {
      const option: SelectOption | string = value[editingIndex];
      if (typeof option === 'string') {
        return {
          value: option,
          label: '',
        };
      }
      return option;
    }
    return null;
  }, [editingIndex, value]);

  const watchInputValue = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const inputText = (event.target as HTMLInputElement).value;
      if (
        value.some((item) =>
          (item as SelectOption)?.value
            ? (item as SelectOption).value === inputText
            : item === inputText,
        )
      ) {
        setAddOptionState(true);
      } else {
        setAddOptionState(false);
      }
    },
    [value],
  );

  const handleOptionTextInput = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        const inputText = (event.target as HTMLInputElement).value;
        if (addOptionState) {
          return;
        }
        onChange([...value, inputText]);
        if (optionInputRef.current) {
          optionInputRef.current.value = '';
        }
      }
    },
    [onChange, value, addOptionState],
  );

  const handleOptionDelete = React.useCallback(
    (deletedIndex: number) => (event: React.MouseEvent) => {
      event.stopPropagation();
      onChange(value.filter((column, i) => i !== deletedIndex));
    },
    [onChange, value],
  );

  const handleDeleteAll = React.useCallback(() => {
    onChange([]);
  }, [onChange]);

  const handleOptionItemClick = React.useCallback(
    (index: number) => () => {
      setEditingIndex(index);
    },
    [],
  );

  const handleOptionChange = React.useCallback(
    (newOption: string | SelectOption) => {
      const errorState = value.some((item) =>
        (item as SelectOption)?.value
          ? (item as SelectOption).value === (newOption as SelectOption)?.value ?? newOption
          : item === (newOption as SelectOption)?.value ?? newOption,
      );

      if (errorState) {
        setAddOptionState(true);
      } else {
        setAddOptionState(false);
      }

      if (typeof newOption === 'object') {
        if (!newOption.label) {
          newOption = newOption.value;
        }
      }

      onChange(value.map((option, i) => (i === editingIndex ? newOption : option)));
    },
    [editingIndex, onChange, value],
  );

  const handleEditOptionsDialogClose = React.useCallback(() => {
    setEditingIndex(null);
    setEditOptionsDialogOpen(false);
  }, []);

  return (
    <React.Fragment>
      <PropertyControl propType={propType}>
        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          onClick={() => {
            setEditOptionsDialogOpen(true);
          }}
        >
          {label}
        </Button>
      </PropertyControl>
      <Dialog
        fullWidth
        open={editOptionsDialogOpen}
        onClose={() => {
          setEditOptionsDialogOpen(false);
        }}
      >
        {editingOption ? (
          <React.Fragment>
            <DialogTitle>
              <IconButton aria-label="Back" onClick={() => setEditingIndex(null)}>
                <ArrowBackIcon />
              </IconButton>
              Edit option &ldquo;{editingOption.value}&rdquo;
            </DialogTitle>
            <DialogContent>
              <Stack gap={1} py={1}>
                <TextField
                  label="Value"
                  error={addOptionState}
                  helperText={
                    addOptionState ? (
                      <span>
                        Do not input <kbd>same</kbd> value
                      </span>
                    ) : null
                  }
                  value={editingOption.value}
                  onChange={(event) => {
                    handleOptionChange({ ...editingOption, value: event.target.value });
                  }}
                />
                <TextField
                  label="Label"
                  value={editingOption.label}
                  onChange={(event) => {
                    handleOptionChange({ ...editingOption, label: event.target.value });
                  }}
                />
              </Stack>
            </DialogContent>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <DialogTitle>
              Edit options
              {value.length > 0 ? (
                <Button
                  aria-label="Delete all options"
                  variant="text"
                  color="inherit"
                  onClick={handleDeleteAll}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: 16,
                  }}
                >
                  Delete All
                </Button>
              ) : null}
            </DialogTitle>
            <DialogContent>
              {value.length > 0 ? (
                <List>
                  {value.map((option, i) => {
                    return (
                      <ListItem
                        key={i}
                        disableGutters
                        onClick={handleOptionItemClick(i)}
                        secondaryAction={
                          <IconButton
                            aria-label="Delete option"
                            edge="end"
                            onClick={handleOptionDelete(i)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemButton>
                          <ListItemText
                            primary={
                              typeof option === 'string' ? option : (option as SelectOption).value
                            }
                            secondary={
                              typeof option === 'object'
                                ? `Label: "${(option as SelectOption).label}"`
                                : null
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              ) : null}
              <TextField
                fullWidth
                error={addOptionState}
                sx={{ my: 1 }}
                variant="outlined"
                onInput={watchInputValue}
                inputRef={optionInputRef}
                onKeyUp={handleOptionTextInput}
                label={'Add option'}
                helperText={
                  addOptionState ? (
                    <span>
                      Do not input <kbd>same</kbd> value
                    </span>
                  ) : (
                    <span>
                      Press <kbd>Enter</kbd> or <kbd>Return</kbd> to add
                    </span>
                  )
                }
              />
            </DialogContent>
          </React.Fragment>
        )}
        <DialogActions>
          <Button color="inherit" variant="text" onClick={handleEditOptionsDialogClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}

export default SelectOptionsPropEditor;
