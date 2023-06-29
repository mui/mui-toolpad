import { BindableAttrValue, ExecFetchResult, PrimitiveValueType } from '@mui/toolpad-core';
import type { IntrospectionResult } from '../../server/functionsTypesWorker';

export interface LocalConnectionParams {}

export interface LocalQuery {
  /**
   * name of the handler to execute.
   */
  function?: string;
}

export type LocalParams = {
  readonly searchParams: [string, BindableAttrValue<any>][];
  readonly body?: Body;
};

export type LocalPrivateApi = {
  debugExec(query: LocalQuery, params: Record<string, any>): Promise<any>;
  introspection(): Promise<IntrospectionResult>;
  openEditor(fileName: string): Promise<void>;
  createNew(fileName: string): Promise<void>;
};

export interface FetchResult extends ExecFetchResult<any> {
  data: any;
}

export interface IntrospectedFunction {
  name: string;
  file: string;
  parameters: Record<string, PrimitiveValueType>;
}

export type { IntrospectionResult };
