import * as React from 'react';
import { TextFieldProps, MenuItem, TextField } from '@mui/material';
import { ArgTypeDefinitions, createComponent } from '@mui/toolpad-core';
import * as _ from 'lodash-es';
import {
  FORM_INPUT_ARG_TYPES,
  FormInputComponentProps,
  useFormInput,
  withComponentForm,
} from './Form.js';
import { SX_PROP_HELPER_TEXT } from './constants.js';

export interface SelectOption {
  value: string;
  label?: string;
}

export type SelectProps = Omit<TextFieldProps, 'value' | 'onChange'> & {
  value: string;
  onChange: (newValue: string) => void;
  defaultValue: string;
  options: (string | SelectOption)[];
} & Pick<FormInputComponentProps, 'name' | 'isRequired' | 'isInvalid'>;

function Select({
  options,
  value,
  onChange,
  fullWidth,
  sx,
  defaultValue,
  isRequired,
  isInvalid,
  ...rest
}: SelectProps) {
  const { onFormInputChange, formInputError, renderFormInput } = useFormInput<string>({
    name: rest.name,
    label: rest.label as string,
    value,
    onChange,
    defaultValue,
    validationProps: { isRequired, isInvalid },
  });

  const id = React.useId();

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      onFormInputChange(newValue);
    },
    [onFormInputChange],
  );

  const renderedOptions = React.useMemo(
    () =>
      options.map((option, i) => {
        const parsedOption: SelectOption =
          option && typeof option === 'object' ? option : { value: String(option) };
        return (
          <MenuItem key={parsedOption.value ?? `${id}::${i}`} value={parsedOption.value}>
            {String(parsedOption.label ?? parsedOption.value)}
          </MenuItem>
        );
      }),
    [id, options],
  );

  return renderFormInput(
    <TextField
      {...rest}
      value={value}
      onChange={handleChange}
      select
      fullWidth
      sx={{ ...(!fullWidth && !value ? { width: 120 } : {}), ...sx }}
      {...(formInputError && {
        error: Boolean(formInputError),
        helperText: formInputError.message || '',
      })}
    >
      {renderedOptions}
    </TextField>,
  );
}

const FormWrappedSelect = withComponentForm(Select);

export default createComponent(FormWrappedSelect, {
  helperText: 'The Select component lets you select a value from a set of options.',
  layoutDirection: 'both',
  loadingPropSource: ['value', 'options'],
  loadingProp: 'disabled',
  argTypes: {
    options: {
      helperText: 'The available options to select from.',
      type: 'array',
      schema: {
        type: 'array',
        items: {
          type: ['object', 'string'],
          additionalProperties: true,
          properties: {
            value: {
              type: 'string',
            },
            label: {
              type: 'string',
            },
          },
          required: ['value'],
        },
      },
      default: [],
      control: { type: 'SelectOptions' },
    },
    value: {
      helperText: 'The currently selected value.',
      type: 'string',
      default: '',
      onChangeProp: 'onChange',
      defaultValueProp: 'defaultValue',
    },
    defaultValue: {
      helperText: 'A default value.',
      type: 'string',
      default: '',
    },
    label: {
      helperText: 'A label that describes the option that can be selected. e.g. "Country".',
      type: 'string',
      default: '',
    },
    variant: {
      helperText:
        'One of the available MUI TextField [variants](https://mui.com/material-ui/react-button/#basic-button). Possible values are `outlined`, `filled` or `standard`',
      type: 'string',
      enum: ['outlined', 'filled', 'standard'],
      default: 'outlined',
    },
    size: {
      helperText: 'The size of the select. One of `small`, or `medium`.',
      type: 'string',
      enum: ['small', 'medium'],
      default: 'small',
    },
    fullWidth: {
      helperText: 'Whether the select should occupy all available horizontal space.',
      type: 'boolean',
    },
    disabled: {
      helperText: 'Whether the select is disabled.',
      type: 'boolean',
    },
    ...(_.pick(FORM_INPUT_ARG_TYPES, [
      'name',
      'isRequired',
      'isInvalid',
    ]) as ArgTypeDefinitions<SelectProps>),
    sx: {
      helperText: SX_PROP_HELPER_TEXT,
      type: 'object',
    },
  },
});
