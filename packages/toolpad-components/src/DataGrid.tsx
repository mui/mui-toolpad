import {
  DataGridProProps,
  DataGridPro,
  GridToolbar,
  GridColumnResizeParams,
  GridColumns,
  GridRowsProp,
  GridColumnOrderChangeParams,
  useGridApiContext,
  gridColumnsTotalWidthSelector,
  gridColumnPositionsSelector,
  gridDensityRowHeightSelector,
  GridSelectionModel,
} from '@mui/x-data-grid-pro';
import * as React from 'react';
import { useNode, createComponent } from '@mui/toolpad-core';
import { Box, debounce, LinearProgress, Skeleton, styled } from '@mui/material';

// Pseudo random number. See https://stackoverflow.com/a/47593316
function mulberry32(a: number): () => number {
  return () => {
    /* eslint-disable */
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    /* eslint-enable */
  };
}

function randomBetween(seed: number, min: number, max: number): () => number {
  const random = mulberry32(seed);
  return () => min + (max - min) * random();
}

const SkeletonCell = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

function SkeletonLoadingOverlay() {
  const apiRef = useGridApiContext();

  const dimensions = apiRef.current?.getRootDimensions();
  const viewportHeight = dimensions?.viewportInnerSize.height ?? 0;

  const rowHeight = gridDensityRowHeightSelector(apiRef);
  const skeletonRowsCount = Math.ceil(viewportHeight / rowHeight);

  const totalWidth = gridColumnsTotalWidthSelector(apiRef);
  const positions = gridColumnPositionsSelector(apiRef);
  const inViewportCount = React.useMemo(
    () => positions.filter((value) => value <= totalWidth).length,
    [totalWidth, positions],
  );
  const columns = apiRef.current.getVisibleColumns().slice(0, inViewportCount);

  const children = React.useMemo(() => {
    // reseed random number generator to create stable lines betwen renders
    const random = randomBetween(12345, 25, 75);
    const array: React.ReactNode[] = [];

    for (let i = 0; i < skeletonRowsCount; i += 1) {
      for (const column of columns) {
        const width = Math.round(random());
        array.push(
          <SkeletonCell key={`col-${column.field}-${i}`} sx={{ justifyContent: column.align }}>
            <Skeleton sx={{ mx: 1 }} width={`${width}%`} />
          </SkeletonCell>,
        );
      }
      array.push(<SkeletonCell key={`fill-${i}`} />);
    }
    return array;
  }, [skeletonRowsCount, columns]);

  const rowsCount = apiRef.current.getRowsCount();

  return rowsCount > 0 ? (
    <LinearProgress />
  ) : (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${columns
          .map(({ computedWidth }) => `${computedWidth}px`)
          .join(' ')} 1fr`,
        gridAutoRows: `${rowHeight}px`,
      }}
    >
      {children}
    </div>
  );
}

function inferColumnType(value: unknown): string | undefined {
  if (value instanceof Date) {
    return 'dateTime';
  }
  const valueType = typeof value;
  switch (typeof value) {
    case 'number':
    case 'boolean':
    case 'string':
      return valueType;
    default:
      return undefined;
  }
}

export function inferColumns(rows: GridRowsProp): GridColumns {
  if (rows.length < 1) {
    return [];
  }
  // Naive implementation that checks only the first row
  const firstRow = rows[0];
  return Object.entries(firstRow).map(([field, value]) => ({
    field,
    type: inferColumnType(value),
  }));
}

const EMPTY_COLUMNS: GridColumns = [];
const EMPTY_ROWS: GridRowsProp = [];

interface Selection {
  id?: any;
}

interface ToolpadDataGridProps extends Omit<DataGridProProps, 'columns' | 'rows' | 'error'> {
  rows?: GridRowsProp;
  columns?: GridColumns;
  rowIdField?: string;
  error?: Error | string;
  selection?: Selection | null;
  onSelectionChange?: (newSelection?: Selection | null) => void;
}

const DataGridComponent = React.forwardRef(function DataGridComponent(
  {
    columns: columnsProp,
    rows: rowsProp,
    rowIdField: rowIdFieldProp,
    error: errorProp,
    selection,
    onSelectionChange,
    ...props
  }: ToolpadDataGridProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const nodeRuntime = useNode<ToolpadDataGridProps>();

  const handleResize = React.useMemo(
    () =>
      debounce((params: GridColumnResizeParams) => {
        if (!nodeRuntime) {
          return;
        }

        nodeRuntime.updateAppDomConstProp('columns', (columns) =>
          columns?.map((column) =>
            column.field === params.colDef.field ? { ...column, width: params.width } : column,
          ),
        );
      }, 500),
    [nodeRuntime],
  );
  React.useEffect(() => handleResize.clear(), [handleResize]);

  const handleColumnOrderChange = React.useMemo(
    () =>
      debounce((params: GridColumnOrderChangeParams) => {
        if (!nodeRuntime) {
          return;
        }

        nodeRuntime.updateAppDomConstProp('columns', (columns) => {
          if (!columns) {
            return columns;
          }
          const old = columns.find((colDef) => colDef.field === params.field);
          if (!old) {
            return columns;
          }
          const withoutOld = columns.filter((column) => column.field !== params.field);
          return [
            ...withoutOld.slice(0, params.targetIndex),
            old,
            ...withoutOld.slice(params.targetIndex),
          ];
        });
      }, 500),
    [nodeRuntime],
  );
  React.useEffect(() => handleColumnOrderChange.clear(), [handleColumnOrderChange]);

  const rowsInput = rowsProp || EMPTY_ROWS;

  const hasExplicitRowId: boolean = React.useMemo(() => {
    const hasRowIdField: boolean = !!(rowIdFieldProp && rowIdFieldProp !== 'id');
    const parsedRows = rowsInput;
    return parsedRows.length === 0 || hasRowIdField || !!parsedRows[0].id;
  }, [rowIdFieldProp, rowsInput]);

  const rows: GridRowsProp = React.useMemo(
    () => (hasExplicitRowId ? rowsInput : rowsInput.map((row, id) => ({ ...row, id }))),
    [hasExplicitRowId, rowsInput],
  );

  const columnsInitRef = React.useRef(false);
  const hasColumnsDefined = columnsProp && columnsProp.length > 0;

  React.useEffect(() => {
    if (!nodeRuntime || hasColumnsDefined || rows.length <= 0 || columnsInitRef.current) {
      return;
    }

    let inferredColumns = inferColumns(rows);

    if (!hasExplicitRowId) {
      inferredColumns = inferredColumns.filter((column) => column.field !== 'id');
    }

    nodeRuntime.updateAppDomConstProp('columns', inferredColumns);

    columnsInitRef.current = true;
  }, [hasColumnsDefined, rows, nodeRuntime, hasExplicitRowId]);

  const getRowId = React.useCallback(
    (row: any) => {
      return rowIdFieldProp && row[rowIdFieldProp] ? row[rowIdFieldProp] : row.id;
    },
    [rowIdFieldProp],
  );

  const onSelectionModelChange = React.useCallback(
    (ids: GridSelectionModel) => {
      onSelectionChange?.(ids.length > 0 ? rows.find((row) => row.id === ids[0]) : null);
    },
    [rows, onSelectionChange],
  );

  const selectionModel = React.useMemo(
    () => (selection?.id ? [selection.id] : []),
    [selection?.id],
  );

  const columns: GridColumns = columnsProp || EMPTY_COLUMNS;

  return (
    <div ref={ref} style={{ height: 350, width: '100%' }}>
      <DataGridPro
        components={{ Toolbar: GridToolbar, LoadingOverlay: SkeletonLoadingOverlay }}
        onColumnResize={handleResize}
        onColumnOrderChange={handleColumnOrderChange}
        rows={rows}
        columns={columns}
        key={rowIdFieldProp}
        getRowId={getRowId}
        onSelectionModelChange={onSelectionModelChange}
        selectionModel={selectionModel}
        error={errorProp}
        componentsProps={{
          errorOverlay: { message: typeof errorProp === 'string' ? errorProp : errorProp?.message },
        }}
        {...props}
      />
    </div>
  );
});

export default createComponent(DataGridComponent, {
  errorProp: 'error',
  loadingPropSource: ['rows', 'columns'],
  loadingProp: 'loading',
  argTypes: {
    rows: {
      typeDef: { type: 'array', schema: '/schemas/DataGridRows.json' },
    },
    columns: {
      typeDef: { type: 'array', schema: '/schemas/DataGridColumns.json' },
      control: { type: 'GridColumns' },
    },
    density: {
      typeDef: { type: 'string', enum: ['compact', 'standard', 'comfortable'] },
      defaultValue: 'compact',
    },
    sx: {
      typeDef: { type: 'object' },
    },
    selection: {
      typeDef: { type: 'object' },
      onChangeProp: 'onSelectionChange',
      defaultValue: null,
    },
    loading: {
      typeDef: { type: 'boolean' },
    },
    rowIdField: {
      typeDef: { type: 'string' },
      control: { type: 'RowIdFieldSelect' },
      label: 'Id field',
    },
  },
});
