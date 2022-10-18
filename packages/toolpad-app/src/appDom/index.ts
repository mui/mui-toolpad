import { generateKeyBetween } from 'fractional-indexing';
import cuid from 'cuid';
import {
  NodeId,
  NodeReference,
  ConstantAttrValue,
  BindableAttrValue,
  BindableAttrValues,
  SecretAttrValue,
} from '@mui/toolpad-core';
import invariant from 'invariant';
import { BoxProps } from '@mui/material';
import { ConnectionStatus, AppTheme } from '../types';
import { omit, update, updateOrCreate } from '../utils/immutability';
import { camelCase, generateUniqueString, removeDiacritics } from '../utils/strings';
import { ExactEntriesOf, Maybe } from '../utils/types';
import { mapProperties } from '../utils/collections';

export const CURRENT_APPDOM_VERSION = 2;

export const RESERVED_NODE_PROPERTIES = [
  'id',
  'type',
  'parentId',
  'parentProp',
  'parentIndex',
  'name',
] as const;
export type ReservedNodeProperty = typeof RESERVED_NODE_PROPERTIES[number];

export function createFractionalIndex(index1: string | null, index2: string | null) {
  return generateKeyBetween(index1, index2);
}

// Compares two strings lexicographically
export function compareFractionalIndex(index1: string, index2: string): number {
  if (index1 === index2) {
    return 0;
  }
  return index1 > index2 ? 1 : -1;
}

type AppDomNodeType =
  | 'app'
  | 'connection'
  | 'theme'
  | 'page'
  | 'element'
  | 'codeComponent'
  | 'query'
  | 'mutation';

interface AppDomNodeBase {
  readonly id: NodeId;
  readonly type: AppDomNodeType;
  readonly name: string;
  readonly parentId: NodeId | null;
  readonly parentProp: string | null;
  readonly parentIndex: string | null;
  readonly attributes: {};
}

export interface AppNode extends AppDomNodeBase {
  readonly type: 'app';
  readonly parentId: null;
}

export interface ThemeNode extends AppDomNodeBase {
  readonly type: 'theme';
  readonly theme?: BindableAttrValues<AppTheme>;
}

export interface ConnectionNode<P = unknown> extends AppDomNodeBase {
  readonly type: 'connection';
  readonly attributes: {
    readonly dataSource: ConstantAttrValue<string>;
    readonly params: SecretAttrValue<P | null>;
    readonly status: ConstantAttrValue<ConnectionStatus | null>;
  };
}

export interface PageNode extends AppDomNodeBase {
  readonly type: 'page';
  readonly attributes: {
    readonly title: ConstantAttrValue<string>;
    readonly parameters?: ConstantAttrValue<[string, string][]>;
    readonly module?: ConstantAttrValue<string>;
  };
}

export interface ElementNode<P = any> extends AppDomNodeBase {
  readonly type: 'element';
  readonly attributes: {
    readonly component: ConstantAttrValue<string>;
  };
  readonly props?: BindableAttrValues<P>;
  readonly layout?: {
    readonly horizontalAlign?: ConstantAttrValue<BoxProps['justifyContent']>;
    readonly verticalAlign?: ConstantAttrValue<BoxProps['alignItems']>;
    readonly columnSize?: ConstantAttrValue<number>;
  };
}

export interface CodeComponentNode extends AppDomNodeBase {
  readonly type: 'codeComponent';
  readonly attributes: {
    readonly code: ConstantAttrValue<string>;
  };
}

export type FetchMode = 'query' | 'mutation';

/**
 * A DOM query is defined primarily by a server defined part "attributes.query"
 * and a clientside defined part "params". "params" are constructed in the runtime
 * from bound expressions. The resolved object will be sent to the server and combined
 * with the query will be used to collect the data from the backend.
 */
