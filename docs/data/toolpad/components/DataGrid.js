import * as React from 'react';
import { DataGrid } from '@mui/toolpad-components';

const TOOLPAD_PROPS1 = {
  rows: [
    {
      id: '1',
      Name: 'John',
      Location: 'New York',
    },
    {
      id: '2',
      Name: 'Jane',
      Location: 'Paris',
    },
    {
      id: '3',
      Name: 'Susan',
      Location: 'London',
    },
  ],
  columns: [
    { field: 'id', type: 'string' },
    { field: 'Name', type: 'string' },
    { field: 'Location', type: 'string' },
  ],
  height: 300,
  density: 'compact',
};

export default function BasicDataGrid() {
  return <DataGrid {...TOOLPAD_PROPS1} />;
}
