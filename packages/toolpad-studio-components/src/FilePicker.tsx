import * as React from 'react';
import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material';
import createBuiltin from './createBuiltin';
import {
  FORM_INPUT_ARG_TYPES,
  FormInputComponentProps,
  useFormInput,
  withComponentForm,
} from './Form';
import { SX_PROP_HELPER_TEXT } from './constants';

interface FullFile {
  name: string;
  type: string;
  size: number;
  base64: null | string;
}

export type FilePickerProps = MuiTextFieldProps & {
  multiple: boolean;
  value: FullFile[];
  onChange: (files: FullFile[]) => void;
  label?: string;
} & Pick<FormInputComponentProps, 'name' | 'isRequired'>;

const readFile = async (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const readerBase64 = new FileReader();

    readerBase64.onload = (event) => {
      if (!event.target) {
        reject();
        return;
      }

      resolve(event.target.result as string);
    };

    readerBase64.readAsDataURL(file);
  });
};

function FilePicker({ multiple, value, onChange, isRequired, ...rest }: FilePickerProps) {
  const { onFormInputChange, formInputError, renderFormInput } = useFormInput<FullFile[]>({
    name: rest.name,
    label: rest.label,
    value,
    onChange,
    validationProps: { isRequired },
  });

  const handleChange = async (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const filesPromises = Array.from(changeEvent.target.files || []).map(async (file) => {
      const fullFile: FullFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        base64: await readFile(file),
      };

      return fullFile;
    });

    const files = await Promise.all(filesPromises);

    onFormInputChange(files);
  };

  return renderFormInput(
    <MuiTextField
      {...rest}
      type="file"
      value={undefined}
      onChange={handleChange}
      {...(formInputError && {
        error: Boolean(formInputError),
        helperText: formInputError.message || '',
      })}
      slotProps={{
        htmlInput: { multiple },
        inputLabel: { shrink: true },
      }}
    />,
  );
}

const FormWrappedFilePicker = withComponentForm(FilePicker);

export default createBuiltin(FormWrappedFilePicker, {
  helperText: 'File Picker component.\nIt allows users to take select and read files.',
  argTypes: {
    value: {
      helperText: 'The value that is controlled by this FilePicker.',
      type: 'object',
      visible: false,
      onChangeProp: 'onChange',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          size: { type: 'number' },
          base64: { type: 'string' },
        },
      },
    },
    label: {
      helperText:
        'A label that describes the content of the FilePicker, for example "Profile Image".',
      type: 'string',
    },
    multiple: {
      helperText: 'Whether the FilePicker should accept multiple files.',
      type: 'boolean',
      default: true,
    },
    disabled: {
      helperText: 'Whether the FilePicker is disabled.',
      type: 'boolean',
    },
    ...FORM_INPUT_ARG_TYPES,
    sx: {
      helperText: SX_PROP_HELPER_TEXT,
      type: 'object',
    },
  },
});
