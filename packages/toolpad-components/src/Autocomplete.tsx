import * as React from 'react';
import {
  Autocomplete as MuiAutocomplete,
  AutocompleteProps as MuiAutocompleteProps,
  TextField,
} from '@mui/material';
import { createComponent } from '@mui/toolpad-core';
import { SX_PROP_HELPER_TEXT } from './constants.js';

type AutocompleteOption = string | { label?: string; value?: string };
type AutocompleteValue = string | null;

interface AutocompleteProps
  extends Omit<
    MuiAutocompleteProps<AutocompleteOption, false, false, false>,
    'renderInput' | 'value' | 'onChange'
  > {
  value: AutocompleteValue;
  onChange: (newValue: AutocompleteValue) => void;
  options: AutocompleteOption[];
  labelField?: string;
  valueField?: string;
  label: string;
}

function Autocomplete({
  options,
  labelField,
  valueField,
  label,
  onChange,
  value,
  ...rest
}: AutocompleteProps) {
  const [selectedVal, setSelectedVal] = React.useState<AutocompleteOption | null>(null);

  const getValue = React.useCallback(
    (selection: AutocompleteOption | null): AutocompleteValue => {
      if (!selection) {
        return null;
      }
      if (typeof selection === 'string') {
        return selection;
      }
      if (typeof selection === 'object') {
        if (valueField) {
          return (selection as any)?.[valueField];
        }
        return selection?.value ?? selection?.label ?? null;
      }
      return null;
    },
    [valueField],
  );

  const getOptionLabel = React.useCallback(
    (option: AutocompleteOption) => {
      if (!option) {
        return '';
      }
      if (typeof option === 'string') {
        return option;
      }
      if (typeof option === 'object') {
        if (labelField) {
          return (option as any)?.[labelField];
        }
        return option?.label ?? '';
      }
      return '';
    },
    [labelField],
  );

  const handleChange = React.useCallback(
    (event: React.SyntheticEvent<Element>, selection: AutocompleteOption | null) => {
      const newValue: AutocompleteValue = getValue(selection);
      onChange(newValue);
      setSelectedVal(selection);
    },
    [onChange, getValue],
  );
  return (
    <MuiAutocomplete
      onChange={handleChange}
      options={options ?? []}
      isOptionEqualToValue={(option, selectedValue) => getValue(option) === getValue(selectedValue)}
      getOptionLabel={getOptionLabel}
      value={selectedVal}
      renderInput={(params) => <TextField {...params} label={label} variant="outlined" />}
      {...rest}
    />
  );
}

export default createComponent(Autocomplete, {
  layoutDirection: 'both',
  argTypes: {
    options: {
      helperText: 'The options available to search from.',
      type: 'array',
      default: [],
      control: {
        type: 'SelectOptions',
      },
    },
    value: {
      helperText: 'The value of the autocomplete.',
      type: 'string',
      onChangeProp: 'onChange',
      default: '',
    },
    label: {
      helperText: 'The label to display for the autocomplete.',
      type: 'string',
      default: 'Search…',
    },
    labelField: {
      helperText: 'The field to use as the label for each option.',
      type: 'string',
    },
    valueField: {
      helperText: 'The field to use as the value for each option.',
      type: 'string',
    },
    fullWidth: {
      helperText: 'If true, the autocomplete will take up the full width of its container.',
      type: 'boolean',
      default: true,
    },
    size: {
      helperText: 'The size of the autocomplete. One of `small`, `medium`, or `large`.',
      type: 'string',
      enum: ['small', 'medium', 'large'],
      default: 'small',
    },
    loading: {
      helperText: 'If true, the autocomplete will display a loading indicator.',
      type: 'boolean',
    },
    disabled: {
      helperText: 'If true, the autocomplete will be disabled.',
      type: 'boolean',
    },
    sx: {
      helperText: SX_PROP_HELPER_TEXT,
      type: 'object',
    },
  },
});
