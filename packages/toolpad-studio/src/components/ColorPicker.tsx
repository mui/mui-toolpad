import { Box, IconButton, InputAdornment, Popover, TextField } from '@mui/material';
import * as React from 'react';
import ColorTool from './ColorTool';

interface ColorPickerIconButtonProps {
  value?: string;
  onChange?: (value?: string) => void;
  label?: string;
}

export function ColorPickerIconButton({ label, value, onChange }: ColorPickerIconButtonProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = React.useId();

  return (
    <React.Fragment>
      <IconButton aria-label="select color" edge="end" onClick={handleClick}>
        <Box
          sx={{
            background: value,
            width: 24,
            height: 24,
            borderRadius: '50%',
            boxShadow: 1,
          }}
        />
      </IconButton>

      <Popover
        id={open ? id : undefined}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <ColorTool sx={{ m: 2 }} label={label} value={value} onChange={onChange} />
      </Popover>
    </React.Fragment>
  );
}

export interface ColorPickerProps {
  value?: string;
  onChange?: (value?: string) => void;
  label?: string;
}

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <ColorPickerIconButton value={value} onChange={onChange} label={label} />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
