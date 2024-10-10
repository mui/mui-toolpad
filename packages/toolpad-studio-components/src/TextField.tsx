import * as React from 'react';
import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
  BoxProps,
} from '@mui/material';
import createBuiltin from './createBuiltin';
import {
  FORM_INPUT_ARG_TYPES,
  FORM_TEXT_INPUT_ARG_TYPES,
  FormInputComponentProps,
  useFormInput,
  withComponentForm,
} from './Form';
import { SX_PROP_HELPER_TEXT } from './constants';

export type TextFieldProps = Omit<MuiTextFieldProps, 'value' | 'onChange'> & {
  value: string;
  onChange?: (newValue: string) => void;
  label?: string;
  defaultValue: string;
  alignItems?: BoxProps['alignItems'];
  justifyContent?: BoxProps['justifyContent'];
  password?: boolean;
} & Pick<FormInputComponentProps, 'name' | 'isRequired' | 'minLength' | 'maxLength'>;

function TextField({
  defaultValue,
  onChange,
  value,
  isRequired,
  minLength,
  maxLength,
  password,
  ...rest
}: TextFieldProps) {
  const { onFormInputChange, formInputError, renderFormInput } = useFormInput<string>({
    name: rest.name,
    label: rest.label,
    value,
    onChange,
    emptyValue: '',
    defaultValue,
    validationProps: { isRequired, minLength, maxLength },
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
      type={password ? 'password' : 'text'}
    />,
  );
}

const FormWrappedTextField = withComponentForm(TextField);

export default createBuiltin(FormWrappedTextField, {
  helperText:
    'The Material UI [TextField](https://mui.com/material-ui/react-text-field/) component lets you input a text value.',
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
      helperText: 'A label that describes the content of the text field, for example "First name".',
      type: 'string',
    },
    variant: {
      helperText:
        'One of the available Material UI TextField [variants](https://mui.com/material-ui/react-button/#basic-button). Possible values are `outlined`, `filled` or `standard`',
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
    password: {
      helperText: "Masks the input to hide what's being typed.",
      type: 'boolean',
    },
    placeholder: {
      helperText: 'The short hint displayed in the `input` before the user enters a value.',
      type: 'string',
    },
    disabled: {
      helperText: 'Whether the input is disabled.',
      type: 'boolean',
    },
    ...FORM_INPUT_ARG_TYPES,
    ...FORM_TEXT_INPUT_ARG_TYPES,
    sx: {
      helperText: SX_PROP_HELPER_TEXT,
      type: 'object',
    },
  },
});
