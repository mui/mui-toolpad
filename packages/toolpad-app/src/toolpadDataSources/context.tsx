import { UseQueryResult } from 'react-query';
import { NodeId } from '@mui/toolpad-core';
import { createProvidedContext } from '../utils/react';
import client, { UseQueryFnOptions } from '../api';

export interface ConnectionContext {
  appId: string;
  dataSourceId: string;
  connectionId: NodeId | null;
}

const [useConnectionContext, ConnectionContextProvider] =
  createProvidedContext<ConnectionContext>('QueryEditor');

export { useConnectionContext, ConnectionContextProvider };

export function usePrivateQuery<Q = unknown, R = unknown>(
  query: Q | null,
  options?: UseQueryFnOptions<any>,
): UseQueryResult<R> {
  const { appId, dataSourceId, connectionId } = useConnectionContext();
  return client.useQuery(
    'dataSourceFetchPrivate',
    query == null ? null : [appId, dataSourceId, connectionId, query],
    options,
  );
}
