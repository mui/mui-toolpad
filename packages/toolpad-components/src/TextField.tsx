import * as React from 'react';
import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
  BoxProps,
} from '@mui/material';
import { createComponent } from '@mui/toolpad-core';
import * as _ from 'lodash-es';
import { FORM_INPUT_VALIDATION_ARG_TYPES, FormInputValidationProps, useFormInput } from './Form.js';
import { SX_PROP_HELPER_TEXT } from './constants.js';

export type TextFieldProps = Omit<MuiTextFieldProps, 'value' | 'onChange'> & {
  value: string;
  onChange: (newValue: string) => void;
  defaultValue: string;
  alignItems?: BoxProps['alignItems'];
  justifyContent?: BoxProps['justifyContent'];
  name: string;
} & Pick<FormInputValidationProps, 'isRequired' | 'minLength' | 'maxLength' | 'isInvalid'>;

function TextField({
  defaultValue,
  onChange,
  value,
  isRequired,
  minLength,
  maxLength,
  isInvalid,
  ...rest
}: TextFieldProps) {
  const { onFormInputChange, formInputError, renderFormInput } = useFormInput<string>({
    name: rest.name,
    label: rest.label as string,
    value,
    onChange,
    emptyValue: '',
    defaultValue,
    validationProps: { isRequired, minLength, maxLength, isInvalid },
  });

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      onFormInputChange(newValue);
    },
    [onFormInputChange],
  );

  return renderFormInput(
    <MuiTextField
      value={value}
      onChange={handleChange}
      {...rest}
      {...(formInputError && {
        error: Boolean(formInputError),
        helperText: formInputError.message || '',
      })}
    />,
  );
}

export default createComponent(TextField, {
  helperText: 'The TextField component lets you input a text value.',
  layoutDirection: 'both',
  argTypes: {
    value: {
      helperText: 'The value that is controlled by this text input.',
      type: 'string',
      default: '',
      onChangeProp: 'onChange',
      defaultValueProp: 'defaultValue',
    },
    defaultValue: {
      helperText: 'A default value for when the input is still empty.',
      type: 'string',
      default: '',
    },
    label: {
      helperText: 'A label that describes the content of the text field. e.g. "First name".',
      type: 'string',
    },
    name: {
      helperText: 'Name of this element. Used as a reference in form data.',
      type: 'string',
    },
    variant: {
      helperText:
        'One of the available MUI TextField [variants](https://mui.com/material-ui/react-button/#basic-button). Possible values are `outlined`, `filled` or `standard`',
      type: 'string',
      enum: ['outlined', 'filled', 'standard'],
      default: 'outlined',
    },
    size: {
      helperText: 'The size of the input. One of `small`, or `medium`.',
      type: 'string',
      enum: ['small', 'medium'],
      default: 'small',
    },
    fullWidth: {
      helperText: 'Whether the input should occupy all available horizontal space.',
      type: 'boolean',
    },
    disabled: {
      helperText: 'Whether the input is disabled.',
      type: 'boolean',
    },
    ..._.pick(FORM_INPUT_VALIDATION_ARG_TYPES, [
      'isRequired',
      'minLength',
      'maxLength',
      'isInvalid',
    ]),
    sx: {
      helperText: SX_PROP_HELPER_TEXT,
      type: 'object',
    },
  },
});
