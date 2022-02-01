import {
  DataGridProProps,
  DataGridPro,
  GridToolbar,
  LicenseInfo,
  GridColumnResizeParams,
  GridCallbackDetails,
  MuiEvent,
} from '@mui/x-data-grid-pro';
import * as React from 'react';
import { useStudioNode } from '@mui/studio-core';
import { debounce } from '@mui/material';

// TODO: Generate a specific license for Studio (This one comes from CI)
const LICENSE = '<REDACTED>';

LicenseInfo.setLicenseKey(LICENSE);

const DataGridComponent = React.forwardRef(function DataGridComponent(
  props: DataGridProProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const studioNode = useStudioNode<DataGridProProps>();

  const handleResize = React.useMemo(
    () =>
      debounce((params: GridColumnResizeParams, event: MuiEvent, details: GridCallbackDetails) => {
        if (!studioNode) {
          return;
        }

        studioNode.setProp('columns', (columns) => columns);
      }, 500),
    [studioNode],
  );

  return (
    <div ref={ref} style={{ height: 350, width: '100%' }}>
      <DataGridPro components={{ Toolbar: GridToolbar }} onColumnResize={handleResize} {...props} />
    </div>
  );
});

export default DataGridComponent;