export interface QueryNode<Q = any> extends AppDomNodeBase {
  readonly type: 'query';
  readonly params?: BindableAttrValues;
  readonly attributes: {
    readonly mode?: ConstantAttrValue<FetchMode>;
    readonly dataSource?: ConstantAttrValue<string>;
    readonly connectionId: ConstantAttrValue<NodeReference | null>;
    readonly query: ConstantAttrValue<Q>;
    readonly transform?: ConstantAttrValue<string>;
    readonly transformEnabled?: ConstantAttrValue<boolean>;
    readonly refetchOnWindowFocus?: ConstantAttrValue<boolean>;
    readonly refetchOnReconnect?: ConstantAttrValue<boolean>;
    readonly refetchInterval?: ConstantAttrValue<number>;
    readonly cacheTime?: ConstantAttrValue<number>;
    readonly enabled?: BindableAttrValue<boolean>;
  };
}

/**
 * @deprecated QueryNode can act as a mutation by switching the `mode` attribute to 'mutation'
 */
export interface MutationNode<Q = any> extends AppDomNodeBase {
  readonly type: 'mutation';
  readonly params?: BindableAttrValues;
  readonly attributes: {
    readonly dataSource?: ConstantAttrValue<string>;
    readonly connectionId: ConstantAttrValue<NodeReference | null>;
    readonly query: ConstantAttrValue<Q>;
  };
}

type AppDomNodeOfType<K extends AppDomNodeType> = {
  app: AppNode;
  connection: ConnectionNode;
  theme: ThemeNode;
  page: PageNode;
  element: ElementNode;
  codeComponent: CodeComponentNode;
  query: QueryNode;
  mutation: MutationNode;
}[K];

type AllowedChildren = {
  app: {
    pages: 'page';
    connections: 'connection';
    themes: 'theme';
    codeComponents: 'codeComponent';
  };
  theme: {};
  connection: {};
  page: {
    children: 'element';
    queries: 'query';
    mutations: 'mutation';
  };
  element: {
    [prop: string]: 'element';
  };
  codeComponent: {};
  query: {};
  mutation: {};
};

export type AppDomNode = AppDomNodeOfType<AppDomNodeType>;

type TypeOf<N extends AppDomNode> = N['type'];
type AllowedChildTypesOfType<T extends AppDomNodeType> = AllowedChildren[T];
type AllowedChildTypesOf<N extends AppDomNode> = AllowedChildTypesOfType<TypeOf<N>>;

export type ChildNodesOf<N extends AppDomNode> = {
  [K in keyof AllowedChildTypesOf<N>]: AllowedChildTypesOf<N>[K] extends AppDomNodeType
    ? AppDomNodeOfType<AllowedChildTypesOf<N>[K]>[]
    : never;
};

type CombinedChildrenOfType<T extends AppDomNodeType> =
  AllowedChildren[T][keyof AllowedChildren[T]];

type CombinedAllowedChildren = {
  [K in AppDomNodeType]: CombinedChildrenOfType<K>;
};

type ParentTypeOfType<T extends AppDomNodeType> = {
  [K in AppDomNodeType]: T extends CombinedAllowedChildren[K] ? K : never;
}[AppDomNodeType];
export type ParentOf<N extends AppDomNode> = AppDomNodeOfType<ParentTypeOfType<TypeOf<N>>> | null;

export type ParentPropOf<Child extends AppDomNode, Parent extends AppDomNode> = {
  [K in keyof AllowedChildren[TypeOf<Parent>]]: TypeOf<Child> extends AllowedChildren[TypeOf<Parent>][K]
    ? K & string
    : never;
}[keyof AllowedChildren[TypeOf<Parent>]];

export type AppDomNodes = Record<NodeId, AppDomNode>;

export interface AppDom {
  nodes: AppDomNodes;
  root: NodeId;
  version?: number;
}

function isType<T extends AppDomNode>(node: AppDomNode, type: T['type']): node is T {
  return node.type === type;
}

function assertIsType<T extends AppDomNode>(node: AppDomNode, type: T['type']): asserts node is T {
  invariant(isType(node, type), `Expected node type "${type}" but got "${node.type}"`);
}

