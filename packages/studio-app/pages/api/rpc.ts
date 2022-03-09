import { NextApiHandler } from 'next';
import { AsyncLocalStorage } from 'async_hooks';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  testConnection,
  execApi,
  loadDom,
  saveDom,
  createRelease,
  deleteRelease,
  getReleases,
  loadReleaseDom,
  createDeployment,
  findActiveDeployment,
} from '../../src/server/data';
import { hasOwnProperty } from '../../src/utils/collections';

const asyncLocalStorage = new AsyncLocalStorage<RpcContext>();

export function getContext(): RpcContext {
  const ctx = asyncLocalStorage.getStore();
  if (!ctx) {
    throw new Error('Not in a request context');
  }
  return ctx;
}

interface RpcContext {
  req: IncomingMessage;
  res: ServerResponse;
}

export interface Method<P extends any[] = any[], R = any> {
  (...params: P): Promise<R>;
}

export interface MethodResolvers {
  readonly [key: string]: MethodResolver<any>;
}

export interface Definition {
  readonly query: MethodResolvers;
  readonly mutation: MethodResolvers;
}

export interface RpcRequest {
  type: 'query' | 'mutation';
  name: string;
  params: any[];
}

export interface RpcResponse {
  result: any;
}

function createRpcHandler(definition: Definition): NextApiHandler<RpcResponse> {
  return async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).end();
      return;
    }
    const { type, name, params } = req.body as RpcRequest;
    if (!hasOwnProperty(definition, type) || !hasOwnProperty(definition[type], name)) {
      // This is important to avoid RCE
      res.status(404).end();
      return;
    }
    const method: MethodResolver<any> = definition[type][name];
    const context = { req, res };
    const result = await method(params, context);
    const responseData: RpcResponse = { result };
    res.json(responseData);
  };
}

interface MethodResolver<F extends Method> {
  (params: Parameters<F>, ctx: RpcContext): ReturnType<F>;
}

function createMethod<F extends Method>(handler: MethodResolver<F>): MethodResolver<F> {
  return handler;
}

const rpcServer = {
  query: {
    execApi: createMethod<typeof execApi>((args) => {
      return execApi(...args);
    }),
    getReleases: createMethod<typeof getReleases>((params) => {
      return getReleases(...params);
    }),
    findActiveDeployment: createMethod<typeof findActiveDeployment>((params) => {
      return findActiveDeployment(...params);
    }),
    loadReleaseDom: createMethod<typeof loadReleaseDom>((params) => {
      return loadReleaseDom(...params);
    }),
    loadDom: createMethod<typeof loadDom>((params) => {
      return loadDom(...params);
    }),
  },
  mutation: {
    createRelease: createMethod<typeof createRelease>((params) => {
      return createRelease(...params);
    }),
    deleteRelease: createMethod<typeof deleteRelease>((params) => {
      return deleteRelease(...params);
    }),
    createDeployment: createMethod<typeof createDeployment>((params) => {
      return createDeployment(...params);
    }),
    testConnection: createMethod<typeof testConnection>((params) => {
      return testConnection(...params);
    }),
    saveDom: createMethod<typeof saveDom>((params) => {
      return saveDom(...params);
    }),
  },
} as const;

export type ServerDefinition = typeof rpcServer;

export default createRpcHandler(rpcServer);
