import { createComponent } from '@toolpad/studio-runtime';
import * as React from 'react';
import {
  FormControlLabel,
  FormGroup,
  Checkbox as MuiCheckbox,
  FormHelperText,
  FormControl,
  Typography as MuiTypography,
  Switch as MuiSwitch,
  SwitchProps,
} from '@mui/material';
import { errorFrom } from '@toolpad/utils/errors';
import ErrorIcon from '@mui/icons-material/Error';
import type { CheckboxProps as MuiCheckBoxProps } from '@mui/material/Checkbox';
import type { FormControlLabelProps } from '@mui/material/FormControlLabel';
import { SX_PROP_HELPER_TEXT } from './constants';
import {
  FormInputComponentProps,
  useFormInput,
  withComponentForm,
  FORM_INPUT_ARG_TYPES,
} from './Form';

interface ErrorDisplayProps {
  error: unknown;
}

function ErrorDisplay({ error }: ErrorDisplayProps) {
  const errMessage = errorFrom(error).message;
  return (
    <MuiTypography sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}>
      <ErrorIcon fontSize="small" color="error" />
      <span>{errMessage}</span>
    </MuiTypography>
  );
}
export type Props = Omit<FormControlLabelProps, 'control' | 'onChange'> &
  Omit<MuiCheckBoxProps, 'onChange'> & {
    onChange: (newValue: boolean) => void;
    label?: string;
    defaultValue: string;
    error?: unknown;
    fullWidth: boolean;
    mode: 'checkBox' | 'switch';
  } & Pick<FormInputComponentProps, 'name' | 'isRequired'> &
  SwitchProps;

function Checkbox(props: Props) {
  const { onFormInputChange, renderFormInput, formInputError } = useFormInput<boolean>({
    name: props.name,
    label: props.label,
    onChange: props.onChange,
    validationProps: { isRequired: props.isRequired },
  });

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.checked;
      onFormInputChange(newValue);
    },
    [onFormInputChange],
  );

  const CheckboxControl = props.mode === 'switch' ? MuiSwitch : MuiCheckbox;

  return renderFormInput(
    <FormControl error={Boolean(formInputError)} fullWidth={props.fullWidth}>
      <FormGroup>
        <FormControlLabel
          label={props.label}
          checked={props.checked ?? false}
          labelPlacement={props.labelPlacement}
          control={
            <CheckboxControl
              onChange={handleChange}
              required={props.isRequired}
              size={props.size}
              defaultChecked={props.defaultChecked}
              disabled={props.disabled}
              color={props.color}
              sx={props.sx}
              checked={props.checked ?? false}
            />
          }
          slotProps={props.componentsProps}
        />
      </FormGroup>
      <FormHelperText>{formInputError?.message || ''}</FormHelperText>
    </FormControl>,
  );
}

function Component(props: Props) {
  if (props.error) {
    return <ErrorDisplay error={props.error} />;
  }
  return <Checkbox {...props} />;
}

const FormWrappedCheckbox = withComponentForm(Component);
export default createComponent(FormWrappedCheckbox, {
  layoutDirection: 'both',
  loadingProp: 'checked',
  errorProp: 'error',
  argTypes: {
    mode: {
      helperText: 'Defines how the content is rendered. Either as plain CheckBox, Switch',
      type: 'string',
      enum: ['checkBox', 'switch'],
      enumLabels: {
        checkBox: 'CheckBox',
        switch: 'Switch',
      },
      default: 'checkBox',
      label: 'Mode',
      control: { type: 'ToggleButtons' },
    },
    label: {
      helperText: 'A text or an element to be used in an enclosing label element.',
      type: 'string',
      default: 'Label',
    },
    checked: {
      helperText: 'If true, the component is checked.',
      onChangeProp: 'onChange',
      type: 'boolean',
    },
    color: {
      helperText:
        'The color of the component. It supports both default and custom theme colors, which can be added as shown in the palette customization guide.',
      type: 'string',
      enum: ['default', 'primary', 'secondary', 'error', 'info', 'success', 'warning'],
      default: 'primary',
    },
    disabled: {
      helperText: 'If true, the component is disabled.',
      type: 'boolean',
      default: false,
    },

    size: {
      helperText:
        'The size of the component. small is equivalent to the dense checkbox, switch styling.',
      type: 'string',
      enum: ['medium', 'small', 'string'],
      default: 'medium',
    },
    sx: {
      helperText: SX_PROP_HELPER_TEXT,
      type: 'object',
    },
    fullWidth: {
      helperText: 'Whether the select should occupy all available horizontal space.',
      type: 'boolean',
    },
    componentsProps: {
      helperText: 'The props used for each slot inside.',
      type: 'object',
      visible: ({ mode }: Props) => mode === 'checkBox',
    },
    labelPlacement: {
      helperText: 'The position of the label.',
      type: 'string',
      enum: ['bottom', 'end', 'start', 'top'],
      default: 'end',
    },
    ...FORM_INPUT_ARG_TYPES,
  },
});