function createId(): NodeId {
  return cuid.slug() as NodeId;
}

export function createConst<V>(value: V): ConstantAttrValue<V> {
  return { type: 'const', value };
}

export function createSecret<V>(value: V): SecretAttrValue<V> {
  return { type: 'secret', value };
}

export function getMaybeNode<T extends AppDomNodeType>(
  dom: AppDom,
  nodeId: NodeId,
  type: T,
): AppDomNodeOfType<T> | null;
export function getMaybeNode<T extends AppDomNodeType>(
  dom: AppDom,
  nodeId: NodeId,
  type?: T,
): AppDomNode | null;
export function getMaybeNode<T extends AppDomNodeType>(
  dom: AppDom,
  nodeId: NodeId,
  type?: T,
): AppDomNode | null {
  const node = dom.nodes[nodeId];
  if (!node) {
    return null;
  }
  if (type) {
    assertIsType(node, type);
  }
  return node;
}

export function getNode<T extends AppDomNodeType>(
  dom: AppDom,
  nodeId: NodeId,
  type: T,
): AppDomNodeOfType<T>;
export function getNode<T extends AppDomNodeType>(
  dom: AppDom,
  nodeId: NodeId,
  type?: T,
): AppDomNode;
export function getNode<T extends AppDomNodeType>(
  dom: AppDom,
  nodeId: NodeId,
  type?: T,
): AppDomNode {
  const node = getMaybeNode(dom, nodeId, type);
  if (!node) {
    throw new Error(`Node "${nodeId}" not found`);
  }
  return node;
}

export function isApp(node: AppDomNode): node is AppNode {
  return isType<AppNode>(node, 'app');
}

export function assertIsApp(node: AppDomNode): asserts node is AppNode {
  assertIsType<AppNode>(node, 'app');
}

export function isPage(node: AppDomNode): node is PageNode {
  return isType<PageNode>(node, 'page');
}

export function assertIsPage(node: AppDomNode): asserts node is PageNode {
  assertIsType<PageNode>(node, 'page');
}

export function isConnection<P>(node: AppDomNode): node is ConnectionNode<P> {
  return isType<ConnectionNode>(node, 'connection');
}

export function assertIsConnection<P>(node: AppDomNode): asserts node is ConnectionNode<P> {
  assertIsType<ConnectionNode>(node, 'connection');
}

export function isCodeComponent(node: AppDomNode): node is CodeComponentNode {
  return isType<CodeComponentNode>(node, 'codeComponent');
}

export function assertIsCodeComponent(node: AppDomNode): asserts node is CodeComponentNode {
  assertIsType<CodeComponentNode>(node, 'codeComponent');
}

export function isTheme(node: AppDomNode): node is ThemeNode {
  return isType<ThemeNode>(node, 'theme');
}

export function assertIsTheme(node: AppDomNode): asserts node is ThemeNode {
  assertIsType<ThemeNode>(node, 'theme');
}

export function isElement<P>(node: AppDomNode): node is ElementNode<P> {
  return isType<ElementNode>(node, 'element');
}

export function assertIsElement<P>(node: AppDomNode): asserts node is ElementNode<P> {
  assertIsType<ElementNode>(node, 'element');
}

export function isQuery<P>(node: AppDomNode): node is QueryNode<P> {
  return isType<QueryNode>(node, 'query');
}

export function assertIsQuery<P>(node: AppDomNode): asserts node is QueryNode<P> {
  assertIsType<QueryNode>(node, 'query');
}

export function isMutation<P>(node: AppDomNode): node is MutationNode<P> {
  return isType<MutationNode>(node, 'mutation');
}

export function assertIsMutation<P>(node: AppDomNode): asserts node is MutationNode<P> {
  assertIsType<MutationNode>(node, 'mutation');
}

export function getApp(dom: AppDom): AppNode {
  const rootNode = getNode(dom, dom.root);
  assertIsApp(rootNode);
  return rootNode;
}

