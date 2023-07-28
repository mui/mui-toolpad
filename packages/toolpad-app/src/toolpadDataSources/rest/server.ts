import {
  ExecFetchResult,
  BindableAttrEntries,
  BindableAttrValue,
  BindableAttrValues,
  JsRuntime,
} from '@mui/toolpad-core';
import fetch, { RequestInit, Response, Headers } from 'node-fetch';
import { createServerJsRuntime } from '@mui/toolpad-core/jsServerRuntime';
import { SerializedError, errorFrom, serializeError } from '@mui/toolpad-utils/errors';
import { evaluateBindable } from '@mui/toolpad-core/jsRuntime';
import { removePrefix } from '@mui/toolpad-utils/strings';
import { withHarInstrumentation, createHarLog } from '../../server/har';
import { ServerDataSource } from '../../types';
import {
  FetchPrivateQuery,
  Body,
  FetchQuery,
  FetchResult,
  RawBody,
  RestConnectionParams,
  UrlEncodedBody,
} from './types';
import { Maybe } from '../../utils/types';
import applyTransform from '../applyTransform';
import { HTTP_NO_BODY, getAuthenticationHeaders, getDefaultUrl, parseBaseUrl } from './shared';
import type { IToolpadProject } from '../server';

async function loadEnvFile(project: IToolpadProject) {
  return project.envManager.getDeclaredValues();
}

function resolveBindable(
  jsRuntime: JsRuntime,
  bindable: BindableAttrValue<string>,
  scope: Record<string, unknown>,
): any {
  const { value, error } = evaluateBindable(jsRuntime, bindable, scope);
  if (error) {
    throw error;
  }
  return value;
}

function resolveBindableEntries(
  jsRuntime: JsRuntime,
  entries: BindableAttrEntries,
  scope: Record<string, unknown>,
): [string, any][] {
  return entries.map(([key, value]) => [key, resolveBindable(jsRuntime, value, scope)]);
}

function resolveBindables<P>(
  jsRuntime: JsRuntime,
  obj: BindableAttrValues<P>,
  scope: Record<string, unknown>,
): P {
  return Object.fromEntries(
    resolveBindableEntries(jsRuntime, Object.entries(obj) as BindableAttrEntries, scope),
  ) as P;
}

function parseQueryUrl(queryUrl: string, baseUrl: Maybe<string>): URL {
  if (baseUrl) {
    const parsedBase = parseBaseUrl(baseUrl);
    return new URL(parsedBase.href + removePrefix(queryUrl, '/'));
  }

  return new URL(queryUrl);
}

interface ResolvedRawBody {
  kind: 'raw';
  contentType: string;
  content: string;
}

function resolveRawBody(
  jsRuntime: JsRuntime,
  body: RawBody,
  scope: Record<string, unknown>,
): ResolvedRawBody {
  const { content, contentType } = resolveBindables(
    jsRuntime,
    {
      contentType: body.contentType,
      content: body.content,
    },
    scope,
  );
  return {
    kind: 'raw',
    contentType,
    content: String(content),
  };
}

interface ResolveUrlEncodedBodyBody {
  kind: 'urlEncoded';
  content: [string, string][];
}

function resolveUrlEncodedBody(
  jsRuntime: JsRuntime,
  body: UrlEncodedBody,
  scope: Record<string, unknown>,
): ResolveUrlEncodedBodyBody {
  return {
    kind: 'urlEncoded',
    content: resolveBindableEntries(jsRuntime, body.content, scope),
  };
}

function resolveBody(jsRuntime: JsRuntime, body: Body, scope: Record<string, unknown>) {
  switch (body.kind) {
    case 'raw':
      return resolveRawBody(jsRuntime, body, scope);
    case 'urlEncoded':
      return resolveUrlEncodedBody(jsRuntime, body, scope);
    default:
      throw new Error(`Missing case for "${(body as Body).kind}"`);
  }
}

