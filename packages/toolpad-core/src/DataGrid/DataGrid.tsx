'use client';

import {
  DataGrid as XDataGrid,
  DataGridProps as XDataGridProps,
  GridColDef,
  GridSlotsComponent,
  GridRowId,
  GridRowModes,
  GridRowModesModel,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridValueGetter,
  useGridApiRef,
  GridActionsCellItemProps,
  GridActionsCellItem,
  GridEventListener,
  GridPaginationModel,
  gridClasses,
  GridRowIdGetter,
  GridFilterModel,
  GridApi,
} from '@mui/x-data-grid';
import PropTypes from 'prop-types';
import * as React from 'react';
import { Button, CircularProgress, styled, useControlled } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import invariant from 'invariant';
import { useNonNullableContext } from '@toolpad/utils/react';
import { errorFrom } from '@toolpad/utils/errors';
import RowsLoadingOverlay from './LoadingOverlay';
import { ErrorOverlay, LoadingOverlay } from '../shared/components';
import {
  ResolvedDataProvider,
  ResolvedField,
  Datum,
  useGetMany,
  GetManyParams,
  FieldOf,
  ResolvedFields,
  ValidId,
  DEFAULT_ID_FIELD,
} from '../DataProvider';
import InferencingAlert from './InferencingAlert';
import {
  NotificationSnackbar,
  DataGridNotification,
  SetDataGridNotificationContext,
} from './NotificationSnackbar';
import { type Filter } from '../DataProvider/filter';

const RootContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
});

const GridContainer = styled('div')({
  flex: 1,
  position: 'relative',
  minHeight: 0,
});

const subscribe = () => () => {};
const getSnapshot = () => false;
const getServerSnapshot = () => true;

function useSsr() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

interface ToolbarCreateButtonContextValue {
  slotsProp?: Partial<GridSlotsComponent>;
  onClick: () => void;
  visible: boolean;
  disabled: boolean;
}

const ToolbarCreateButtonContext = React.createContext<ToolbarCreateButtonContextValue | null>(
  null,
);

const RefetchContext = React.createContext<(() => void) | null>(null);

const ACTIONS_COLUMN_FIELD = '::toolpad-internal-field::actions::';

const DRAFT_ROW_ID = '::toolpad-internal-row::draft::';

const DRAFT_ROW_MARKER = Symbol('draft-row');

function createDraftRow(): {} {
  const row = { [DRAFT_ROW_MARKER]: true };
  return row;
}

type MaybeDraftRow<R> = R & { [DRAFT_ROW_MARKER]?: true };

function isDraftRow<R>(row: MaybeDraftRow<R>): boolean {
  return !!row[DRAFT_ROW_MARKER];
}

function cleanDraftRow<R>(row: MaybeDraftRow<R>): R {
  const cleanedRow = { ...row };
  delete cleanedRow[DRAFT_ROW_MARKER];
  return cleanedRow;
}

const PlaceholderBorder = styled('div')(({ theme }) => ({
  position: 'absolute',
  inset: '0 0 0 0',
  borderColor: theme.palette.divider,
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: theme.shape.borderRadius,
}));

type ProcessRowUpdate = XDataGridProps['processRowUpdate'];

export interface DataGridProps<R extends Datum> extends Partial<XDataGridProps<R>> {
  /**
   * The height of the datagrid in pixels. If left `undefined`, it adopts the height of its parent.
   */
  height?: number;
  /**
   * The data provider to resolve the displayed data. This object must be referentially stable.
   */
  dataProvider?: ResolvedDataProvider<R>;
}

const dateValueGetter = (value: any) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  return new Date(value);
};

function wrapWithDateValueGetter<R extends Datum>(
  valueGetter?: GridValueGetter<R>,
): GridValueGetter<R> {
  if (!valueGetter) {
    return dateValueGetter;
  }

  return (oldValue, ...args) => {
    const newValue = valueGetter(oldValue, ...args);
    return dateValueGetter(newValue);
  };
}

interface DeleteActionProps<R extends Datum> {
  id: GridRowId;
  dataProvider: ResolvedDataProvider<R>;
}