export type NodeChildren<N extends AppDomNode = any> = ChildNodesOf<N>;

// TODO: memoize the result of this function per dom in a WeakMap
const childrenMemo = new WeakMap<AppDom, Map<NodeId, NodeChildren<any>>>();
export function getChildNodes<N extends AppDomNode>(dom: AppDom, parent: N): NodeChildren<N> {
  let domChildrenMemo = childrenMemo.get(dom);
  if (!domChildrenMemo) {
    domChildrenMemo = new Map();
    childrenMemo.set(dom, domChildrenMemo);
  }

  let result = domChildrenMemo.get(parent.id);
  if (!result) {
    result = {};
    domChildrenMemo.set(parent.id, result);

    const allNodeChildren: AppDomNode[] = Object.values(dom.nodes).filter(
      (node: AppDomNode) => node.parentId === parent.id,
    );

    for (const child of allNodeChildren) {
      const prop = child.parentProp || 'children';
      let existing = result[prop];
      if (!existing) {
        existing = [];
        result[prop] = existing;
      }
      existing.push(child);
    }

    for (const childArray of Object.values(result)) {
      childArray?.sort((node1: AppDomNode, node2: AppDomNode) => {
        invariant(
          node1.parentIndex && node2.parentIndex,
          `Nodes inside the dom should have a parentIndex if they have a parent`,
        );
        return compareFractionalIndex(node1.parentIndex, node2.parentIndex);
      });
    }
  }

  return result;
}

export function getParent<N extends AppDomNode>(dom: AppDom, child: N): ParentOf<N> {
  if (child.parentId) {
    const parent = getNode(dom, child.parentId);
    return parent as ParentOf<N>;
  }
  return null;
}

function getNodeNames(dom: AppDom): Set<string> {
  return new Set(Object.values(dom.nodes).map(({ name }) => name));
}

type AppDomNodeInitOfType<T extends AppDomNodeType> = Omit<
  AppDomNodeOfType<T>,
  ReservedNodeProperty
> & { name?: string };

function createNodeInternal<T extends AppDomNodeType>(
  id: NodeId,
  type: T,
  init: AppDomNodeInitOfType<T> & { name: string },
): AppDomNodeOfType<T> {
  return {
    ...init,
    id,
    type,
    parentId: null,
    parentProp: null,
    parentIndex: null,
  } as AppDomNodeOfType<T>;
}

export function validateNodeName(input: string, identifier = 'input'): string | null {
  const firstLetter = input[0];
  if (!/[a-z_]/i.test(firstLetter)) {
    return `${identifier} may not start with a "${firstLetter}"`;
  }

  const match = /([^a-z0-9_])/i.exec(input);

  if (match) {
    const invalidCharacter = match[1];
    if (/\s/.test(invalidCharacter)) {
      return `${identifier} may not contain spaces`;
    }

    return `${identifier} may not contain a "${invalidCharacter}"`;
  }

  return null;
}

export function slugifyNodeName(dom: AppDom, nameCandidate: string, fallback: string): string {
  let slug = nameCandidate;
  slug = slug.trim();
  // try to replace accents with relevant ascii
  slug = removeDiacritics(slug);
  // replace spaces with camelcase
  slug = camelCase(...slug.split(/\s+/));
  // replace disallowed characters for js identifiers
  slug = slug.replace(/[^a-zA-Z0-9]+/g, '_');
  // remove leading digits
  slug = slug.replace(/^\d+/g, '');
  if (!slug) {
    slug = fallback;
  }
  const existingNames = getNodeNames(dom);
  return generateUniqueString(slug, existingNames);
}

export function createNode<T extends AppDomNodeType>(
  dom: AppDom,
  type: T,
  init: AppDomNodeInitOfType<T>,
): AppDomNodeOfType<T> {
  const id = createId();
  const name = slugifyNodeName(dom, init.name || type, type);
  return createNodeInternal(id, type, {
    ...init,
    name,
  });
}

