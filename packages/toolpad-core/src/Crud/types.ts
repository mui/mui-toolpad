import {
  GridColDef,
  GridColType,
  GridFilterModel,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';
import type { StandardSchemaV1 } from '@standard-schema/spec';

export type DataModelId = string | number;

export interface DataModel {
  id: DataModelId;
  [key: PropertyKey]: unknown;
}

type RemappedOmit<T, K extends PropertyKey> = { [P in keyof T as P extends K ? never : P]: T[P] };

export type OmitId<D extends DataModel> = RemappedOmit<D, 'id'>;

export type DataFieldFormValue = string | string[] | number | boolean | File | null;

export type DataFieldRenderFormField<F extends DataFieldFormValue = DataFieldFormValue> = ({
  value,
  onChange,
  error,
}: {
  value: F;
  onChange: (value: F) => void | Promise<void>;
  error: string | null;
}) => React.ReactNode;

export type DataFieldRenderShowField<F extends DataFieldFormValue = DataFieldFormValue> = ({
  value,
  headerName,
  data,
}: {
  value: F;
  headerName?: string;
  data: DataModel;
}) => React.ReactNode;

export type DataField<F extends DataFieldFormValue = DataFieldFormValue> = RemappedOmit<
  GridColDef,
  'type'
> & {
  type?: GridColType;
  renderFormField?: DataFieldRenderFormField<F>;
  renderShowField?: DataFieldRenderShowField<F>;
};

export interface DataSource<D extends DataModel> {
  fields: DataField[];
  getMany?: (params: {
    paginationModel: GridPaginationModel;
    sortModel: GridSortModel;
    filterModel: GridFilterModel;
  }) => { items: D[]; itemCount: number } | Promise<{ items: D[]; itemCount: number }>;
  getOne?: (id: DataModelId) => D | Promise<D>;
  createOne?: (data: Partial<OmitId<D>>) => D | Promise<D>;
  updateOne?: (id: DataModelId, data: Partial<OmitId<D>>) => D | Promise<D>;
  deleteOne?: (id: DataModelId) => void | Promise<void>;
  /**
   * Function to validate form values. Follows the Standard Schema `validate` function format (https://standardschema.dev/).
   */
  validate?: (
    value: Partial<OmitId<D>>,
  ) => ReturnType<StandardSchemaV1<Partial<OmitId<D>>>['~standard']['validate']>;
}
