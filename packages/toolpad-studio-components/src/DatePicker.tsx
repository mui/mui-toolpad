import * as React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker, DesktopDatePickerProps } from '@mui/x-date-pickers/DesktopDatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import createBuiltin from './createBuiltin';
import {
  FORM_INPUT_ARG_TYPES,
  FormInputComponentProps,
  useFormInput,
  withComponentForm,
} from './Form';
import { SX_PROP_HELPER_TEXT } from './constants';

const LOCALE_LOADERS = new Map([
  ['en', () => import('dayjs/locale/en')],
  ['nl', () => import('dayjs/locale/nl')],
  ['fr', () => import('dayjs/locale/fr')],
  // TODO...
]);

interface LoadableLocale {
  locale: string;
  load: () => Promise<unknown>;
}

const handlers = new Set<() => void>();
let loadedLocale: undefined | string;

function trygetLoadableLocale(locale: string): LoadableLocale | null {
  const load = LOCALE_LOADERS.get(locale);
  if (load) {
    return { locale, load };
  }
  return null;
}

function getLoadableLocale(): LoadableLocale | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const languages = window.navigator.languages;
  for (const locale of languages) {
    const { language } = new Intl.Locale(locale);
    const result = trygetLoadableLocale(locale) || trygetLoadableLocale(language);
    if (result) {
      return result;
    }
  }
  return null;
}

const loadableLocale = getLoadableLocale();
if (loadableLocale) {
  loadableLocale.load().then(() => {
    loadedLocale = loadableLocale.locale;
    handlers.forEach((handler) => handler());
  });
}

function subscribeLocaleLoader(cb: () => void) {
  handlers.add(cb);
  return () => handlers.delete(cb);
}

function getSnapshot() {
  return loadedLocale;
}

export interface DatePickerProps
  extends Omit<DesktopDatePickerProps<dayjs.Dayjs>, 'value' | 'onChange' | 'defaultValue' | 'name'>,
    Pick<FormInputComponentProps, 'name' | 'isRequired'> {
  value?: string;
  onChange?: (newValue: string | null) => void;
  label?: string;
  format: string;
  fullWidth: boolean;
  variant: 'outlined' | 'filled' | 'standard';
  size: 'small' | 'medium';
  sx: any;
  defaultValue?: string;
}

function DatePicker({
  format,
  onChange,
  value: valueProp,
  defaultValue: defaultValueProp,
  isRequired,
  ...rest
}: DatePickerProps) {
  const { onFormInputChange, formInputError, renderFormInput } = useFormInput<string | null>({
    name: rest.name,
    label: rest.label,
    value: valueProp,
    onChange,
    defaultValue: defaultValueProp,
    emptyValue: null,
    validationProps: { isRequired },
  });

  const handleChange = React.useMemo(
    () =>
      onFormInputChange
        ? (newValue: dayjs.Dayjs | null) => {
            // date-only form of ISO8601. See https://tc39.es/ecma262/#sec-date-time-string-format
            const stringValue = newValue?.format('YYYY-MM-DD') || '';

            onFormInputChange(stringValue);
          }
        : undefined,
    [onFormInputChange],
  );

  const adapterLocale = React.useSyncExternalStore(
    subscribeLocaleLoader,
    getSnapshot,
    () => undefined,
  );

  const value = React.useMemo(
    () => (typeof valueProp === 'string' ? dayjs(valueProp) : valueProp),
    [valueProp],
  );

  const defaultValue = React.useMemo(
    () => (typeof defaultValueProp === 'string' ? dayjs(defaultValueProp) : defaultValueProp),
    [defaultValueProp],
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={adapterLocale}>
      {renderFormInput(
        <DesktopDatePicker<dayjs.Dayjs>
          {...rest}
          format={format || 'L'}
          value={value || null}
          onChange={handleChange}
          defaultValue={defaultValue}
          slotProps={{
            textField: {
              fullWidth: rest.fullWidth,
              variant: rest.variant,
              size: rest.size,
              sx: rest.sx,
              ...(formInputError && {
                error: Boolean(formInputError),
                helperText: formInputError.message || '',
              }),
            },
          }}
        />,
      )}
    </LocalizationProvider>
  );
}

const FormWrappedDatePicker = withComponentForm(DatePicker);

export default createBuiltin(FormWrappedDatePicker, {
  helperText:
    'The [MUI X Date Picker](https://mui.com/x/react-date-pickers/date-picker/) component.\n\nThe date picker lets the user select a date.',
  argTypes: {
    value: {
      helperText: 'The currently selected date.',
      type: 'string',
      default: '',
      onChangeProp: 'onChange',
      defaultValueProp: 'defaultValue',
    },
    format: {
      helperText:
        'The [format](https://day.js.org/docs/en/display/format) of the date in the UI. The value for the bindings is always be in the `YYYY-MM-DD` format. Leave empty to let the end-user locale define the format.',

      type: 'string',
      default: '',
    },
    defaultValue: {
      helperText: 'A default value for the date picker.',
      type: 'string',
      default: '',
    },
    label: {
      helperText:
        'A label that describes the content of the date picker, for example "Arrival date".',
      type: 'string',
    },
    name: {
      helperText: 'Name of this element. Used as a reference in form data.',
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
      helperText: 'The size of the component. One of `small`, or `medium`.',
      type: 'string',
      enum: ['small', 'medium'],
      default: 'small',
    },
    fullWidth: {
      helperText: 'Whether the button should occupy all available horizontal space.',
      type: 'boolean',
    },
    disabled: {
      helperText: 'The date picker is disabled.',
      type: 'boolean',
    },
    ...FORM_INPUT_ARG_TYPES,
    sx: {
      helperText: SX_PROP_HELPER_TEXT,
      type: 'object',
    },
  },
});