export function createDom(): AppDom {
  const rootId = createId();
  return {
    nodes: {
      [rootId]: createNodeInternal(rootId, 'app', {
        name: 'Application',
        attributes: {},
      }),
    },
    root: rootId,
    version: CURRENT_APPDOM_VERSION,
  };
}

/**
 * Creates a new DOM node representing a React Element
 */
export function createElement<P>(
  dom: AppDom,
  component: string,
  props: Partial<BindableAttrValues<P>> = {},
  layout: Partial<BindableAttrValues<P>> = {},
  name?: string,
): ElementNode {
  return createNode(dom, 'element', {
    name: name || component,
    props,
    attributes: {
      component: createConst(component),
    },
    layout,
  });
}

/**
 * Get all descendants of a `node`, flattens childNodes objects into one single array
 */
export function getDescendants(dom: AppDom, node: AppDomNode): readonly AppDomNode[] {
  const children: readonly AppDomNode[] = Object.values(getChildNodes(dom, node))
    .flat()
    .filter(Boolean);
  return [...children, ...children.flatMap((child) => getDescendants(dom, child))];
}

/**
 * Get all siblings of a `node`
 */
export function getSiblings(dom: AppDom, node: AppDomNode): readonly AppDomNode[] {
  return Object.values(dom.nodes).filter(
    (sibling) =>
      sibling.parentId === node.parentId &&
      sibling.parentProp === node.parentProp &&
      sibling.id !== node.id,
  );
}

export function getAncestors(dom: AppDom, node: AppDomNode): readonly AppDomNode[] {
  const parent = getParent(dom, node);
  return parent ? [...getAncestors(dom, parent), parent] : [];
}

/**
 * Get all the ancestors of the `node` up until the first PageNode node is encountered
 */
export function getPageAncestors(
  dom: AppDom,
  node: AppDomNode,
): readonly (ElementNode | PageNode)[] {
  const parent = getParent(dom, node);
  return parent && (isElement(parent) || isPage(parent))
    ? [...getPageAncestors(dom, parent), parent]
    : [];
}

/**
 * Get the first PageNode node up in the DOM tree starting from `node`
 */
export function getPageAncestor(dom: AppDom, node: AppDomNode): PageNode | null {
  if (isPage(node)) {
    return node;
  }
  const parent = getParent(dom, node);
  if (parent) {
    return getPageAncestor(dom, parent);
  }
  return null;
}
export function setNodeName(dom: AppDom, node: AppDomNode, name: string): AppDom {
  if (dom.nodes[node.id].name === name) {
    return dom;
  }
  return update(dom, {
    nodes: update(dom.nodes, {
      [node.id]: {
        ...node,
        name: slugifyNodeName(dom, name, node.type),
      },
    }),
  });
}

export type PropNamespaces<N extends AppDomNode> = {
  [K in keyof N]: N[K] extends BindableAttrValues<any> | undefined ? K : never;
}[keyof N & string];

export type BindableProps<T> = {
  [K in keyof T]: T[K] extends BindableAttrValue<any> ? K : never;
}[keyof T & string];

export function setNodeProp<Node extends AppDomNode, Prop extends BindableProps<Node>>(
  dom: AppDom,
  node: Node,
  prop: Prop,
  value: Node[Prop] | null,
): AppDom {
  if (value) {
    return update(dom, {
      nodes: update(dom.nodes, {
        [node.id]: update(node, {
          [prop]: value,
        } as any) as Partial<Node>,
      } as Partial<AppDomNodes>),
    });
  }

  return update(dom, {
    nodes: update(dom.nodes, {
      [node.id]: omit(node, prop) as Partial<Node>,
    } as Partial<AppDomNodes>),
  });
}

function setNamespacedProp<
  Node extends AppDomNode,
  Namespace extends PropNamespaces<Node>,
  Prop extends keyof Node[Namespace] & string,
