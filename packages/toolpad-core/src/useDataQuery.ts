import { GridRowsProp } from '@mui/x-data-grid-pro';
import * as React from 'react';
import { useQuery, UseQueryOptions } from 'react-query';

async function fetchData(dataUrl: string, queryId: string, params: any) {
  const url = new URL(`./${encodeURIComponent(queryId)}`, new URL(dataUrl, window.location.href));
  url.searchParams.set('params', JSON.stringify(params));
  const res = await fetch(String(url));
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} while fetching "${url}"`);
  }
  return res.json();
}

export interface UseDataQuery {
  isLoading: boolean;
  isFetching: boolean;
  error: any;
  data: any;
  rows: GridRowsProp;
  refetch: () => void;
}

export const INITIAL_DATA_QUERY: UseDataQuery = {
  isLoading: false,
  isFetching: false,
  error: null,
  data: null,
  rows: [],
  refetch: () => {},
};

const EMPTY_ARRAY: any[] = [];
const EMPTY_OBJECT: any = {};

export function useDataQuery(
  setResult: (newResult: UseDataQuery) => void,
  dataUrl: string,
  queryId: string | null,
  params: any,
  options: Pick<
    UseQueryOptions<any, unknown, unknown, any[]>,
    'refetchOnWindowFocus' | 'refetchOnReconnect' | 'refetchInterval'
  >,
): void {
  const {
    isLoading,
    isFetching,
    error,
    data: responseData = EMPTY_OBJECT,
    refetch,
  } = useQuery([dataUrl, queryId, params], () => queryId && fetchData(dataUrl, queryId, params), {
    ...options,
    enabled: !!queryId,
  });

  const { data } = responseData;

  const rows = Array.isArray(data) ? data : EMPTY_ARRAY;

  const result: UseDataQuery = React.useMemo(
    () => ({
      isLoading,
      isFetching,
      error,
      data,
      rows,
      refetch,
    }),
    [isLoading, isFetching, error, data, rows, refetch],
  );

  React.useEffect(() => {
    setResult(result);
  }, [setResult, result]);
}
