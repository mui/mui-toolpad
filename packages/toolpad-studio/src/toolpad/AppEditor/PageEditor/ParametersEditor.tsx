import { Box, TextField, IconButton, SxProps, inputLabelClasses } from '@mui/material';
import * as React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import { BindableAttrValue, ScopeMeta, JsRuntime, LiveBinding } from '@toolpad/studio-runtime';
import { WithControlledProp } from '@toolpad/utils/types';
import BindableEditor from './BindableEditor';

export interface StringRecordEntriesEditorProps
  extends WithControlledProp<[string, BindableAttrValue<any>][]> {
  label?: string;
  liveValue: [string, LiveBinding][];
  globalScope: Record<string, unknown>;
  globalScopeMeta: ScopeMeta;
  fieldLabel?: string;
  valueLabel?: string;
  autoFocus?: boolean;
  sx?: SxProps;
  jsRuntime: JsRuntime;
  env?: Record<string, string | undefined>;
  declaredEnvKeys?: string[];
  disabled?: boolean;
}

export default function ParametersEditor({
  value,
  onChange,
  liveValue,
  globalScope,
  label,
  fieldLabel = 'field',
  valueLabel = 'value',
  autoFocus = false,
  sx,
  jsRuntime,
  disabled,
  globalScopeMeta,
  env,
  declaredEnvKeys,
}: StringRecordEntriesEditorProps) {
  const fieldInputRef = React.useRef<HTMLInputElement>(null);

  const handleRemove = React.useCallback(
    (index: number) => () => {
      onChange(value.filter((entry, i) => i !== index));
    },
    [onChange, value],
  );

  const isValidFieldName: boolean[] = React.useMemo(() => {
    const counts: Record<string, number> = {};
    value.forEach(([field]) => {
      counts[field] = counts[field] ? counts[field] + 1 : 1;
    });
    return value.map(([field]) => !!field && counts[field] <= 1);
  }, [value]);

  return (
    <Box
      sx={sx}
      display="grid"
      gridTemplateColumns="1fr 2fr auto"
      alignItems="center"
      columnGap={1}
      rowGap={0}
    >
      {label ? <Box gridColumn="span 3">{label}:</Box> : null}
      {value.map(([field, fieldValue], index) => {
        const liveBinding: LiveBinding | undefined = liveValue[index]?.[1];

        return (
          <React.Fragment key={index}>
            <TextField
              label={valueLabel}
              value={field}
              autoFocus
              onChange={(event) =>
                onChange(
                  value.map((entry, i) => (i === index ? [event.target.value, entry[1]] : entry)),
                )
              }
              sx={{ [`& .${inputLabelClasses.root}`]: { fontSize: 12 } }}
              error={!isValidFieldName[index]}
              disabled={disabled}
              slotProps={{
                htmlInput: { sx: { fontSize: 12 } },
              }}
            />
            <BindableEditor
              liveBinding={liveBinding}
              jsRuntime={jsRuntime}
              globalScope={globalScope}
              globalScopeMeta={globalScopeMeta}
              label={field}
              propType={{ type: 'string' }}
              value={fieldValue}
              onChange={(newBinding) =>
                onChange(value.map((entry, i) => (i === index ? [entry[0], newBinding] : entry)))
              }
              disabled={disabled}
              env={env}
              declaredEnvKeys={declaredEnvKeys}
            />

            <IconButton
              aria-label="Delete property"
              onClick={handleRemove(index)}
              sx={{ ml: -0.5 }}
            >
              <DeleteIcon fontSize="inherit" />
            </IconButton>
          </React.Fragment>
        );
      })}

      <form autoComplete="off" style={{ display: 'contents' }}>
        <TextField
          inputRef={fieldInputRef}
          label={fieldLabel}
          value=""
          onChange={(event) => {
            onChange([...value, [event.target.value, null]]);
          }}
          sx={{ [`& .${inputLabelClasses.root}`]: { fontSize: 12 } }}
          autoFocus={autoFocus}
          disabled={disabled}
          slotProps={{
            htmlInput: { sx: { fontSize: 12 } },
          }}
        />
      </form>
    </Box>
  );
}