>(node: Node, namespace: Namespace, prop: Prop, value: Node[Namespace][Prop] | null): Node {
  if (value) {
    return update(node, {
      [namespace]: updateOrCreate((node as Node)[namespace], {
        [prop]: value,
      } as any) as Partial<Node[Namespace]>,
    } as Partial<Node>);
  }
  return update(node, {
    [namespace]: omit(node[namespace], prop) as Partial<Node[Namespace]>,
  } as Partial<Node>);
}

export function setNodeNamespacedProp<
  Node extends AppDomNode,
  Namespace extends PropNamespaces<Node>,
  Prop extends keyof Node[Namespace] & string,
>(
  dom: AppDom,
  node: Node,
  namespace: Namespace,
  prop: Prop,
  value: Node[Namespace][Prop] | null,
): AppDom {
  if (value) {
    return update(dom, {
      nodes: update(dom.nodes, {
        [node.id]: update(dom.nodes[node.id], {
          [namespace]: updateOrCreate((dom.nodes[node.id] as Node)[namespace], {
            [prop]: value,
          } as any) as Partial<Node[Namespace]>,
        } as Partial<Node>),
      }),
    });
  }
  return update(dom, {
    nodes: update(dom.nodes, {
      [node.id]: update(node, {
        [namespace]: omit(node[namespace], prop) as Partial<Node[Namespace]>,
      } as Partial<Node>),
    }),
  });
}

export function setNodeNamespace<Node extends AppDomNode, Namespace extends PropNamespaces<Node>>(
  dom: AppDom,
  node: Node,
  namespace: Namespace,
  value: Node[Namespace] | null,
): AppDom {
  return update(dom, {
    nodes: update(dom.nodes, {
      [node.id]: update(node, {
        [namespace]: value ? (value as Partial<Node[Namespace]>) : {},
      } as Partial<Node>),
    }),
  });
}

function setNodeParent<N extends AppDomNode>(
  dom: AppDom,
  node: N,
  parentId: NodeId,
  parentProp: string,
  parentIndex?: string,
) {
  if (!parentIndex) {
    const parent = getNode(dom, parentId);

    const children: readonly AppDomNode[] = (getChildNodes(dom, parent) as any)[parentProp] ?? [];
    const lastIndex = children.length > 0 ? children[children.length - 1].parentIndex : null;
    parentIndex = createFractionalIndex(lastIndex, null);
  }

  return update(dom, {
    nodes: update(dom.nodes, {
      [node.id]: update(node as AppDomNode, {
        parentId,
        parentProp,
        parentIndex,
      }),
    }),
  });
}

export function addNode<Parent extends AppDomNode, Child extends AppDomNode>(
  dom: AppDom,
  newNode: Child,
  parent: Parent,
  parentProp: ParentPropOf<Child, Parent>,
  parentIndex?: string,
): AppDom {
  if (newNode.parentId) {
    throw new Error(`Node "${newNode.id}" is already attached to a parent`);
  }

  return setNodeParent(dom, newNode, parent.id, parentProp, parentIndex);
}

export function moveNode<Parent extends AppDomNode, Child extends AppDomNode>(
  dom: AppDom,
  node: Child,
  parent: Parent,
  parentProp: ParentPropOf<Child, Parent>,
  parentIndex?: string,
) {
  return setNodeParent(dom, node, parent.id, parentProp, parentIndex);
}

export function saveNode(dom: AppDom, node: AppDomNode) {
  return update(dom, {
    nodes: update(dom.nodes, {
      [node.id]: update(dom.nodes[node.id], omit(node, ...RESERVED_NODE_PROPERTIES)),
    }),
  });
}

export function removeNode(dom: AppDom, nodeId: NodeId) {
  const node = getNode(dom, nodeId);
  const parent = getParent(dom, node);

  invariant(parent, `Node: "${node.id}" can't be removed`);

  const descendantIds = getDescendants(dom, node).map(({ id }) => id);

  return update(dom, {
    nodes: omit(dom.nodes, node.id, ...descendantIds),
  });
}

