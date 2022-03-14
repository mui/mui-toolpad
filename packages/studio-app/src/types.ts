import type * as React from 'react';
import {
  ArgTypeDefinition,
  ArgTypeDefinitions,
  SlotType,
  RuntimeError,
  LiveBindings,
  ComponentConfig,
} from '@mui/studio-core';
import type { Branded, WithControlledProp } from './utils/types';
import type { Rectangle } from './utils/geometry';

export interface EditorProps<T> {
  nodeId: NodeId;
  propName: string;
  argType: ArgTypeDefinition;
  disabled?: boolean;
  value: T | undefined;
  onChange: (newValue: T) => void;
}

export interface PropControlDefinition<T = any> {
  Editor: React.FC<EditorProps<T>>;
}

export interface StudioNodeBindings {
  [destProp: string]: string;
}

export interface StudioPageBindings {
  [destNodeId: NodeId]: StudioNodeBindings | undefined;
}

export type StudioBindingFormat = 'stringLiteral' | 'default';

// TODO: Get rid of StudioBoundExpressionProp? Its function can be fulfilled by derivedState as well
export interface StudioBoundExpression {
  type: 'boundExpression';
  value: string;
  format?: StudioBindingFormat;
}

export interface StudioJsExpressionBinding {
  type: 'jsExpression';
  value: string;
}

export interface StudioBinding {
  type: 'binding';
  value: string;
}

export interface StudioConstant<V> {
  type: 'const';
  value: V;
}

export type StudioBindable<V> =
  | StudioConstant<V>
  | StudioBinding
  | StudioBoundExpression
  | StudioJsExpressionBinding;

export type StudioConstants<P> = { [K in keyof P]: StudioConstant<P[K]> };

export type StudioBindables<P> = {
  readonly [K in keyof P]?: StudioBindable<P[K]>;
};

export type NodeId = Branded<string, 'NodeId'>;

export type FlowDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';

export interface SlotLocation {
  parentId: NodeId;
  parentProp: string;
  parentIndex: string;
}

export type SlotDirection = 'horizontal' | 'vertical';

export interface SlotState {
  type: SlotType;
  rect: Rectangle;
  direction: FlowDirection;
}

export interface SlotsState {
  [prop: string]: SlotState | undefined;
}

export interface NodeInfo {
  nodeId: NodeId;
  error?: RuntimeError;
  rect?: Rectangle;
  slots?: SlotsState;
  component?: ComponentConfig<unknown>;
  props: { [key: string]: unknown };
}

export interface NodesInfo {
  [nodeId: NodeId]: NodeInfo | undefined;
}

export interface PageViewState {
  nodes: NodesInfo;
  pageState: Record<string, unknown>;
  bindings: LiveBindings;
}

export type StudioApiResultFields<D = any> = {
  [K in keyof D]?: {
    type: string;
  };
};

export interface StudioApiResult<D = any> {
  data: D;
}

export interface StudioConnectionParamsEditorProps<P> extends WithControlledProp<P> {
  connectionName: string;
}

export type StudioConnectionParamsEditor<P = {}> = React.FC<StudioConnectionParamsEditorProps<P>>;
export type StudioQueryEditor<Q = {}> = React.FC<WithControlledProp<Q>>;

export interface ConnectionStatus {
  timestamp: number;
  error?: string;
}

export interface ConnectionParamsEditorApi {
  setSecret;
  saveMutation;
}

export interface ConnectionParamsEditor2Props<P> {
  api: ConnectionParamsEditorApi;
}

export type StudioConnectionParamsEditor2<P> = React.FC<ConnectionParamsEditor2Props<P>>;

export interface StudioDataSourceClient<P = {}, Q = {}> {
  displayName: string;
  ConnectionParamsInput: StudioConnectionParamsEditor<P>;
  // Next iteration of ConnectionParamsInput, allows Bharat's work to continue without breaking changes
  // We can move its implementation over once secrets are finshed
  ConnectionParamsInput2?: StudioConnectionParamsEditor2<P>;
  getInitialConnectionValue: () => P;
  isConnectionValid: (connection: P) => boolean;
  QueryEditor: StudioQueryEditor<Q>;
  getInitialQueryValue: () => Q;
  getArgTypes?: (query: Q) => ArgTypeDefinitions;
}

export interface StudioDataSourceServer<P = {}, Q = {}, D = {}> {
  test: (connection: StudioConnection<P>) => Promise<ConnectionStatus>;
  exec: (connection: StudioConnection<P>, query: Q, params: any) => Promise<StudioApiResult<D>>;
}

export interface StudioConnectionSummary {
  id: string;
  type: string;
  name: string;
}

export interface StudioConnection<P = unknown> extends StudioConnectionSummary {
  params: P;
  status: ConnectionStatus | null;
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

export interface StudioTheme {
  'palette.primary.main'?: string;
  'palette.secondary.main'?: string;
}

export type VersionOrPreview = 'preview' | number;
