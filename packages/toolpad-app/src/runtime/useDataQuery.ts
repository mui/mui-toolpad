import { GridRowsProp } from '@mui/x-data-grid-pro';
import * as React from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { NodeId } from '@mui/toolpad-core';
import { useAppContext } from './AppContext';
import { VersionOrPreview } from '../types';
import { CanvasHooksContext } from './CanvasHooksContext';

interface ExecDataSourceQueryParams {
  signal?: AbortSignal;
  appId: string;
  version: VersionOrPreview;
  queryId: string;
  params: any;
}

export async function execDataSourceQuery({
  signal,
  appId,
  version,
  queryId,
  params,
}: ExecDataSourceQueryParams) {
  const dataUrl = new URL(`/api/data/${appId}/${version}/`, window.location.href);
  const url = new URL(`./${encodeURIComponent(queryId)}`, dataUrl);

  const res = await fetch(String(url), {
    method: 'POST',
    body: JSON.stringify(params),
    headers: [['content-type', 'application/json']],
    signal,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} while fetching "${url}"`);
  }

  return res.json();
}

export type UseDataQueryConfig = Pick<
  UseQueryOptions<any, unknown, unknown, any[]>,
  'enabled' | 'refetchInterval'
>;

export interface UseFetch {
  isLoading: boolean;
  isFetching: boolean;
  error: any;
  data: any;
  rows: GridRowsProp;
  fetch: (overrides?: any) => void;
  refetch: () => void;
  /** @deprecated Use fetch */
  call: (overrides?: any) => Promise<void>;
}

const EMPTY_ARRAY: any[] = [];
const EMPTY_OBJECT: any = {};

export function useDataQuery(
  queryId: NodeId,
  params: any,
  {
    enabled = true,
    ...options
  }: Pick<UseQueryOptions<any, unknown, unknown, any[]>, 'enabled' | 'refetchInterval'>,
): UseFetch {
  const { appId, version } = useAppContext();
  const { savedNodes } = React.useContext(CanvasHooksContext);

  // These are only used by the editor to invalidate caches whenever the query changes during editing
  const nodeHash: number | undefined = savedNodes ? savedNodes[queryId] : undefined;
  const isNodeAvailableOnServer: boolean = savedNodes ? !!savedNodes[queryId] : true;

  const {
    isLoading,
    isFetching,
    error: fetchError,
    data: responseData = EMPTY_OBJECT,
    refetch,
  } = useQuery(
    [appId, version, nodeHash, queryId, params],
    ({ signal }) =>
      queryId &&
      execDataSourceQuery({
        signal,
        appId,
        version,
        queryId,
        params,
      }),
    {
      ...options,
      enabled: isNodeAvailableOnServer && !!queryId && enabled,
    },
  );

  const { data, error: apiError } = responseData;

  const error = apiError || fetchError;

  const rows = Array.isArray(data) ? data : EMPTY_ARRAY;

  const result: UseFetch = React.useMemo(
    () => ({
      isLoading: isLoading && enabled,
      isFetching,
      error,
      data,
      rows,
      refetch,
      fetch: async () => {
        throw new Error(`"fetch" is unsupported for automatic queries`);
      },
      call: async () => {
        throw new Error(`"call" is unsupported for automatic queries`);
      },
    }),
    [isLoading, enabled, isFetching, error, data, rows, refetch],
  );

  return result;
}