function DeleteAction<R extends Datum>({ id, dataProvider }: DeleteActionProps<R>) {
  const refetch = useNonNullableContext(RefetchContext);
  const [pending, setPending] = React.useState(false);

  const setNotification = useNonNullableContext(SetDataGridNotificationContext);

  const handleDeleteClick = React.useCallback(async () => {
    try {
      setPending(true);
      invariant(dataProvider.deleteOne, 'deleteOne not implemented');
      await dataProvider.deleteOne(id);
      setNotification({
        key: `delete-success-${id}`,
        message: 'Row deleted',
        severity: 'success',
      });
    } catch (error) {
      setNotification({
        key: `delete-failed-${id}`,
        message: 'Failed to delete row',
        severity: 'error',
      });
    } finally {
      setPending(false);
      await refetch();
    }
  }, [dataProvider, id, refetch, setNotification]);

  return (
    <GridActionsCellItem
      icon={pending ? <CircularProgress size={16} /> : <DeleteIcon fontSize="inherit" />}
      label={`Delete "${id}"`}
      onClick={handleDeleteClick}
    />
  );
}

function inferFields(rows: any[]): ResolvedFields<any> {
  const result: any = {};

  const types = new Map<string, Set<string>>();

  const rowsToConsider = 10;
  const rowSlice = rows.slice(0, rowsToConsider);

  for (const row of rowSlice) {
    for (const key of Object.keys(row)) {
      const value = row[key];
      const type = typeof value;
      const existingType = types.get(key);
      if (existingType) {
        existingType.add(type);
      } else {
        types.set(key, new Set([type]));
      }
    }
  }

  for (const [field, value] of Array.from(types.entries())) {
    if (value.size === 1) {
      const type = value.size === 1 ? Array.from(value)[0] : 'string';
      result[field] = { type };
    }
  }

  return result;
}

interface GridState {
  editedRowId: GridRowId | null;
  isProcessingRowUpdate: boolean;
  rowModesModel: GridRowModesModel;
}

type GridAction =
  | { kind: 'START_ROW_EDIT'; rowId: GridRowId; fieldToFocus: string | undefined }
  | { kind: 'CANCEL_ROW_EDIT' }
  | { kind: 'START_ROW_UPDATE' }
  | { kind: 'END_ROW_UPDATE' };

function gridEditingReducer(state: GridState, action: GridAction): GridState {
  switch (action.kind) {
    case 'START_ROW_EDIT':
      if (state.editedRowId !== null) {
        return state;
      }
      return {
        ...state,
        editedRowId: action.rowId,
        rowModesModel: {
          [action.rowId]: {
            mode: GridRowModes.Edit,
            fieldToFocus: action.fieldToFocus,
          },
        },
      };
    case 'CANCEL_ROW_EDIT':
      return {
        ...state,
        editedRowId: null,
        rowModesModel: state.editedRowId
          ? {
              [state.editedRowId]: {
                mode: GridRowModes.View,
                ignoreModifications: true,
              },
            }
          : {},
      };
    case 'START_ROW_UPDATE':
      return {
        ...state,
        isProcessingRowUpdate: true,
        rowModesModel: {},
      };
    case 'END_ROW_UPDATE':
      return { ...state, editedRowId: null, isProcessingRowUpdate: false };
    default:
      throw new Error(`Unhandled action: ${JSON.stringify(action)}`);
  }
}
/**
 *
 * Demos:
 *
 * - [Data Grid](https://mui.com/)
 *
 * API:
 *
 * - [DataGrid API](https://mui.com/toolpad/core/api/data-grid)
 */
export function getColumnsFromDataProviderFields<R extends Datum>(
  fields?: ResolvedFields<R>,
  baseColumns?: readonly GridColDef<R>[],
): readonly GridColDef<R>[] {
  const fieldMap = new Map<keyof R & string, ResolvedField<R, any>>(Object.entries(fields ?? {}));

  baseColumns = baseColumns ?? Object.keys(fields ?? {}).map((field) => ({ field }));

  const resolvedColumns = baseColumns.map(function mapper<K extends FieldOf<R>>(
    baseColDef: GridColDef<R, R[K], string>,
  ): GridColDef<R, R[K], string> {
    const dataProviderField: ResolvedField<R, K> | undefined = fieldMap.get(baseColDef.field);
    const colDef: GridColDef<R, R[K], string> = {
      type: dataProviderField?.type,
      headerName: dataProviderField?.label,
      ...baseColDef,
    };

    const valueFormatter = dataProviderField?.valueFormatter;
    if (valueFormatter && !colDef.valueFormatter) {
      colDef.valueFormatter = (value) => valueFormatter(value, colDef.field as K);
    }

    let valueGetter: GridValueGetter<R> | undefined = colDef.valueGetter;

    if (colDef.type === 'date' || colDef.type === 'dateTime') {
      valueGetter = wrapWithDateValueGetter(valueGetter);
    }

    return {
      ...colDef,
      valueGetter,
    };
  });

  return resolvedColumns;
}

