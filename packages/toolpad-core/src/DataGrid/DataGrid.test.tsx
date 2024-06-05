/**
 * @vitest-environment jsdom
 */

import * as React from 'react';
import { describe, test, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { DataGrid as XDataGrid } from '@mui/x-data-grid';
import describeConformance from '@toolpad/utils/describeConformance';
import { DataGrid } from './DataGrid';

describe('DataGrid', () => {
  afterEach(cleanup);

  describeConformance(<DataGrid />, () => ({
    inheritComponent: XDataGrid,
    refInstanceof: window.HTMLDivElement,
    skip: ['themeDefaultProps'],
  }));

  test('renders content correctly', async () => {
    // placeholder test
    const { getByText } = render(<DataGrid />);

    expect(getByText('Columns')).toBeTruthy();
  });
});
