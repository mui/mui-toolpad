import * as React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Stack, Button } from '@mui/material';
import { useDom, useEditorApi } from '../EditorProvider';
import * as studioDom from '../../../studioDom';
import { WithControlledProp } from '../../../utils/types';

const THEME_COLORS = [
  'red',
  'pink',
  'purple',
  'deepPurple',
  'indigo',
  'blue',
  'lightBlue',
  'cyan',
  'teal',
  'green',
  'lightGreen',
  'lime',
  'yellow',
  'amber',
  'orange',
  'deepOrange',
];

interface PaletteColorPickerProps extends WithControlledProp<string> {
  name: string;
}

function PaletteColorPicker({ name, value, onChange }: PaletteColorPickerProps) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel id="select-color">{name}</InputLabel>
      <Select
        labelId="select-color"
        size="small"
        value={value}
        label={name}
        onChange={(event) => onChange(event.target.value)}
      >
        {THEME_COLORS.map((color) => (
          <MenuItem key={color} value={color}>
            {color}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export interface ComponentEditorProps {
  className?: string;
}

export default function ComponentEditor({ className }: ComponentEditorProps) {
  const dom = useDom();
  const api = useEditorApi();

  const app = studioDom.getApp(dom);
  const theme = studioDom.getTheme(dom, app);

  const handleAddThemeClick = () => {
    const newTheme = studioDom.createNode(dom, 'theme', { name: 'Theme', props: {} });
    api.dom.addNode(newTheme, app.id, 'children');
  };

  return (
    <div className={className}>
      {theme ? (
        <Stack spacing={2}>
          <PaletteColorPicker
            name="primary"
            value={studioDom.getConstPropValue(theme, 'palette.primary.main') || ''}
            onChange={(newValue) =>
              api.dom.setNodeConstPropValue<studioDom.StudioTheme>(
                theme,
                'palette.primary.main',
                newValue,
              )
            }
          />
          <PaletteColorPicker
            name="secondary"
            value={studioDom.getConstPropValue(theme, 'palette.secondary.main') || ''}
            onChange={(newValue) =>
              api.dom.setNodeConstPropValue<studioDom.StudioTheme>(
                theme,
                'palette.secondary.main',
                newValue,
              )
            }
          />
        </Stack>
      ) : (
        <Button onClick={handleAddThemeClick}>Add theme</Button>
      )}
    </div>
  );
}