function updateColumnsWithDataProviderEditing<R extends Datum>(
  apiRef: React.MutableRefObject<GridApi>,
  dataProvider: ResolvedDataProvider<R>,
  baseColumns: readonly GridColDef<R>[],
  state: GridState,
  dispatch: React.Dispatch<GridAction>,
): readonly GridColDef<R>[] {
  const idField = dataProvider.idField ?? DEFAULT_ID_FIELD;
  const canEdit = !!dataProvider.updateOne;
  const canDelete = !!dataProvider.deleteOne;
  const canCreate = !!dataProvider.createOne;
  const hasEditableRows = canCreate || canEdit;
  const hasActionsColumn: boolean = canCreate || canEdit || canDelete;

  const resolvedColumns = baseColumns.map(function mapper<K extends FieldOf<R>>(
    baseColDef: GridColDef<R, R[K], string>,
  ): GridColDef<R, R[K], string> {
    const colDef = { ...baseColDef };

    if (hasEditableRows && colDef.field !== idField) {
      colDef.editable = true;
    }

    return colDef;
  });

  if (hasActionsColumn) {
    resolvedColumns.push({
      field: ACTIONS_COLUMN_FIELD,
      headerName: 'Actions',
      type: 'actions',
      align: 'center',
      resizable: false,
      pinnable: false,
      width: 100,
      getActions: (params) => {
        const actions: React.ReactElement<GridActionsCellItemProps>[] = [];
        const rowId = params.row[idField] as GridRowId;

        const isEditing = state.editedRowId !== null || state.isProcessingRowUpdate;
        const isEditedRow = isDraftRow(params.row) || rowId === state.editedRowId;

        if (isEditedRow) {
          actions.push(
            <GridActionsCellItem
              key="save"
              icon={state.isProcessingRowUpdate ? <CircularProgress size={16} /> : <SaveIcon />}
              label="Save"
              disabled={state.isProcessingRowUpdate}
              onClick={() => {
                dispatch({ kind: 'START_ROW_UPDATE' });
              }}
            />,
            <GridActionsCellItem
              key="cancel"
              icon={<CloseIcon />}
              label="Cancel"
              disabled={state.isProcessingRowUpdate}
              onClick={() => {
                dispatch({ kind: 'CANCEL_ROW_EDIT' });
              }}
            />,
          );
        } else {
          if (canEdit) {
            actions.push(
              <GridActionsCellItem
                key="update"
                icon={<EditIcon />}
                label="Edit"
                disabled={isEditing}
                onClick={() => {
                  dispatch({
                    kind: 'START_ROW_EDIT',
                    rowId,
                    fieldToFocus: getEditedRowFieldToFocus(apiRef, idField),
                  });
                }}
              />,
            );
          }
          if (canDelete) {
            actions.push(<DeleteAction key="delete" id={rowId} dataProvider={dataProvider} />);
          }
        }
        return actions;
      },
    });
  }

  return resolvedColumns;
}

function ToolbarGridCreateButton() {
  const { visible, slotsProp, onClick, disabled } = useNonNullableContext(
    ToolbarCreateButtonContext,
  );
  const ButtonComponent = slotsProp?.baseButton ?? Button;
  return visible ? (
    <ButtonComponent color="primary" startIcon={<AddIcon />} onClick={onClick} disabled={disabled}>
      Add record
    </ButtonComponent>
  ) : null;
}

