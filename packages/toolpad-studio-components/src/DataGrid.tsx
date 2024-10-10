import {
  DataGridPremiumProps,
  DataGridPremium,
  GridColumnResizeParams,
  GridRowsProp,
  GridColumnOrderChangeParams,
  useGridApiContext,
  gridColumnsTotalWidthSelector,
  gridColumnPositionsSelector,
  GridRowSelectionModel,
  GridColDef,
  useGridApiRef,
  GridRenderCellParams,
  useGridRootProps,
  gridDensityFactorSelector,
  useGridSelector,
  getGridDefaultColumnTypes,
  GridColTypeDef,
  GridPaginationModel,
  GridActionsColDef,
  GridRowId,
  GridFilterModel,
  GridSortModel,
  GridNoRowsOverlay,
  GridRowModes,
  GridApiPro,
  GridRowModesModel,
  GridRowModel,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  gridVisibleColumnFieldsSelector,
  GridEventListener,
  GridRowEditStopReasons,
  GridRowEditStartReasons,
  GridValueGetter,
  GridToolbarProps,
  GridColType,
  GridPinnedColumnFields,
} from '@mui/x-data-grid-premium';
import {
  Unstable_LicenseInfoProvider as LicenseInfoProvider,
  MuiLicenseInfo,
} from '@mui/x-license';
import * as React from 'react';
import {
  useNode,
  useComponents,
  UseDataProviderContext,
  ToolpadDataProviderBase,
  PaginationMode,
  FilterModel,
  SortModel,
  PaginationModel,
  useAppHost,
} from '@toolpad/studio-runtime';
import {
  Box,
  debounce,
  LinearProgress,
  Skeleton,
  Link,
  styled,
  Typography,
  Tooltip,
  Popover,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { getObjectKey } from '@toolpad/utils/objectKey';
import { errorFrom } from '@toolpad/utils/errors';
import { hasImageExtension } from '@toolpad/utils/path';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useNonNullableContext } from '@toolpad/utils/react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import invariant from 'invariant';
import {
  NumberFormat,
  createFormat as createNumberFormat,
} from '@toolpad/studio-runtime/numberFormat';
import { DateFormat, createFormat as createDateFormat } from '@toolpad/studio-runtime/dateFormat';
import useLatest from '@toolpad/utils/hooks/useLatest';
import createBuiltin from './createBuiltin';
import { SX_PROP_HELPER_TEXT } from './constants';
import ErrorOverlay, { ErrorContent } from './components/ErrorOverlay';

const DRAFT_ROW_MARKER = Symbol('draftRow');

const ACTIONS_COLUMN_FIELD = '___actions___';

const LICENSE_INFO: MuiLicenseInfo = {
  key: process.env.TOOLPAD_BUNDLED_MUI_X_LICENSE,
};

const DEFAULT_COLUMN_TYPES = getGridDefaultColumnTypes();

const DataGridRoot = styled('div')({
  width: '100%',
  height: '100%',
  position: 'relative',
});

const SetActionResultContext = React.createContext<((result: ActionResult) => void) | undefined>(
  undefined,
);

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

function isNumeric(input: string) {
  return input ? !Number.isNaN(Number(input)) : false;
}

/**
 * RegExp to test a string for a ISO 8601 Date spec
 * Also accepts a space instead of T to separate date and time as per rfc3339
 * Does not do any sort of date validation, only checks if the string is according to the ISO 8601 spec.
 *  YYYY
 *  YYYY-MM
 *  YYYY-MM-DD
 *  YYYY-MM-DDThh:mmTZD
 *  YYYY-MM-DDThh:mm:ssTZD
 *  YYYY-MM-DDThh:mm:ss.sTZD
 * @see: https://www.w3.org/TR/NOTE-datetime
 */
const ISO_8601 =
  /^\d{4}(-\d{2}(-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(([+-]\d{2}:\d{2})|Z)?)?)?)?$/i;

/**
 * RegExp to test a string for a full ISO 8601 Date
 * Also accepts a space instead of T to separate date and time as per rfc3339
 * Does not do any sort of date validation, only checks if the string is according to the ISO 8601 spec.
 *  YYYY-MM-DDThh:mm:ss
 *  YYYY-MM-DDThh:mm:ssTZD
 *  YYYY-MM-DDThh:mm:ss.sTZD
 * @see: https://www.w3.org/TR/NOTE-datetime
 */
const ISO_8601_FULL = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(([+-]\d{2}:\d{2})|Z)?$/i;

function isValidDateTime(input: string) {
  // The Date constructor is too permissive for validating dates, so we need to use a regex
  // for example `new Date('Foo bar 0')` results in a valid date
  if (ISO_8601_FULL.test(input) && !Number.isNaN(Date.parse(input))) {
    return !Number.isNaN(Date.parse(input));
  }
  return false;
}

