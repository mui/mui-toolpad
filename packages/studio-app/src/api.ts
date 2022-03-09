import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from 'react-query';
import type {
  Definition,
  MethodResolvers,
  RpcRequest,
  RpcResponse,
  ServerDefinition,
} from '../pages/api/rpc';
import config from './config';

if (config.demoMode) {
  // TODO: replace API with shim based on window.localStorage
  console.log(`Starting Studio in demo mode`);
}
type Methods<R extends MethodResolvers> = {
  [K in keyof R]: (...params: Parameters<R[K]>[0]) => ReturnType<R[K]>;
};

function createFetcher(endpoint: string, type: 'query' | 'mutation'): Methods<any> {
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
            const { result } = (await res.json()) as RpcResponse;
            return result;
          }
          throw new Error(`HTTP ${res.status}`);
        };
      },
    },
  );
}

interface UseQueryFn<M extends MethodResolvers> {
  <K extends keyof M & string>(
    name: K,
    params: Parameters<M[K]> | null,
    options?: Omit<
      UseQueryOptions<
        Awaited<ReturnType<M[K]>>,
        unknown,
        Awaited<ReturnType<M[K]>>,
        [K, Parameters<M[K]> | null]
      >,
      'queryKey' | 'queryFn' | 'enabled'
    >,
  ): UseQueryResult<Awaited<ReturnType<M[K]>>>;
}

interface UseMutationFn<M extends MethodResolvers> {
  <K extends keyof M & string>(
    name: K,
    options?: UseMutationOptions<unknown, unknown, Parameters<M[K]>>,
  ): UseMutationResult<Awaited<ReturnType<M[K]>>, unknown, Parameters<M[K]>>;
}

interface ApiClient<D extends Definition> {
  query: Methods<D['query']>;
  mutation: Methods<D['mutation']>;
  useQuery: UseQueryFn<Methods<D['query']>>;
  useMutation: UseMutationFn<Methods<D['mutation']>>;
}

function createClient<D extends Definition>(endpoint: string): ApiClient<D> {
  const query = createFetcher(endpoint, 'query');
  const mutation = createFetcher(endpoint, 'mutation');
  return {
    query,
    mutation,
    useQuery: (key, params, options) => {
      return useQuery({
        ...options,
        enabled: !!params,
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
  };
}

export default createClient<ServerDefinition>('/api/rpc');
