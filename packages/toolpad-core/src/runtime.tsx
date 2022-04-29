import * as React from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import { RUNTIME_PROP_NODE_ID, RUNTIME_PROP_SLOTS } from './constants.js';
import type {
  SlotType,
  ComponentConfig,
  RuntimeEvent,
  ArgTypeDefinition,
  BindableAttrValue,
  LiveBinding,
  RuntimeError,
} from './types';

declare global {
  interface Window {
    __TOOLPAD_RUNTIME_EVENT__?: RuntimeEvent[] | ((event: RuntimeEvent) => void);
  }
}

export const NodeRuntimeContext = React.createContext<string | null>(null);

// NOTE: These props aren't used, they are only there to transfer information from the
// React elements to the fibers.
interface SlotsWrapperProps {
  children?: React.ReactNode;
  // eslint-disable-next-line react/no-unused-prop-types
  [RUNTIME_PROP_SLOTS]: string;
  // eslint-disable-next-line react/no-unused-prop-types
  slotType: SlotType;
  // eslint-disable-next-line react/no-unused-prop-types
  parentId: string;
}

function SlotsWrapper({ children }: SlotsWrapperProps) {
  return <React.Fragment>{children}</React.Fragment>;
}

interface PlaceholderWrapperProps {
  // eslint-disable-next-line react/no-unused-prop-types
  [RUNTIME_PROP_SLOTS]: string;
  // eslint-disable-next-line react/no-unused-prop-types
  parentId: string;
}

// We want typescript to enforce these props, even when they're not used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PlaceholderWrapper(props: PlaceholderWrapperProps) {
  return (
    <div
      style={{
        display: 'block',
        minHeight: 40,
        minWidth: 200,
      }}
    />
  );
}

export interface NodeRuntimeWrapperProps {
  children: React.ReactElement;
  nodeId: string;
  componentConfig: ComponentConfig<unknown>;
}

interface NodeRuntimeWrapperState {
  error: RuntimeError | null;
}

export interface NodeFiberHostProps {
  children: React.ReactElement;
  [RUNTIME_PROP_NODE_ID]: string;
  componentConfig: ComponentConfig<unknown>;
  nodeError?: RuntimeError | null;
}

// We will use [RUNTIME_PROP_NODE_ID] while walking the fibers to detect React Elements that
// represent AppDomNodes. We use a wrapper to ensure only one element exists in the React tree
// that has [RUNTIME_PROP_NODE_ID] property with this nodeId (We could clone the child and add
// the prop, but the child may be spreading its props to other elements). We also don't want this
// property to end up on DOM nodes.
// IMPORTANT! This node must directly wrap the React Element for the AppDomNode
function NodeFiberHost({ children }: NodeFiberHostProps) {
  return children;
}

export class NodeRuntimeWrapper extends React.Component<
  NodeRuntimeWrapperProps,
  NodeRuntimeWrapperState
> {
  state: NodeRuntimeWrapperState;

  constructor(props: NodeRuntimeWrapperProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): NodeRuntimeWrapperState {
    return { error: { message: error.message, stack: error.stack } };
  }

  render() {
    return (
      <NodeRuntimeContext.Provider value={this.props.nodeId}>
        <NodeFiberHost
          {...{
            [RUNTIME_PROP_NODE_ID]: this.props.nodeId,
            nodeError: this.state.error,
            componentConfig: this.props.componentConfig,
          }}
        >
          {this.state.error ? (
            <span
              style={{
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: 8,
                background: 'red',
                color: 'white',
              }}
            >
              <ErrorIcon color="inherit" style={{ marginRight: 8 }} /> Error
            </span>
          ) : (
            this.props.children
          )}
        </NodeFiberHost>
      </NodeRuntimeContext.Provider>
    );
  }
}

export interface NodeRuntime<P> {
  setProp: <K extends keyof P & string>(key: K, value: React.SetStateAction<P[K]>) => void;
}

export function fireEvent(event: RuntimeEvent) {
  // eslint-disable-next-line no-underscore-dangle
  if (!window.__TOOLPAD_RUNTIME_EVENT__) {
    // eslint-disable-next-line no-underscore-dangle
    window.__TOOLPAD_RUNTIME_EVENT__ = [] as RuntimeEvent[];
  }
  // eslint-disable-next-line no-underscore-dangle
  if (typeof window.__TOOLPAD_RUNTIME_EVENT__ === 'function') {
    // eslint-disable-next-line no-underscore-dangle
    window.__TOOLPAD_RUNTIME_EVENT__(event);
  } else {
    // eslint-disable-next-line no-underscore-dangle
    window.__TOOLPAD_RUNTIME_EVENT__.push(event);
  }
}

export function useNode<P = {}>(): NodeRuntime<P> | null {
  const nodeId = React.useContext(NodeRuntimeContext);

  return React.useMemo(() => {
    if (!nodeId) {
      return null;
    }
    return {
      setProp: (prop, value) => {
        fireEvent({
          type: 'propUpdated',
          nodeId,
          prop,
          value,
        });
      },
    };
  }, [nodeId]);
}

export interface PlaceholderProps {
  prop: string;
  children?: React.ReactNode;
}

export function Placeholder({ prop, children }: PlaceholderProps) {
  const nodeId = React.useContext(NodeRuntimeContext);
  if (!nodeId) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  const count = React.Children.count(children);
  return count > 0 ? (
    <React.Fragment>{children}</React.Fragment>
  ) : (
    <PlaceholderWrapper
      parentId={nodeId}
      {...{
        [RUNTIME_PROP_SLOTS]: prop,
        slotType: 'single',
      }}
    />
  );
}

export interface SlotsProps {
  prop: string;
  children?: React.ReactNode;
}

export function Slots({ prop, children }: SlotsProps) {
  const nodeId = React.useContext(NodeRuntimeContext);
  if (!nodeId) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  const count = React.Children.count(children);
  return count > 0 ? (
    <SlotsWrapper
      parentId={nodeId}
      {...{
        [RUNTIME_PROP_SLOTS]: prop,
        slotType: 'multiple',
      }}
    >
      {children}
    </SlotsWrapper>
  ) : (
    <Placeholder prop={prop} />
  );
}

let iframe: HTMLIFrameElement;
function evalCode(code: string, globalScope: Record<string, unknown>) {
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    iframe.style.display = 'none';
    document.documentElement.appendChild(iframe);
  }

  // eslint-disable-next-line no-underscore-dangle
  (iframe.contentWindow as any).__SCOPE = globalScope;
  return (iframe.contentWindow as any).eval(`with (window.__SCOPE) { ${code} }`);
}

export function evaluateBindable<V>(
  bindable: BindableAttrValue<V> | null,
  globalScope: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  argType?: ArgTypeDefinition,
): LiveBinding {
  const execExpression = () => {
    if (bindable?.type === 'jsExpression') {
      return evalCode(bindable?.value, globalScope);
    }

    if (bindable?.type === 'const') {
      return bindable?.value;
    }

    return undefined;
  };

  try {
    const value = execExpression();
    return { value };
  } catch (err) {
    return { error: err as Error };
  }
}

export * from './jsRuntime';