export function toConstPropValue<T = any>(value: T): ConstantAttrValue<T> {
  return { type: 'const', value };
}

export function fromConstPropValue(prop: undefined): undefined;
export function fromConstPropValue<T>(prop: BindableAttrValue<T>): T;
export function fromConstPropValue<T>(prop?: BindableAttrValue<T | undefined>): T | undefined;
export function fromConstPropValue<T>(prop?: BindableAttrValue<T | undefined>): T | undefined {
  if (!prop) {
    return undefined;
  }
  if (prop.type !== 'const') {
    throw new Error(`trying to unbox a non-constant prop value`);
  }
  return prop.value;
}

export function fromConstPropValues<P>(props: BindableAttrValues<P>): Partial<P> {
  const result: Partial<P> = {};
  (Object.entries(props) as ExactEntriesOf<BindableAttrValues<P>>).forEach(([name, prop]) => {
    if (prop) {
      result[name] = fromConstPropValue<P[typeof name]>(prop);
    }
  });
  return result;
}

const nodeByNameCache = new WeakMap<AppDom, Map<string, NodeId>>();
function getNodeIdByNameIndex(dom: AppDom): Map<string, NodeId> {
  let cached = nodeByNameCache.get(dom);
  if (!cached) {
    cached = new Map(Array.from(Object.values(dom.nodes), (node) => [node.name, node.id]));
    nodeByNameCache.set(dom, cached);
  }
  return cached;
}

export function getNodeIdByName(dom: AppDom, name: string): NodeId | null {
  const index = getNodeIdByNameIndex(dom);
  return index.get(name) ?? null;
}

export function getNodeFirstChild(dom: AppDom, node: ElementNode | PageNode, parentProp: string) {
  const nodeChildren = (getChildNodes(dom, node) as NodeChildren<ElementNode>)[parentProp] || [];
  return nodeChildren.length > 0 ? nodeChildren[0] : null;
}

export function getNodeLastChild(dom: AppDom, node: ElementNode | PageNode, parentProp: string) {
  const nodeChildren = (getChildNodes(dom, node) as NodeChildren<ElementNode>)[parentProp] || [];
  return nodeChildren.length > 0 ? nodeChildren[nodeChildren.length - 1] : null;
}

export function getSiblingBeforeNode(
  dom: AppDom,
  node: ElementNode | PageNode,
  parentProp: string,
) {
  const parent = getParent(dom, node);

  invariant(parent, `Node: "${node.id}" has no parent`);

  const parentChildren =
    ((isPage(parent) || isElement(parent)) &&
      (getChildNodes(dom, parent) as NodeChildren<ElementNode>)[parentProp]) ||
    [];

  const nodeIndex = parentChildren.findIndex((child) => child.id === node.id);
  const nodeBefore = nodeIndex > 0 ? parentChildren[nodeIndex - 1] : null;

  return nodeBefore;
}

export function getSiblingAfterNode(dom: AppDom, node: ElementNode | PageNode, parentProp: string) {
  const parent = getParent(dom, node);

  invariant(parent, `Node: "${node.id}" has no parent`);

  const parentChildren =
    ((isPage(parent) || isElement(parent)) &&
      (getChildNodes(dom, parent) as NodeChildren<ElementNode>)[parentProp]) ||
    [];

  const nodeIndex = parentChildren.findIndex((child) => child.id === node.id);
  const nodeAfter = nodeIndex < parentChildren.length - 1 ? parentChildren[nodeIndex + 1] : null;

  return nodeAfter;
}

export function getNewFirstParentIndexInNode(
  dom: AppDom,
  node: ElementNode | PageNode,
  parentProp: string,
) {
  const firstChild = getNodeFirstChild(dom, node, parentProp);
  return createFractionalIndex(null, firstChild?.parentIndex || null);
}