function ToolbarGridToolbar() {
  return (
    <GridToolbarContainer>
      <ToolbarGridCreateButton />
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

function diffRows<R extends Record<PropertyKey, unknown>>(original: R, changed: R): Partial<R> {
  const keys = new Set([...Object.keys(original), ...Object.keys(changed)]);
  const diff: Partial<R> = {};
  Array.from(keys).forEach((key: keyof R) => {
    const originalValue = original[key];
    const changedValue = changed[key];
    if (Object.is(originalValue, changedValue)) {
      return;
    }
    if (
      originalValue instanceof Date &&
      changedValue instanceof Date &&
      originalValue.getTime() === changedValue.getTime()
    ) {
      return;
    }
    (diff as any)[key] = changedValue;
  });
  return diff;
}

function fromGridFilterModel<R extends Datum>(filterModel: GridFilterModel): Filter<R> {
  const filter: Filter<R> = {};
  for (const [field, filterItem] of Object.entries(filterModel.items)) {
    for (const [operator, value] of Object.entries(filterItem)) {
      filter[field as FieldOf<R>] ??= {};
      (filter[field as FieldOf<R>] as any)[operator] = value;
    }
  }
  return filter;
}

function getEditedRowFieldToFocus(
  apiRef: React.MutableRefObject<GridApi>,
  idField: ValidId,
): string | undefined {
  const firstNonIdColumn = apiRef.current.getVisibleColumns().find((col) => col.field !== idField);
  return firstNonIdColumn?.field;
}

/**
 *
 * Demos:
 *
 * - [Data Grid](https://mui.com/)
 *
 * API:
 *
 * - [DataGrid API](https://mui.com/toolpad/core/api/data-grid)
 * - inherits [X DataGrid API](https://mui.com/x/api/data-grid/data-grid/)
 */
function DataGrid<R extends Datum>(props: DataGridProps<R>) {
  const { dataProvider, ...restProps1 } = props;

  // TODO: figure out how to stop generating prop types for X Grid properties
  // and document with inheritance
  const restProps2 = restProps1;

  const {
    columns: columnsProp,
    processRowUpdate: processRowUpdateProp,
    slots: slotsProp,
    apiRef: apiRefProp,
    initialState: initialStateProp,
    autosizeOptions: autosizeOptionsProp,
    getRowId: getRowIdProp,
    rowModesModel: rowModesModelProp,
    filterMode: filterModeProp,
    filterModel: filterModelProp,
    onFilterModelChange: onFilterModelChangeProp,
    paginationMode: paginationModeProp,
    paginationModel: paginationModelProp,
    onPaginationModelChange: onPaginationModelChangeProp,
    ...restProps
  } = restProps2;

  const idField = dataProvider?.idField ?? DEFAULT_ID_FIELD;

  const [notification, setNotification] = React.useState<DataGridNotification | null>(null);

  const gridApiRefOwn = useGridApiRef();
  const apiRef = apiRefProp ?? gridApiRefOwn;

  const [gridPaginationModel, setGridPaginationModel] = useControlled<GridPaginationModel>({
    controlled: paginationModelProp,
    default: { page: 0, pageSize: 100 },
    name: 'DataGrid',
    state: 'paginationModel',
  });

  const onGridPaginationModelChange = React.useCallback<
    NonNullable<XDataGridProps['onPaginationModelChange']>
  >(
    (paginationModel, details) => {
      setGridPaginationModel(paginationModel);
      onPaginationModelChangeProp?.(paginationModel, details);
    },
    [onPaginationModelChangeProp, setGridPaginationModel],
  );

  const [gridFilterModel, setGridFilterModel] = useControlled<GridFilterModel>({
    controlled: filterModelProp,
    default: { items: [] },
    name: 'DataGrid',
    state: 'filterModel',
  });

  const onGridFilterModelChange = React.useCallback<
    NonNullable<XDataGridProps['onFilterModelChange']>
  >(
    (filterModel, details) => {
      setGridFilterModel(filterModel);
      onFilterModelChangeProp?.(filterModel, details);
    },
    [onFilterModelChangeProp, setGridFilterModel],
  );

  const [editingState, dispatchEditingAction] = React.useReducer(gridEditingReducer, {
    editedRowId: null,
    isProcessingRowUpdate: false,
    rowModesModel: {},
  });

  const handleCreateRowRequest = React.useCallback(() => {
    dispatchEditingAction({
      kind: 'START_ROW_EDIT',
      rowId: DRAFT_ROW_ID,
      fieldToFocus: getEditedRowFieldToFocus(apiRef, idField),
    });
  }, [apiRef, idField]);

  const useGetManyParams = React.useMemo<GetManyParams<R>>(
    () => ({
      pagination:
        paginationModeProp === 'server'
          ? {
              start: gridPaginationModel.page * gridPaginationModel.pageSize,
              pageSize: gridPaginationModel.pageSize,
            }
          : null,
      filter: filterModeProp === 'server' ? fromGridFilterModel(gridFilterModel) : {},
    }),
    [
      filterModeProp,
      gridFilterModel,
      gridPaginationModel.page,
      gridPaginationModel.pageSize,
      paginationModeProp,
    ],
  );

  const { data, loading, error, refetch } = useGetMany(dataProvider ?? null, useGetManyParams);

  const rows = React.useMemo(() => {
    const renderedRows = data?.rows ?? [];
    if (editingState.editedRowId === DRAFT_ROW_ID) {
      return [createDraftRow(), ...renderedRows];
    }
    return renderedRows;
  }, [data?.rows, editingState.editedRowId]);

  const processRowUpdate = React.useMemo<ProcessRowUpdate>(() => {
    if (processRowUpdateProp) {
      return processRowUpdateProp;
    }
    const updateOne = dataProvider?.updateOne;
    const createOne = dataProvider?.createOne;
    if (!(updateOne || createOne)) {
      return undefined;
    }
    return async (updatedRow: R, originalRow: R): Promise<R> => {
      try {
        let result: R;
        if (isDraftRow(updatedRow)) {
          invariant(createOne, 'createOne not implemented');

          const rowInit = cleanDraftRow(updatedRow);

          try {
            result = await createOne(rowInit);
          } catch (creationError) {
            let message = 'Failed to create row';
            if (process.env.NODE_ENV !== 'production') {
              message = `${message}: ${errorFrom(creationError).message}`;
            }
            setNotification({ key: `create-failed`, message, severity: 'error' });
            return { ...originalRow, _action: 'delete' };
          }

          const createdId = result[idField] as GridRowId;
          setNotification({
            key: `create-success-${createdId}`,
            message: 'Row created',
            severity: 'success',
            showId: createdId,
          });
        } else {
          invariant(updateOne, 'updateOne not implemented');

          const changedValues = diffRows(originalRow, updatedRow);
          if (Object.keys(changedValues).length <= 0) {
            return originalRow;
          }

          const updatedId = updatedRow[idField] as ValidId;
          try {
            result = await updateOne(updatedId, changedValues);
          } catch (updateError) {
            let message = 'Failed to update row';
            if (process.env.NODE_ENV !== 'production') {
              message = `${message}: ${errorFrom(updateError).message}`;
            }
            setNotification({
              key: `update-failed-${updatedId}`,
              message,
              severity: 'error',
            });
            return originalRow;
          }

          setNotification({
            key: `update-success-${updatedId}`,
            message: 'Row updated',
            severity: 'success',
            showId: result[idField] as GridRowId,
          });
        }

        return result;
      } finally {
        dispatchEditingAction({ kind: 'END_ROW_UPDATE' });
        refetch();
      }
    };
  }, [dataProvider, idField, processRowUpdateProp, refetch]);

  const slots = React.useMemo<Partial<GridSlotsComponent>>(
    () => ({
      loadingOverlay: RowsLoadingOverlay,
      toolbar: ToolbarGridToolbar,
      ...slotsProp,
    }),
    [slotsProp],
  );
  const hasCreateButton = !!dataProvider?.createOne;

  const createButtonContext = React.useMemo(() => {
    return {
      slotsProp,
      onClick: () => {
        handleCreateRowRequest();
      },
      visible: hasCreateButton,
      disabled: !!editingState.editedRowId || loading,
    };
  }, [editingState.editedRowId, handleCreateRowRequest, hasCreateButton, loading, slotsProp]);

  const getRowId = React.useCallback<GridRowIdGetter<R>>(
    (row: R) => {
      if (isDraftRow(row)) {
        return DRAFT_ROW_ID;
      }
      if (getRowIdProp) {
        return getRowIdProp(row);
      }
      return row[idField] as GridRowId;
    },
    [getRowIdProp, idField],
  );

  const handleRowEditStart = React.useCallback<GridEventListener<'rowEditStart'>>(
    (params) => {
      const rowId = params.row[idField] as GridRowId;
      const canEdit = !!dataProvider?.updateOne;
      if (params.reason === 'cellDoubleClick' && canEdit) {
        dispatchEditingAction({
          kind: 'START_ROW_EDIT',
          rowId,
          fieldToFocus: getEditedRowFieldToFocus(apiRef, idField),
        });
      }
    },
    [apiRef, dataProvider?.updateOne, idField],
  );

  // Calculate separately to avoid re-calculating columns on every render
  const inferredFields = React.useMemo<ResolvedFields<R> | null>(() => {
    if (!dataProvider) {
      // There are no rows coming from the data provider
      return null;
    }
    if (dataProvider.fields) {
      // The data provider already provides fields
      return null;
    }
    if (!data?.rows) {
      return null;
    }
    return inferFields(data.rows);
  }, [dataProvider, data?.rows]);

  const columns = React.useMemo(() => {
    if (!dataProvider) {
      return columnsProp ?? [];
    }

    let gridColumns = getColumnsFromDataProviderFields(
      inferredFields ?? dataProvider.fields,
      columnsProp,
    );

    gridColumns = updateColumnsWithDataProviderEditing(
      apiRef,
      dataProvider,
      gridColumns,
      editingState,
      dispatchEditingAction,
    );

    return gridColumns;
  }, [apiRef, columnsProp, dataProvider, editingState, inferredFields]);

  const isSsr = useSsr();

  return (
    <RefetchContext.Provider value={refetch}>
      <SetDataGridNotificationContext.Provider value={setNotification}>
        <ToolbarCreateButtonContext.Provider value={createButtonContext}>
          <RootContainer
            sx={{
              height: restProps.autoHeight ? undefined : restProps.height ?? '100%',
              // Disable vertical scrolling when editing a row
              [`& .${gridClasses.virtualScroller}`]: {
                ...(editingState.editedRowId === DRAFT_ROW_ID ? { overflowY: 'hidden' } : {}),
              },
              [`& .${gridClasses['scrollbar--vertical']}`]: {
                ...(editingState.editedRowId === DRAFT_ROW_ID ? { pointerEvents: 'none' } : {}),
              },
              [`& .${gridClasses.root}`]: {
                visibility: error ? 'hidden' : undefined,
              },
            }}
          >
            {inferredFields ? <InferencingAlert fields={inferredFields} /> : null}
            <GridContainer>
              <XDataGrid
                pagination
                apiRef={apiRef}
                rows={rows}
                columns={columns}
                loading={loading}
                processRowUpdate={processRowUpdate}
                slots={slots}
                rowModesModel={editingState.rowModesModel}
                onRowEditStart={handleRowEditStart}
                getRowId={getRowId}
                filterMode={filterModeProp ?? 'client'}
                filterModel={gridFilterModel}
                onFilterModelChange={onGridFilterModelChange}
                paginationMode={paginationModeProp ?? 'client'}
                paginationModel={gridPaginationModel}
                onPaginationModelChange={onGridPaginationModelChange}
                {...(paginationModeProp === 'server'
                  ? {
                      rowCount: data?.rowCount ?? -1,
                    }
                  : {})}
                {...restProps}
                // TODO: How can we make this optional? Can we move to a different UI for row creation?
                editMode="row"
              />
              {isSsr ? (
                // At last show something during SSR https://github.com/mui/mui-x/issues/7599
                <PlaceholderBorder>
                  <LoadingOverlay />
                </PlaceholderBorder>
              ) : null}

              {error ? (
                <PlaceholderBorder>
                  <ErrorOverlay error={error} />
                </PlaceholderBorder>
              ) : null}

              <NotificationSnackbar apiRef={apiRef} notification={notification} idField={idField} />
            </GridContainer>
          </RootContainer>
        </ToolbarCreateButtonContext.Provider>
      </SetDataGridNotificationContext.Provider>
    </RefetchContext.Provider>
  );
}

DataGrid.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The data provider to resolve the displayed data. This object must be referentially stable.
   */
  dataProvider: PropTypes.shape({
    createOne: PropTypes.func,
    deleteOne: PropTypes.func,
    fields: PropTypes.object,
    getMany: PropTypes.func.isRequired,
    getOne: PropTypes.func,
    idField: PropTypes.object,
    updateOne: PropTypes.func,
  }),
  /**
   * The height of the datagrid in pixels. If left `undefined`, it adopts the height of its parent.
   */
  height: PropTypes.number,
} as any;

export { DataGrid };
