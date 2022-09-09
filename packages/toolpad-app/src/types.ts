import type * as React from 'react';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  SlotType,
  RuntimeError,
  ComponentConfig,
  NodeId,
  PropValueType,
  BindableAttrEntries,
} from '@mui/toolpad-core';

import { PaletteMode } from '@mui/material';
import type { Maybe, WithControlledProp } from './utils/types';
import type { Rectangle } from './utils/geometry';

export interface EditorProps<T> {
  /**
   * @deprecated
   * `nodeId` is only needed for very specific editors. Maybe this rather belongs in some context?
   */
  nodeId?: NodeId;
  label: string;
  propType: PropValueType;
  disabled?: boolean;
  value: T | undefined;
  onChange: (newValue: T | undefined) => void;
}

export type FlowDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';

export type Updates<O extends { id: string }> = Partial<O> & Pick<O, 'id'>;

export interface SlotLocation {
  parentId: NodeId;
  parentProp: string;
  parentIndex?: string;
}

export interface SlotState {
  type: SlotType;
  rect: Rectangle;
  flowDirection: FlowDirection;
}

export interface SlotsState {
  [prop: string]: SlotState | undefined;
}

export interface NodeInfo {
  nodeId: NodeId;
  error?: RuntimeError | null;
  rect?: Rectangle;
  slots?: SlotsState;
  componentConfig?: ComponentConfig<unknown>;
  props: { [key: string]: unknown };
}

export interface NodesInfo {
  [nodeId: NodeId]: NodeInfo | undefined;
}

export interface PageViewState {
  nodes: NodesInfo;
}

export type ApiResultFields<D = any> = {
  [K in keyof D]?: {
    type: string;
  };
};

export interface ApiResult<D = any> {
  data: D;
  fields?: ApiResultFields;
}

export interface CreateHandlerApi<P = unknown> {
  setConnectionParams: (appId: string, connectionId: string, props: P) => Promise<void>;
  getConnectionParams: (appId: string, connectionId: string) => Promise<P>;
}

export interface ConnectionEditorProps<P> extends WithControlledProp<P | null> {
  handlerBasePath: string;
  appId: string;
  connectionId: NodeId;
}
export type ConnectionParamsEditor<P = {}> = React.FC<ConnectionEditorProps<P>>;

export interface QueryEditorModel<Q> {
  query: Q;
  params: BindableAttrEntries;
}

export interface QueryEditorShellProps {
  children?: React.ReactNode;
  isDirty?: boolean;
  onCommit?: () => void;
}

export interface QueryEditorProps<C, Q> extends WithControlledProp<QueryEditorModel<Q>> {
  QueryEditorShell: React.ComponentType<QueryEditorShellProps>;
  connectionParams: Maybe<C>;
  globalScope: Record<string, any>;
}

export type QueryEditor<C, Q> = React.FC<QueryEditorProps<C, Q>>;

export interface ConnectionStatus {
  timestamp: number;
  error?: string;
}

export interface ClientDataSource<C = {}, Q = {}> {
  displayName: string;
  ConnectionParamsInput: ConnectionParamsEditor<C>;
  QueryEditor: QueryEditor<C, Q>;
  getInitialQueryValue: () => Q;
  hasDefault?: boolean;
}

export interface ServerDataSource<P = {}, Q = {}, PQ = {}, D = {}> {
  // Execute a private query on this connection, intended for editors only
  execPrivate?: (connection: Maybe<P>, query: PQ) => Promise<any>;
  // Execute a query on this connection, intended for viewers
  exec: (connection: Maybe<P>, query: Q, params: any) => Promise<ApiResult<D>>;
  createHandler?: () => (
    api: CreateHandlerApi<P>,
    req: NextApiRequest,
    res: NextApiResponse,
  ) => void;
}

/**
 * Anything that can be inlined as the content of a JSX element
 */
export interface JsxFragmentExpression {
  type: 'jsxFragment';
  value: string;
}

/**
 * Anything that can be inlined as the RHS of an assignment
 */
export interface JsExpression {
  type: 'expression';
  value: string;
}

/**
 * Anything that can be inlined as a single JSX element
 */
export interface JsxElement {
  type: 'jsxElement';
  value: string;
}

export type PropExpression = JsxFragmentExpression | JsExpression | JsxElement;

export type ResolvedProps = Record<string, PropExpression | undefined>;

export interface AppTheme {
  'palette.mode'?: PaletteMode;
  'palette.primary.main'?: string;
  'palette.secondary.main'?: string;
}

export type VersionOrPreview = 'preview' | number;

export type AppTemplateName = 'blank' | 'stats' | 'images';
