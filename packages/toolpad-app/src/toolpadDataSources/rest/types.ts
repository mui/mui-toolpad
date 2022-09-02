import { BindableAttrValue, ConstantAttrValue } from '@mui/toolpad-core';
import { Har } from 'har-format';
import { Maybe } from '../../utils/types';

interface AuthenticationBase {
  type: 'basic' | 'bearerToken' | 'apiKey';
}

export interface BasicAuth extends AuthenticationBase {
  type: 'basic';
  user: string;
  password: string;
}

export interface BearerTokenAuth extends AuthenticationBase {
  type: 'bearerToken';
  token: string;
}

export interface ApiKeyAuth extends AuthenticationBase {
  type: 'apiKey';
  header: string;
  key: string;
}

export type Authentication = BasicAuth | BearerTokenAuth | ApiKeyAuth;

export interface RestConnectionParams {
  baseUrl?: string;
  headers?: [string, string][];
  authentication?: Maybe<Authentication>;
}

export type RawBody = {
  kind: 'raw';
  content: BindableAttrValue<string>;
  contentType: ConstantAttrValue<string>;
};

export type UrlEncodedBody = {
  kind: 'urlEncoded';
  content: [string, BindableAttrValue<string>][];
};

export type Body = RawBody | UrlEncodedBody;

export interface FetchQuery {
  readonly url: BindableAttrValue<string>;
  readonly method: string;
  readonly headers: [string, BindableAttrValue<string>][];
  readonly body?: Body;
  readonly transformEnabled?: boolean;
  readonly transform?: string;
}

export type FetchParams = {
  readonly searchParams: [string, BindableAttrValue<any>][];
  readonly body?: Body;
};

export type FetchPrivateQuery = {
  kind: 'debugExec';
  query: FetchQuery;
  params: Record<string, any>;
};

export interface FetchResult {
  data: any;
  untransformedData: any;
  error?: Error;
  har: Har;
}
