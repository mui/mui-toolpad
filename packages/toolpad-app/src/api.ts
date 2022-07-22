import {
  QueryClient,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from 'react-query';
import { parse as superjsonParse } from 'superjson';
import type {
  Definition,
  MethodsGroup,
  MethodsOf,
  MethodsOfGroup,
  RpcRequest,
  RpcResponse,
  ServerDefinition,
} from '../pages/api/rpc';

export const queryClient = new QueryClient();

function createFetcher(endpoint: string, type: 'query' | 'mutation'): MethodsOfGroup<any> {
  return new Proxy(
    {},
    {
      get(target, prop) {
        return async (...params: any[]) => {
          const body: RpcRequest = {
            type,
            name: prop as string,
            params,
          };
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify(body),
          });

          if (res.ok) {
            const response = (await res.json()) as RpcResponse;
            if (response.error) {
              throw new Error(response.error.message);
            }
            return superjsonParse(response.result);
          }

          throw new Error(`HTTP ${res.status}`);
        };
      },
    },
  );
}

export interface UseQueryFnOptions<F extends (...args: any[]) => any>
  extends Omit<
    UseQueryOptions<Awaited<ReturnType<F>>, unknown, Awaited<ReturnType<F>>, any[]>,
    'queryKey' | 'queryFn'
  > {}

interface UseQueryFn<M extends MethodsGroup> {
  <K extends keyof M & string>(
    name: K,
    params: Parameters<M[K]> | null,
    options?: UseQueryFnOptions<M[K]>,
  ): UseQueryResult<Awaited<ReturnType<M[K]>>>;
}

interface UseMutationFn<M extends MethodsGroup> {
  <K extends keyof M & string>(
    name: K,
    options?: UseMutationOptions<any, unknown, Parameters<M[K]>>,
  ): UseMutationResult<Awaited<ReturnType<M[K]>>, unknown, Parameters<M[K]>>;
}

interface ApiClient<D extends Definition> {
  query: D['query'];
  mutation: D['mutation'];
  useQuery: UseQueryFn<D['query']>;
  useMutation: UseMutationFn<D['mutation']>;
  refetchQueries: <K extends keyof D['query']>(
    key: K,
    params?: Parameters<D['query'][K]>,
  ) => Promise<void>;
  invalidateQueries: <K extends keyof D['query']>(
    key: K,
    params?: Parameters<D['query'][K]>,
  ) => Promise<void>;
}

function createClient<D extends MethodsOf<any>>(endpoint: string): ApiClient<D> {
  const query = createFetcher(endpoint, 'query');
  const mutation = createFetcher(endpoint, 'mutation');

  return {
    query,
    mutation,
    useQuery: (key, params, options) => {
      return useQuery({
        ...options,
        enabled: !!params && options?.enabled !== false,
        queryKey: [key, params],
        queryFn: () => {
          if (!params) {
            throw new Error(`Invariant: "enabled" prop of useQuery should prevent this call'`);
          }
          return query[key](...params);
        },
      });
    },
    useMutation: (key, options) => useMutation((params) => mutation[key](...params), options),
    refetchQueries(key, params?) {
      return queryClient.refetchQueries(params ? [key, params] : [key]);
    },
    invalidateQueries(key, params?) {
      return queryClient.invalidateQueries(params ? [key, params] : [key]);
    },
  };
}

export default createClient<ServerDefinition>('/api/rpc');