function isValidDate(input: string) {
  // The Date constructor is too permissive for validating dates, so we need to use a regex
  // for example `new Date('Foo bar 0')` results in a valid date
  if (ISO_8601.test(input) && !Number.isNaN(Date.parse(input))) {
    return !Number.isNaN(Date.parse(input));
  }
  return false;
}

const SkeletonCell = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

function SkeletonLoadingOverlay() {
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();

  const dimensions = apiRef.current?.getRootDimensions();
  const viewportHeight = dimensions?.viewportInnerSize.height ?? 0;

  const factor = useGridSelector(apiRef, gridDensityFactorSelector);
  const rowHeight = Math.floor(rootProps.rowHeight * factor);

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

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // The `subscribeEvent` method will automatically unsubscribe in the cleanup function of the `useEffect`.
    return apiRef.current.subscribeEvent('scrollPositionChange', (params) => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = params.left;
      }
    });
  }, [apiRef]);

  return rowsCount > 0 ? (
    <LinearProgress />
  ) : (
    <div
      ref={scrollRef}
      style={{
        display: 'grid',
        gridTemplateColumns: `${columns
          .map(({ computedWidth }) => `${computedWidth}px`)
          .join(' ')} 1fr`,
        gridAutoRows: `${rowHeight}px`,
        overflowX: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

// Polyfill for https://developer.mozilla.org/en-US/docs/Web/API/URL/canParse_static
function urlCanParse(url: string, base?: string): boolean {
  try {
    return !!new URL(url, base);
  } catch {
    return false;
  }
}

function inferColumnType(value: unknown): string {
  if (value instanceof Date) {
    return 'dateTime';
  }
  const valueType = typeof value;
  switch (typeof value) {
    case 'number':
    case 'boolean':
      return valueType;
    case 'string': {
      if (urlCanParse(value)) {
        const url = new URL(value);

        if (hasImageExtension(url.pathname)) {
          return 'image';
        }

        return 'link';
      }
      if (isNumeric(value)) {
        return 'number';
      }
      if (isValidDateTime(value)) {
        return 'dateTime';
      }
      if (isValidDate(value)) {
        return 'date';
      }
      return valueType;
    }
    case 'object':
      return 'json';
    default:
      return 'string';
  }
}

const ImageCellImg = styled('img')(({ theme }) => ({
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
}));

const ImageCellPopoverImg = styled('img')(({ theme }) => ({
  maxWidth: '60vw',
  maxHeight: '60vh',
  objectFit: 'contain',
  margin: theme.spacing(1),
}));

function ImageCell({ field, id, value: src }: GridRenderCellParams<any, any, any>) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const popoverId = React.useId();

  const alt = `${field} ${id}`;

  return (
    <React.Fragment>
      <ImageCellImg
        aria-owns={open ? popoverId : undefined}
        aria-haspopup="true"
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
        src={src}
        alt={alt}
      />
      <Popover
        id={popoverId}
        sx={{
          pointerEvents: 'none',
        }}
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <ImageCellPopoverImg src={src} alt={alt} />
      </Popover>
    </React.Fragment>
  );
}

const INVALID_DATE = new Date(NaN);

const dateValueGetter: GridValueGetter = (value: any): Date | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  if (typeof value === 'string') {
    if (isNumeric(value)) {
      return new Date(Number(value));
    }

    if (isValidDate(value)) {
      return new Date(value);
    }
  }

  // It's fine if this turns out to be an invalid date, the user wanted a date column, if the data can't be parsed as a date
  // it should just show as such
  return INVALID_DATE;
};

function ComponentErrorFallback({ error }: FallbackProps) {
  return (
    <Typography variant="overline" sx={{ color: 'error.main', fontSize: '10px' }}>
      Code component error{' '}
      <Tooltip title={error.message}>
        <span>ℹ️</span>
      </Tooltip>
    </Typography>
  );
}

interface CustomColumnProps {
  params: GridRenderCellParams;
}

function CustomColumn({ params }: CustomColumnProps) {
  const { value, colDef, row, field } = params;
  const column = colDef as SerializableGridColumn;
  const components = useComponents();
  const Component = components[`codeComponent.${column.codeComponent}`];

  if (!Component) {
    return (
      <Typography variant="overline" sx={{ color: 'error.main', fontSize: '10px' }}>
        No component selected
      </Typography>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ComponentErrorFallback}>
      <Component value={value} row={row} field={field} />
    </ErrorBoundary>
  );
}

export const CUSTOM_COLUMN_TYPES: Record<string, GridColTypeDef> = {
  json: {
    valueFormatter: (value) => JSON.stringify(value),
  },
  date: {
    valueGetter: dateValueGetter,
  },
  dateTime: {
    valueGetter: dateValueGetter,
  },
  link: {
    renderCell: ({ value }) => (
      <Link href={value} target="_blank" rel="noopener nofollow">
        {value}
      </Link>
    ),
  },
  image: {
    renderCell: ({ value, ...params }) => (value ? <ImageCell value={value} {...params} /> : ''),
  },
  codeComponent: {
    renderCell: (params: GridRenderCellParams) => {
      return <CustomColumn params={params} />;
    },
  },
};

export interface SerializableGridColumn
  extends Pick<
    GridColDef,
    | 'field'
    | 'align'
    | 'width'
    | 'headerName'
    | 'sortable'
    | 'filterable'
    | 'editable'
    | 'groupable'
    | 'aggregable'
  > {
  type?: string;
  numberFormat?: NumberFormat;
  dateFormat?: DateFormat;
  dateTimeFormat?: DateFormat;
  codeComponent?: string;
  visible?: boolean;
  pin?: 'left' | 'right';
}

export type SerializableGridColumns = SerializableGridColumn[];

export function inferColumns(rows: GridRowsProp): SerializableGridColumns {
  if (rows.length < 1) {
    return [];
  }
  // Naive implementation that checks only the first row
  const firstRow = rows[0];
  return Object.entries(firstRow).map(([field, value]) => {
    return {
      field,
      type: inferColumnType(value),
    };
  });
}

function getNarrowedColType(type?: string): GridColType | undefined {
  return (type && type in DEFAULT_COLUMN_TYPES ? type : undefined) as GridColType | undefined;
}

export function parseColumns(columns: SerializableGridColumns): GridColDef[] {
  return columns.map(({ type: colType, ...column }) => {
    const isIdColumn = column.field === 'id';

    let baseColumn: Omit<GridColDef, 'field'> = { editable: true };

    if (isIdColumn) {
      baseColumn = {
        ...baseColumn,
        editable: false,
        renderCell: ({ row, value }) => (row[DRAFT_ROW_MARKER] ? '' : value),
      };
    }

    if (colType) {
      baseColumn = { ...baseColumn, ...CUSTOM_COLUMN_TYPES[colType], ...column };
    }

    if (colType === 'number' && column.numberFormat) {
      const format = createNumberFormat(column.numberFormat);
      baseColumn = {
        ...baseColumn,
        valueFormatter: (value: any) => format.format(value),
      };
    }

    if (colType === 'date') {
      const format = createDateFormat(column.dateFormat);
      baseColumn = {
        ...baseColumn,
        valueFormatter: (value: any) => {
          try {
            return format.format(value);
          } catch {
            return 'Invalid Date';
          }
        },
      };
    }

    if (colType === 'dateTime') {
      const format = createDateFormat(column.dateTimeFormat);
      baseColumn = {
        ...baseColumn,
        valueFormatter: (value: any) => {
          try {
            return format.format(value);
          } catch {
            return 'Invalid Date';
          }
        },
      };
    }

    return { ...baseColumn, ...column, type: getNarrowedColType(colType) };
  });
}

type ActionResult =
  | {
      action: 'create';
      id: GridRowId;
      error?: undefined;
    }
  | {
      action: 'create';
      id?: undefined;
      error: Error;
    }
  | {
      action: 'update';
      id: GridRowId;
      error?: Error;
    }
  | {
      action: 'delete';
      id: GridRowId;
      error?: Error;
    };

const EMPTY_ROWS: GridRowsProp = [];

interface Selection {
  id?: any;
}

interface ToolpadDataGridProps extends Omit<DataGridPremiumProps, 'columns' | 'rows' | 'error'> {
  rowsSource?: 'prop' | 'dataProvider';
  dataProviderId?: string;
  rows?: GridRowsProp;
  columns?: SerializableGridColumns;
  rowIdField?: string;
  error?: Error | string;
  selection?: Selection | null;
  onSelectionChange?: (newSelection?: Selection | null) => void;
  hideToolbar?: boolean;
}

interface DeleteActionProps {
  id: GridRowId;
  dataProvider: ToolpadDataProviderBase<Record<string, unknown>, PaginationMode>;
  refetch: () => unknown;
}

function DeleteAction({ id, dataProvider, refetch }: DeleteActionProps) {
  const [loading, setLoading] = React.useState(false);

  const setActionResult = useNonNullableContext(SetActionResultContext);

  const handleDeleteClick = React.useCallback(async () => {
    invariant(dataProvider.deleteRecord, 'dataProvider must be defined');
    setLoading(true);
    try {
      await dataProvider.deleteRecord(id);
      await refetch();

      setActionResult({ action: 'delete', id });
    } catch (error) {
      setActionResult({ action: 'delete', id, error: errorFrom(error) });
    } finally {
      setLoading(false);
    }
  }, [dataProvider, id, refetch, setActionResult]);

  return (
    <IconButton onClick={handleDeleteClick} size="small" aria-label={`Delete row with id "${id}"`}>
      {loading ? <CircularProgress size={16} /> : <DeleteIcon fontSize="inherit" />}
    </IconButton>
  );
}

interface EditToolbarProps extends GridToolbarProps {
  hasCreateButton?: boolean;
  createDisabled?: boolean;
  onCreateClick?: () => void;
}

function EditToolbar({ hasCreateButton, onCreateClick, createDisabled }: EditToolbarProps) {
  return (
    <GridToolbarContainer>
      {hasCreateButton ? (
        <Button
          color="primary"
          startIcon={<AddIcon />}
          onClick={onCreateClick}
          disabled={createDisabled}
        >
          Add record
        </Button>
      ) : null}
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

interface DataProviderDataGridProps extends Partial<DataGridPremiumProps> {
  rowLoadingError?: unknown;
  getActions?: GridActionsColDef['getActions'];
}

function useDataProviderDataGridProps(
  dataProviderId: string | null | undefined,
  idField: string,
  apiRef: React.MutableRefObject<GridApiPro>,
  setActionResult: (result: ActionResult) => void,
): DataProviderDataGridProps {
  const useDataProvider = useNonNullableContext(UseDataProviderContext);
  const {
    dataProvider,
    error: dataProviderLoadError,
    isLoading: dataProviderLoading,
  } = useDataProvider(dataProviderId || null);

  const [rawPaginationModel, setRawPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 100,
  });

  const mapPageToNextCursor = React.useRef(new Map<number, string>());

  const paginationModel = React.useMemo<PaginationModel>(() => {
    const page = rawPaginationModel.page;
    const pageSize = rawPaginationModel.pageSize;
    if (dataProvider?.paginationMode === 'cursor') {
      // cursor based pagination
      let cursor: string | null = null;
      if (page !== 0) {
        cursor = mapPageToNextCursor.current.get(page - 1) ?? null;
        if (cursor === null) {
          throw new Error(`No cursor found for page ${page - 1}`);
        }
      }
      return {
        cursor,
        pageSize,
      };
      // TODO: when docs are on ts>5, replace with
      //     } satisfies CursorPaginationModel;
    }

    // index based pagination
    return {
      start: page * pageSize,
      pageSize,
    };
    // TODO: when docs are on ts>5, replace with
    //     } satisfies IndexPaginationModel;
  }, [dataProvider?.paginationMode, rawPaginationModel.page, rawPaginationModel.pageSize]);

  const [rawFilterModel, setRawFilterModel] = React.useState<GridFilterModel>();

  const filterModel = React.useMemo<FilterModel>(
    () => ({
      items:
        rawFilterModel?.items.map(({ field, operator, value }) => ({ field, operator, value })) ??
        [],
      logicOperator: rawFilterModel?.logicOperator ?? 'and',
    }),
    [rawFilterModel],
  );

  const [rawSortModel, setRawSortModel] = React.useState<GridSortModel>();

  const sortModel = React.useMemo<SortModel>(
    () => rawSortModel?.map(({ field, sort }) => ({ field, sort: sort ?? 'asc' })) ?? [],
    [rawSortModel],
  );

  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});

  const isEditing = React.useMemo(
    () => Object.values(rowModesModel).some((mode) => mode.mode === GridRowModes.Edit),
    [rowModesModel],
  );

  const [draftRow, setDraftRow] = React.useState<GridRowModel | null>(null);

  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    // Blurring the cell shouldn't end edit mode
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
    if (draftRow && params.reason === GridRowEditStopReasons.escapeKeyDown) {
      setRowModesModel({
        ...rowModesModel,
        [draftRow.id]: { mode: GridRowModes.View, ignoreModifications: true },
      });
      setDraftRow(null);
    }
  };

  const handleRowEditStart: GridEventListener<'rowEditStart'> = (params, event) => {
    if (isEditing && params.reason === GridRowEditStartReasons.cellDoubleClick) {
      event.defaultMuiPrevented = true;
    }
  };

  const {
    data,
    isFetching,
    isPlaceholderData,
    isLoading,
    error: rowLoadingError,
    refetch,
  } = useQuery({
    enabled: !!dataProvider,
    queryKey: ['toolpadDataProvider', dataProviderId, paginationModel, filterModel, sortModel],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      invariant(dataProvider, 'dataProvider must be defined');

      const result = await dataProvider.getRecords({
        paginationModel,
        filterModel,
        sortModel,
      });

      if (dataProvider.paginationMode === 'cursor') {
        if (typeof result.cursor === 'undefined') {
          throw new Error(
            `No cursor returned for page ${rawPaginationModel.page}. Return \`null\` to signal the end of the data.`,
          );
        }

        if (typeof result.cursor === 'string') {
          mapPageToNextCursor.current.set(rawPaginationModel.page, result.cursor);
        }
      }

      return result;
    },
  });

  const rowCount =
    data?.totalCount ??
    (data?.hasNextPage
      ? (rawPaginationModel.page + 1) * rawPaginationModel.pageSize + 1
      : undefined) ??
    0;

  const [rowUpdating, setRowUpdating] = React.useState<Partial<Record<string, boolean>>>({});

  const handleProcessRowUpdate = React.useCallback(
    async (newRow: GridRowModel, oldRow: GridRowModel) => {
      const id = oldRow[idField];
      const values = Object.fromEntries(
        Object.entries(newRow).filter(([key, value]) => value !== oldRow[key]),
      );

      const action = oldRow[DRAFT_ROW_MARKER] ? 'create' : 'update';

      setRowUpdating((oldState) => ({ ...oldState, [id]: true }));

      try {
        if (action === 'create') {
          try {
            invariant(
              dataProvider?.createRecord,
              'Edit action should be unavailable when dataProvider.createRecord is not defined',
            );
            const newRecord = await dataProvider.createRecord(values);
            if (!newRecord) {
              throw new Error('No record returned by createRecord');
            }

            invariant(newRecord[idField], 'Record returned by createRecord must have an id');
            setActionResult({ action, id: newRecord[idField] as GridRowId });
            return newRecord;
          } catch (error) {
            setActionResult({ action, error: errorFrom(error) });
            return oldRow;
          }
        } else {
          try {
            invariant(
              dataProvider?.updateRecord,
              'Edit action should be unavailable when dataProvider.updateRecord is not defined',
            );
            let newRecord = await dataProvider.updateRecord(id, values);
            if (!newRecord?.[idField]) {
              console.warn('Record returned by updateRecord must have an id');
            }
            newRecord ??= newRow;
            setActionResult({ action, id: newRecord[idField] as GridRowId });
            return newRecord;
          } catch (error) {
            setActionResult({ action, id, error: errorFrom(error) });
            return oldRow;
          }
        }
      } finally {
        setRowUpdating((oldState) => {
          const { [id]: discard, ...newState } = oldState;
          return newState;
        });
        setDraftRow(null);
        await refetch();
      }
    },
    [dataProvider, idField, refetch, setActionResult],
  );

  const getActions = React.useMemo<GridActionsColDef['getActions'] | undefined>(() => {
    if (!dataProvider?.deleteRecord && !dataProvider?.updateRecord && !dataProvider?.createRecord) {
      return undefined;
    }

    return ({ id, row }) => {
      const result = [];

      if (dataProvider.updateRecord || dataProvider.createRecord) {
        const rowIsInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        const rowIsUpdating = rowUpdating[id];

        const isDraft = row[DRAFT_ROW_MARKER];

        if (rowIsInEditMode || rowIsUpdating) {
          return [
            <IconButton
              key="commit"
              size="small"
              aria-label={`Save updates to ${isDraft ? 'new row' : `row with id "${id}"`}`}
              disabled={rowIsUpdating}
              onClick={async () => {
                setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
              }}
            >
              {rowIsUpdating ? <CircularProgress size={16} /> : <SaveIcon fontSize="inherit" />}
            </IconButton>,
            <IconButton
              key="cancel"
              size="small"
              aria-label="Cancel updates"
              disabled={rowIsUpdating}
              onClick={() => {
                setRowModesModel({
                  ...rowModesModel,
                  [id]: { mode: GridRowModes.View, ignoreModifications: true },
                });
                setDraftRow(null);
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>,
          ];
        }

        if (!isEditing && dataProvider.updateRecord) {
          result.push(
            <IconButton
              key="update"
              onClick={() => {
                setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
              }}
              size="small"
              aria-label={`Edit row with id "${id}"`}
            >
              <EditIcon fontSize="inherit" />
            </IconButton>,
          );
        }
      }

      if (!isEditing) {
        if (dataProvider.deleteRecord) {
          result.push(
            <DeleteAction key="delete" id={id} dataProvider={dataProvider} refetch={refetch} />,
          );
        }
      }

      return result;
    };
  }, [dataProvider, isEditing, refetch, rowModesModel, rowUpdating]);

  const rows = React.useMemo<GridRowsProp>(() => {
    let rowData = data?.records ?? [];
    if (draftRow) {
      rowData = [draftRow, ...rowData];
    }
    return rowData;
  }, [data?.records, draftRow]);

  if (!dataProviderId) {
    return {};
  }

  if (dataProviderLoadError) {
    return {
      rowLoadingError: dataProviderLoadError,
    };
  }

  if (dataProviderLoading) {
    return {
      loading: true,
    };
  }

  invariant(dataProvider, "dataProvider must be defined if it's loaded without error");

  return {
    loading: isLoading || (isPlaceholderData && isFetching),
    paginationMode: 'server',
    filterMode: 'server',
    sortingMode: 'server',
    pagination: true,
    rowCount,
    paginationModel: rawPaginationModel,
    onPaginationModelChange(model) {
      setRawPaginationModel((prevModel) => {
        if (prevModel.pageSize !== model.pageSize) {
          return { ...model, page: 0 };
        }
        return model;
      });
    },
    filterModel: rawFilterModel,
    onFilterModelChange: setRawFilterModel,
    sortModel: rawSortModel,
    onSortModelChange: setRawSortModel,
    rows,
    rowLoadingError,
    getActions,
    editMode: 'row',
    rowModesModel,
    onRowModesModelChange: (model) => setRowModesModel(model),
    processRowUpdate: handleProcessRowUpdate,
    onRowEditStart: handleRowEditStart,
    onRowEditStop: handleRowEditStop,
    slots: {
      toolbar: EditToolbar,
    },
    slotProps: {
      toolbar: {
        hasCreateButton: !!dataProvider.createRecord,
        createDisabled: !!isEditing,
        onCreateClick: () => {
          const draftRowId = crypto.randomUUID();
          const visibleFields = gridVisibleColumnFieldsSelector(apiRef);
          const firstVisibleFieldIndex = visibleFields.findIndex((field) => field !== idField);
          const fieldToFocus =
            firstVisibleFieldIndex >= 0 ? visibleFields[firstVisibleFieldIndex] : undefined;
          const colIndex = firstVisibleFieldIndex >= 0 ? firstVisibleFieldIndex : 0;
          setDraftRow({ id: draftRowId, [DRAFT_ROW_MARKER]: true });
          setRowModesModel((oldModel) => ({
            ...oldModel,
            [draftRowId]: { mode: GridRowModes.Edit, fieldToFocus },
          }));
          apiRef.current.scrollToIndexes({ rowIndex: 0, colIndex });
        },
      },
    },
  };
}

type NoRowsOverlayProps = React.ComponentProps<typeof GridNoRowsOverlay>;

interface NoRowsOverlayPropsX extends NoRowsOverlayProps {
  error?: Error | null;
}

function NoRowsOverlay(props: NoRowsOverlayPropsX) {
  if (props.error) {
    return <ErrorContent sx={{ height: '100%' }} error={props.error} />;
  }

  return <GridNoRowsOverlay {...props} />;
}

interface ActionResultOverlayProps {
  result: ActionResult | null;
  onClose: () => void;
  apiRef: React.MutableRefObject<GridApiPro>;
}

function ActionResultOverlay({ result, onClose, apiRef }: ActionResultOverlayProps) {
  const open = !!result;
  const actionError = result?.error;

  React.useEffect(() => {
    if (actionError) {
      // Log error to console as well for full stacktrace
      console.error(actionError);
    }
  }, [actionError]);

  const lastResult = useLatest(result);

  let message: React.ReactNode = null;
  if (lastResult) {
    if (lastResult.action === 'create') {
      if (lastResult.error) {
        message = `Failed to create a record, ${lastResult.error.message}`;
      } else {
        const index = apiRef.current.getAllRowIds().indexOf(lastResult.id);
        const visibleFields = gridVisibleColumnFieldsSelector(apiRef);
        const fieldToFocus: string | undefined = visibleFields[0];
        if (index >= 0 && fieldToFocus) {
          message = (
            <React.Fragment>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <Link
                href="#"
                color="inherit"
                onClick={(event) => {
                  event.preventDefault();
                  apiRef.current.scrollToIndexes({ rowIndex: index, colIndex: 0 });
                  apiRef.current.setCellFocus(lastResult.id, fieldToFocus);
                }}
                aria-label="Go to new record"
              >
                New record
              </Link>{' '}
              created successfully
            </React.Fragment>
          );
        } else {
          message = 'New record created successfully';
        }
      }
    } else if (lastResult.action === 'update') {
      message = lastResult.error
        ? `Failed to update a record, ${lastResult.error.message}`
        : 'Record updated successfully';
    } else if (lastResult.action === 'delete') {
      message = lastResult.error
        ? `Failed to delete a record, ${lastResult.error.message}`
        : 'Record deleted successfully';
    }
  }

  return (
    <Box sx={{ mt: 1, position: 'absolute', bottom: 0, left: 0, right: 0, m: 2 }}>
      <Snackbar
        sx={{ position: 'absolute' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={open}
        autoHideDuration={2000}
        onClose={onClose}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={onClose}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      >
        <Alert severity={lastResult?.error ? 'error' : 'success'} onClose={onClose}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function dataGridFallbackRender({ error }: FallbackProps) {
  return <ErrorOverlay error={error} />;
}

const DataGridComponent = React.forwardRef(function DataGridComponent(
  {
    columns: columnsProp,
    rows: rowsProp,
    rowIdField: rowIdFieldProp,
    error: errorProp,
    selection,
    onSelectionChange,
    hideToolbar,
    rowsSource,
    dataProviderId,
    sx,
    ...props
  }: ToolpadDataGridProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const apiRef = useGridApiRef();
  const [actionResult, setActionResult] = React.useState<ActionResult | null>(null);

  const rowIdField = rowIdFieldProp ?? 'id';

  const {
    rows: dataProviderRowsInput,
    getActions: getProviderActions,
    slots: dataProviderSlots,
    slotProps: dataProviderSlotProps,
    ...dataProviderProps
  } = useDataProviderDataGridProps(
    rowsSource === 'dataProvider' ? dataProviderId : null,
    rowIdField,
    apiRef,
    setActionResult,
  );

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
          const old = columns.find((colDef) => colDef.field === params.column.field);
          if (!old) {
            return columns;
          }
          const withoutOld = columns.filter((column) => column.field !== params.column.field);
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

  let rowsInput: GridRowsProp;
  if (rowsSource === 'dataProvider') {
    rowsInput = dataProviderRowsInput ?? EMPTY_ROWS;
  } else {
    rowsInput = rowsProp ?? EMPTY_ROWS;
  }

  const hasExplicitRowId: boolean = React.useMemo(() => {
    const hasRowIdField: boolean = !!(rowIdFieldProp && rowIdFieldProp !== 'id');
    return hasRowIdField || rowsInput.length === 0 || rowsInput[0].id !== undefined;
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
    (ids: GridRowSelectionModel) => {
      onSelectionChange?.(ids.length > 0 ? rows.find((row) => row.id === ids[0]) : null);
    },
    [rows, onSelectionChange],
  );

  const selectionModel = React.useMemo(
    () => (selection?.id ? [selection.id] : []),
    [selection?.id],
  );

  const columns: GridColDef[] = React.useMemo(
    () => (columnsProp ? parseColumns(columnsProp) : []),
    [columnsProp],
  );

  React.useEffect(() => {
    apiRef.current.updateColumns(columns);
  }, [apiRef, columns]);

  // The grid doesn't update when the getRowId property changes, so it needs to be remounted
  const gridKey = React.useMemo(
    () => [getObjectKey(getRowId), getObjectKey(columns)].join('::'),
    [getRowId, columns],
  );

  let rowLoadingError: Error | null = null;
  if (dataProviderProps?.rowLoadingError) {
    rowLoadingError = errorFrom(dataProviderProps.rowLoadingError);
  } else if (errorProp) {
    rowLoadingError = errorFrom(errorProp);
  }

  React.useEffect(() => {
    nodeRuntime?.updateEditorNodeData('rawRows', rows);
  }, [nodeRuntime, rows]);

  const renderedColumns = React.useMemo<GridColDef[]>(() => {
    const result = [...columns];

    if (getProviderActions) {
      result.push({
        field: ACTIONS_COLUMN_FIELD,
        type: 'actions',
        align: 'right',
        resizable: false,
        pinnable: false,
        getActions: getProviderActions,
      });
    }

    return result;
  }, [columns, getProviderActions]);

  const appHost = useAppHost();
  const isProPlan = appHost.plan === 'pro';

  const columnVisibilityModel = Object.fromEntries(
    (columnsProp ?? []).map((column) => [column.field, column.visible ?? true]),
  );

  const pinnedColumns: GridPinnedColumnFields = React.useMemo(() => {
    const result = (columnsProp ?? []).reduce<GridPinnedColumnFields>((acc, column) => {
      if (column.pin) {
        acc[column.pin] ??= [];
        acc[column.pin]?.push(column.field);
      }
      return acc;
    }, {});
    result.right ??= [];
    result.right.push(ACTIONS_COLUMN_FIELD);
    return result;
  }, [columnsProp]);

  return (
    <LicenseInfoProvider info={LICENSE_INFO}>
      <DataGridRoot ref={ref} sx={sx}>
        <ErrorBoundary fallbackRender={dataGridFallbackRender} resetKeys={[rows]}>
          <SetActionResultContext.Provider value={setActionResult}>
            <DataGridPremium
              apiRef={apiRef}
              slots={{
                ...dataProviderSlots,
                loadingOverlay: SkeletonLoadingOverlay,
                noRowsOverlay: NoRowsOverlay,
                toolbar: hideToolbar ? null : dataProviderSlots?.toolbar,
              }}
              slotProps={{
                noRowsOverlay: {
                  error: rowLoadingError,
                } as any,
                ...dataProviderSlotProps,
              }}
              onColumnResize={handleResize}
              onColumnOrderChange={handleColumnOrderChange}
              rows={rows}
              columns={renderedColumns}
              key={gridKey}
              getRowId={getRowId}
              onRowSelectionModelChange={onSelectionModelChange}
              rowSelectionModel={selectionModel}
              initialState={{
                columns: { columnVisibilityModel },
                pinnedColumns,
              }}
              disableAggregation={!isProPlan}
              disableRowGrouping={!isProPlan}
              disableColumnPinning={!isProPlan}
              {...props}
              {...dataProviderProps}
              sx={{
                height: '100%',
              }}
            />
          </SetActionResultContext.Provider>
        </ErrorBoundary>

        <ActionResultOverlay
          result={actionResult}
          onClose={() => setActionResult(null)}
          apiRef={apiRef}
        />
      </DataGridRoot>
    </LicenseInfoProvider>
  );
});

export default createBuiltin(DataGridComponent, {
  helperText:
    'The [MUI X Data Grid](https://mui.com/x/react-data-grid/) component.\n\nThe datagrid lets users display tabular data in a flexible grid.',
  errorProp: 'error',
  loadingPropSource: ['rows', 'columns'],
  loadingProp: 'loading',
  defaultLayoutHeight: 360,
  minimumLayoutHeight: 100,
  argTypes: {
    rowsSource: {
      helperText: 'Defines how rows are provided to the grid.',
      type: 'string',
      enum: ['prop', 'dataProvider'],
      enumLabels: {
        prop: 'Direct',
        dataProvider: 'Data provider',
      },
      default: 'prop',
      label: 'Rows source',
      control: { type: 'ToggleButtons', bindable: false },
    },
    rows: {
      helperText: 'The data to be displayed as rows. Must be an array of objects.',
      type: 'array',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true,
          properties: {
            id: {
              type: 'string',
            },
          },
          required: ['id'],
        },
      },
      visible: ({ rowsSource }: ToolpadDataGridProps) => rowsSource === 'prop',
    },
    dataProviderId: {
      helperText: 'The backend data provider that will supply the rows to this grid',
      type: 'string',
      control: { type: 'DataProviderSelector', bindable: false },
      visible: ({ rowsSource }: ToolpadDataGridProps) => rowsSource === 'dataProvider',
    },
    columns: {
      helperText: 'The columns to be displayed.',
      type: 'array',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true,
          properties: {
            field: {
              type: 'string',
            },
            align: {
              type: 'string',
              enum: ['center', 'right', 'left'],
            },
          },
          required: ['field'],
        },
      },
      control: { type: 'GridColumns', bindable: false },
    },
    rowIdField: {
      helperText:
        'Defines which column contains the [id](https://mui.com/x/react-data-grid/row-definition/#row-identifier) that uniquely identifies each row.',
      type: 'string',
      control: { type: 'RowIdFieldSelect' },
      label: 'Id field',
    },
    selection: {
      helperText: 'The currently selected row. Or `null` in case no row has been selected.',
      type: 'object',
      default: null,
      onChangeProp: 'onSelectionChange',
      tsType: `ThisComponent['rows'][number] | undefined`,
    },
    density: {
      helperText:
        'The [density](https://mui.com/x/react-data-grid/accessibility/#density-prop) of the rows. Possible values are `compact`, `standard`, or `comfortable`.',
      type: 'string',
      enum: ['compact', 'standard', 'comfortable'],
      default: 'compact',
    },
    loading: {
      helperText:
        "Displays a loading animation indicating the data grid isn't ready to present data yet.",
      type: 'boolean',
    },
    hideToolbar: {
      helperText: 'Hide the toolbar area that contains the data grid user controls.',
      type: 'boolean',
    },
    sx: {
      helperText: SX_PROP_HELPER_TEXT,
      type: 'object',
    },
  },
});
