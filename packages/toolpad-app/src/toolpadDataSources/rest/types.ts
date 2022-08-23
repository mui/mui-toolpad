import { BindableAttrValue } from '@mui/toolpad-core';
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

export interface FetchQuery {
  readonly url: BindableAttrValue<string>;
  readonly method: string;
  readonly headers: [string, BindableAttrValue<string>][];
  readonly transformEnabled?: boolean;
  readonly transform?: string;
}

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
