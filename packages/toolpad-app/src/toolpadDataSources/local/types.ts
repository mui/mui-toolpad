import {
  BindableAttrValue,
  CreateQueryConfig,
  ExecFetchResult,
  ToolpadQuery,
} from '@mui/toolpad-core';

export interface LocalConnectionParams {}

export interface LocalQuery {
  function?: string;
}

export type LocalParams = {
  readonly searchParams: [string, BindableAttrValue<any>][];
  readonly body?: Body;
};

export type LocalPrivateQuery =
  | {
      kind: 'debugExec';
      query: LocalQuery;
      params: Record<string, any>;
    }
  | {
      kind: 'introspection';
    };

export interface FetchResult extends ExecFetchResult<any> {
  data: any;
}

export type IntrospectionResult = {
  functions: Record<string, CreateQueryConfig<unknown>>;
};