async function readData(res: Response, fetchQuery: FetchQuery): Promise<any> {
  if (!fetchQuery.response || fetchQuery.response?.kind === 'json') {
    return res.json();
  }
  if (fetchQuery.response?.kind === 'raw') {
    return res.text();
  }
  throw new Error(`Unsupported response type "${fetchQuery.response.kind}"`);
}

export async function execBase(
  connection: Maybe<RestConnectionParams>,
  fetchQuery: FetchQuery,
  params: Record<string, string>,
): Promise<FetchResult> {
  const har = createHarLog();
  const instrumentedFetch = withHarInstrumentation(fetch, { har });
  const jsRuntime = createServerJsRuntime(process.env);

  const queryScope = {
    // @TODO: remove deprecated query after v1
    query: params,
    parameters: params,
  };

  const urlvalue = fetchQuery.url || getDefaultUrl(connection);

  const resolvedUrl = resolveBindable(jsRuntime, urlvalue, queryScope);
  const resolvedSearchParams = resolveBindableEntries(
    jsRuntime,
    fetchQuery.searchParams || [],
    queryScope,
  );
  const resolvedHeaders = resolveBindableEntries(jsRuntime, fetchQuery.headers || [], queryScope);

  const queryUrl = parseQueryUrl(resolvedUrl, connection?.baseUrl);
  resolvedSearchParams.forEach(([key, value]) => queryUrl.searchParams.append(key, value));

  const headers = new Headers([
    ...(connection ? getAuthenticationHeaders(connection.authentication) : []),
    ...(connection?.headers || []),
  ]);
  resolvedHeaders.forEach(([key, value]) => headers.append(key, value));

  const method = fetchQuery.method || 'GET';

  const requestInit: RequestInit = { method, headers };

  if (!HTTP_NO_BODY.has(method) && fetchQuery.body) {
    const resolvedBody = resolveBody(jsRuntime, fetchQuery.body, queryScope);

    switch (resolvedBody.kind) {
      case 'raw': {
        headers.set('content-type', resolvedBody.contentType);
        requestInit.body = resolvedBody.content;
        break;
      }
      case 'urlEncoded': {
        headers.set('content-type', 'application/x-www-form-urlencoded');
        requestInit.body = new URLSearchParams(resolvedBody.content).toString();
        break;
      }
      default:
        throw new Error(`Missing case for "${(resolvedBody as any).kind}"`);
    }
  }

  let error: SerializedError | undefined;
  let untransformedData;
  let data;

  try {
    const res = await instrumentedFetch(queryUrl.href, requestInit);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} (${res.statusText}) while fetching "${res.url}"`);
    }

    untransformedData = await readData(res, fetchQuery);
    data = untransformedData;

    if (fetchQuery.transformEnabled && fetchQuery.transform) {
      data = await applyTransform(jsRuntime, fetchQuery.transform, untransformedData);
    }
  } catch (rawError) {
    error = serializeError(errorFrom(rawError));
  }

  return { data, untransformedData, error, har };
}

async function exec(
  connection: Maybe<RestConnectionParams>,
  fetchQuery: FetchQuery,
  params: Record<string, string>,
): Promise<ExecFetchResult<any>> {
  const { data, error } = await execBase(connection, fetchQuery, params);
  return { data, error };
}

export default function createDatasource(
  project: IToolpadProject,
): ServerDataSource<{}, FetchQuery, any> {
  return {
    exec,

    async execPrivate(connection: Maybe<RestConnectionParams>, query: FetchPrivateQuery) {
      switch (query.kind) {
        case 'introspection': {
          const env = await loadEnvFile(project);
          const envVarNames = Object.keys(env);

          return { envVarNames };
        }
        case 'debugExec':
          return execBase(connection, query.query, query.params);
        default:
          throw new Error(`Unknown private query "${(query as FetchPrivateQuery).kind}"`);
      }
    },

    api: {},
  };
}
