import * as React from 'react';
import { Skeleton, TextField, Theme, TypographyVariant, Tooltip, SxProps } from '@mui/material';

interface EditableTextProps {
  defaultValue?: string;
  loading: boolean;
  editing: boolean;
  isError: boolean;
  errorText?: string;
  onKeyUp: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  variant?: TypographyVariant;
  size?: 'small' | 'medium';
  sx?: SxProps;
}

const EditableText = React.forwardRef<HTMLInputElement, EditableTextProps>(
  (
    {
      defaultValue,
      onKeyUp,
      onBlur,
      variant: typographyVariant = 'body1',
      size,
      sx,
      editing,
      loading,
      isError,
      errorText,
    },
    ref,
  ) => {
    const appTitleInput = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
      let inputElement: HTMLInputElement | null = appTitleInput.current;
      if (ref) {
        inputElement = (ref as React.MutableRefObject<HTMLInputElement>).current;
      }

      if (inputElement) {
        if (editing) {
          inputElement.focus();
          inputElement.select();
        } else {
          inputElement.blur();
        }
      }
    }, [ref, editing]);

    return (
      <Tooltip title={editing ? '' : defaultValue || ''} enterDelay={500} placement={'left'}>
        {loading ? (
          <Skeleton />
        ) : (
          <TextField
            variant={'standard'}
            size={size ?? 'small'}
            inputRef={ref ?? appTitleInput}
            sx={{
              ...sx,
              '& .MuiInputBase-root.MuiInput-root:before, .MuiInput-root.MuiInputBase-root:not(.Mui-disabled):hover::before':
                {
                  borderBottom: editing ? `initial` : 'none',
                },
            }}
            inputProps={{
              tabIndex: editing ? 0 : -1,
              sx: (theme: Theme) => ({
                // Handle overflow
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                fontSize: theme.typography[typographyVariant].fontSize,
                height: theme.typography[typographyVariant].fontSize,
              }),
            }}
            onKeyUp={onKeyUp ?? (() => {})}
            onBlur={onBlur ?? (() => {})}
            defaultValue={defaultValue}
            error={isError}
            helperText={isError ? errorText : ''}
          />
        )}
      </Tooltip>
    );
  },
);

export default EditableText;