export function getNewLastParentIndexInNode(
  dom: AppDom,
  node: ElementNode | PageNode,
  parentProp: string,
) {
  const lastChild = getNodeLastChild(dom, node, parentProp);
  return createFractionalIndex(lastChild?.parentIndex || null, null);
}

export function getNewParentIndexBeforeNode(
  dom: AppDom,
  node: ElementNode | PageNode,
  parentProp: string,
) {
  const nodeBefore = getSiblingBeforeNode(dom, node, parentProp);
  return createFractionalIndex(nodeBefore?.parentIndex || null, node.parentIndex);
}

export function getNewParentIndexAfterNode(
  dom: AppDom,
  node: ElementNode | PageNode,
  parentProp: string,
) {
  const nodeAfter = getSiblingAfterNode(dom, node, parentProp);
  return createFractionalIndex(node.parentIndex, nodeAfter?.parentIndex || null);
}

export function duplicateNode<Parent extends AppDomNode, Child extends ElementNode>(
  dom: AppDom,
  node: Child,
  parent?: Parent,
) {
  if (!node.parentId || !node.parentProp || !node.parentIndex) {
    throw new Error(`Node: "${node.id}" can't be duplicated`);
  }

  const { children } = getChildNodes(dom, node);

  const newNode = createElement(dom, node.attributes.component!.value, node.props, node.layout);

  let updatedDom = dom;

  children?.forEach((childNode) => {
    updatedDom = duplicateNode(updatedDom, childNode, newNode);
  });

  if (parent) {
    return setNodeParent(updatedDom, newNode, parent.id, node.parentProp, node.parentIndex);
  }

  const newParentIndex = getNewParentIndexAfterNode(updatedDom, node, node.parentProp);

  return setNodeParent(updatedDom, newNode, node.parentId, node.parentProp, newParentIndex);
}

const RENDERTREE_NODES = [
  'app',
  'page',
  'element',
  'query',
  'mutation',
  'theme',
  'codeComponent',
] as const;

export type RenderTreeNodeType = typeof RENDERTREE_NODES[number];
export type RenderTreeNode = { [K in RenderTreeNodeType]: AppDomNodeOfType<K> }[RenderTreeNodeType];
export type RenderTreeNodes = Record<NodeId, RenderTreeNode>;

export interface RenderTree {
  root: NodeId;
  nodes: RenderTreeNodes;
  version?: number;
}

const frontendNodes = new Set<string>(RENDERTREE_NODES);
function createRenderTreeNode(node: AppDomNode): RenderTreeNode | null {
  if (!frontendNodes.has(node.type)) {
    return null;
  }

  if (isQuery(node) || isMutation(node)) {
    node = setNamespacedProp(node, 'attributes', 'query', null);
  }

  return node as RenderTreeNode;
}

/**
 * We need to make sure no secrets end up in the frontend html, so let's only send the
 * nodes that we need to build frontend, and that we know don't contain secrets.
 * TODO: Would it make sense to create a separate datastructure that represents the render tree?
 */
export function createRenderTree(dom: AppDom): RenderTree {
  return {
    ...dom,
    nodes: mapProperties(dom.nodes, ([id, node]) => {
      const rendernode = createRenderTreeNode(node);
      return rendernode ? [id, rendernode] : null;
    }),
  };
}

export function ref(nodeId: NodeId): NodeReference;
export function ref(nodeId: null | undefined): null;
export function ref(nodeId: Maybe<NodeId>): NodeReference | null;
export function ref(nodeId: Maybe<NodeId>): NodeReference | null {
  return nodeId ? { $$ref: nodeId } : null;
}

export function deref(nodeRef: NodeReference): NodeId;
export function deref(nodeRef: null | undefined): null;
export function deref(nodeRef: Maybe<NodeReference>): NodeId | null;
export function deref(nodeRef: Maybe<NodeReference>): NodeId | null {
  if (nodeRef) {
    return nodeRef.$$ref;
  }
  return null;
}
