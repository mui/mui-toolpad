import { ArgTypeDefinition, ArgTypeDefinitions, PropValueTypes } from '@mui/studio-core';
import * as prettier from 'prettier';
import parserBabel from 'prettier/parser-babel';
import Imports from './codeGen/Imports';
import Scope from './codeGen/Scope';
import { getStudioComponent } from './studioComponents';
import * as studioDom from './studioDom';
import {
  NodeId,
  PropExpression,
  RenderContext,
  ResolvedProps,
  StudioComponentDefinition,
  StudioBindable,
  StudioBindables,
} from './types';
import { camelCase } from './utils/strings';
import { ExactEntriesOf } from './utils/types';
import * as bindings from './utils/bindings';
import { getQueryNodeArgTypes } from './studioDataSources/client';

function literalPropExpression(value: any): PropExpression {
  return {
    type: 'expression',
    value: JSON.stringify(value),
  };
}

function argTypesToPropValueTypes(argTypes: ArgTypeDefinitions): PropValueTypes {
  return Object.fromEntries(
    Object.entries(argTypes).flatMap(([propName, argType]) =>
      argType ? [[propName, argType.typeDef]] : [],
    ),
  );
}

function propValueTypesToArgTypesTo(propTypes: PropValueTypes): ArgTypeDefinitions {
  return Object.fromEntries(
    Object.entries(propTypes).flatMap(([propName, typeDef]) =>
      typeDef ? [[propName, { typeDef }]] : [],
    ),
  );
}

export interface RenderPageConfig {
  // whether we're in the context of an editor
  editor: boolean;
  // prettify output
  pretty: boolean;
}

interface ControlledStateHook {
  nodeName: string;
  propName: string;
  stateVar: string;
  setStateVar: string;
  defaultValue?: unknown;
}

interface StateHook {
  type: 'derived' | 'api' | 'fetched';
  nodeId: NodeId;
  nodeName: string;
  stateVar: string;
  setStateVar: string;
}

interface MemoizedConst {
  varName: string;
  value: string;
}

class Context implements RenderContext {
  private dom: studioDom.StudioDom;

  private page: studioDom.StudioPageNode;

  private editor: boolean;

  private imports: Imports;

  private moduleScope: Scope;

  private reactAlias: string = 'undefined';

  private runtimeAlias: string = 'undefined';

  private controlledStateHooks = new Map<string, ControlledStateHook>();

  private pageStateIdentifier = 'undefined';

  private stateHooks = new Map<string, StateHook>();

  private memoizedConsts: MemoizedConst[] = [];

  constructor(
    dom: studioDom.StudioDom,
    page: studioDom.StudioPageNode,
    { editor }: RenderPageConfig,
  ) {
    this.dom = dom;
    this.page = page;
    this.editor = editor;

    this.moduleScope = new Scope(null);

    this.imports = new Imports(this.moduleScope);

    this.reactAlias = this.addImport('react', '*', 'React');

    if (this.editor) {
      this.runtimeAlias = this.addImport('@mui/studio-core/runtime', '*', '__studioRuntime');
    }
  }

  collectAllState() {
    const nodes = studioDom.getDescendants(this.dom, this.page);
    nodes.forEach((node) => {
      if (studioDom.isElement(node)) {
        this.collectControlledStateProps(node);
      } else if (
        studioDom.isDerivedState(node) ||
        studioDom.isQueryState(node) ||
        studioDom.isFetchedState(node)
      ) {
        this.collectStateNode(node);
      }
    });
  }

  collectStateNode(
    node:
      | studioDom.StudioDerivedStateNode
      | studioDom.StudioQueryStateNode
      | studioDom.StudioFetchedStateNode,
  ): StateHook {
    let stateHook = this.stateHooks.get(node.id);
    if (!stateHook) {
      const stateVar = this.moduleScope.createUniqueBinding(node.name);
      const setStateVar = this.moduleScope.createUniqueBinding(camelCase('set', node.name));
      if (studioDom.isDerivedState(node)) {
        stateHook = {
          type: 'derived',
          nodeId: node.id,
          nodeName: node.name,
          stateVar,
          setStateVar,
        };
        this.stateHooks.set(node.id, stateHook);
      } else if (studioDom.isQueryState(node)) {
        stateHook = {
          type: 'api',
          nodeId: node.id,
          nodeName: node.name,
          stateVar,
          setStateVar,
        };
        this.stateHooks.set(node.id, stateHook);
      } else if (studioDom.isFetchedState(node)) {
        stateHook = {
          type: 'fetched',
          nodeId: node.id,
          nodeName: node.name,
          stateVar,
          setStateVar,
        };
        this.stateHooks.set(node.id, stateHook);
      } else {
        throw new Error(`Invariant: Invalid node type "${(node as studioDom.StudioNode).type}"`);
      }
    }
    return stateHook;
  }

  collectControlledStateProp(
    node: studioDom.StudioElementNode,
    propName: string,
  ): ControlledStateHook {
    const nodeId = node.id;
    const nodeName = node.name;
    const stateId = `${nodeId}.${propName}`;

    let stateHook = this.controlledStateHooks.get(stateId);
    if (!stateHook) {
      const component = getStudioComponent(this.dom, node.component);

      const argType = component.argTypes[propName];

      if (!argType) {
        throw new Error(`Can't find argType for "${node.name}.${propName}"`);
      }

      if (!argType.onChangeHandler) {
        throw new Error(`"${node.name}.${propName}" is not a controlled property`);
      }

      const stateVarSuggestion = camelCase(nodeName, propName);
      const stateVar = this.moduleScope.createUniqueBinding(stateVarSuggestion);

      const setStateVarSuggestion = camelCase('set', nodeName, propName);
      const setStateVar = this.moduleScope.createUniqueBinding(setStateVarSuggestion);

      stateHook = {
        nodeName,
        propName,
        stateVar,
        setStateVar,
        defaultValue: argType.defaultValue,
      };
      this.controlledStateHooks.set(stateId, stateHook);
    }

    return stateHook;
  }

  collectControlledStateProps(node: studioDom.StudioElementNode): void {
    const component = getStudioComponent(this.dom, node.component);

    // eslint-disable-next-line no-restricted-syntax
    for (const [propName, argType] of Object.entries(component.argTypes)) {
      if (argType?.onChangeHandler) {
        this.collectControlledStateProp(node, propName);
      }
    }
  }

  wrapExpression(expression: string): string {
    return this.editor
      ? `
        (() => {
          try {
            return eval(${JSON.stringify(expression)});
          } catch (err) {
            // TODO: bring this error to the editor
            console.warn(err);
            return undefined;
          }
        })()
      `
      : expression;
  }

  resolveBindable<P extends studioDom.BindableProps<P>>(
    propValue: StudioBindable<any>,
    argType: ArgTypeDefinition,
  ): PropExpression {
    if (propValue.type === 'const') {
      let value = JSON.stringify(propValue.value);

      if (argType.memoize) {
        const varName = this.moduleScope.createUniqueBinding('memo');
        this.memoizedConsts.push({ varName, value });
        value = varName;
      }

      return {
        type: 'expression',
        value,
      };
    }

    if (propValue.type === 'boundExpression') {
      const parsedExpr = bindings.parse(propValue.value);

      // Resolve each named variable to its resolved variable in code
      const resolvedExpr = bindings.resolve(
        parsedExpr,
        (part) => `${this.pageStateIdentifier}.${part}`,
      );

      const formatted = bindings.formatExpression(resolvedExpr, propValue.format);

      return {
        type: 'expression',
        value: this.wrapExpression(formatted),
      };
    }

    if (propValue.type === 'binding') {
      return {
        type: 'expression',
        value: this.wrapExpression(`${this.pageStateIdentifier}.${propValue.value}`),
      };
    }

    if (propValue.type === 'jsExpression') {
      return {
        type: 'expression',
        value: `((state) => ${this.wrapExpression(propValue.value)})(${this.pageStateIdentifier})`,
      };
    }

    console.warn(`Invariant: Unkown prop type "${(propValue as any).type}"`);
    return {
      type: 'expression',
      value: JSON.stringify(undefined),
    };
  }

  /**
   * Resolves StudioBindables to expressions we can render in the code.
   */
  resolveBindables(bindables: StudioBindables<any>, argTypes: ArgTypeDefinitions): ResolvedProps {
    const result: ResolvedProps = {};

    Object.entries(bindables).forEach(([propName, propValue]) => {
      const argType = argTypes[propName as string];
      if (propValue && argType) {
        const resolved = this.resolveBindable(propValue, argType);
        if (resolved) {
          result[propName] = resolved;
        }
      }
    });

    return result;
  }

  resolveElementProps(node: studioDom.StudioElementNode): ResolvedProps {
    const component = getStudioComponent(this.dom, node.component);

    const result: ResolvedProps = this.resolveBindables(node.props, component.argTypes);

    // useState Hooks
    if (component) {
      Object.entries(component.argTypes).forEach(([propName, argType]) => {
        if (!argType) {
          return;
        }

        const stateId = `${node.id}.${propName}`;
        const hook = this.controlledStateHooks.get(stateId);

        if (!hook) {
          return;
        }

        result[propName] = {
          type: 'expression',
          value: hook.stateVar,
        };

        if (argType.onChangeProp) {
          if (argType.onChangeHandler) {
            // TODO: React.useCallback for this?
            const { params, valueGetter } = argType.onChangeHandler;
            result[argType.onChangeProp] = {
              type: 'expression',
              value: `(${params.join(', ')}) => ${hook.setStateVar}(${valueGetter})`,
            };
          } else {
            result[argType.onChangeProp] = {
              type: 'expression',
              value: hook.setStateVar,
            };
          }
        }
      });
    }

    // Default values
    if (component) {
      Object.entries(component.argTypes).forEach(([propName, argType]) => {
        if (argType && argType.defaultValue !== undefined && !result[propName]) {
          const defaultPropName = argType.defaultValueProp ?? propName;
          result[defaultPropName] = {
            type: 'expression',
            value: JSON.stringify(argType.defaultValue),
          };
        }
      });
    }

    return result;
  }

  renderComponentChildren(
    component: StudioComponentDefinition,
    renderableNodeChildren: { [key: string]: studioDom.StudioElementNode<any>[] },
  ): ResolvedProps {
    const result: ResolvedProps = {};

    // eslint-disable-next-line no-restricted-syntax
    for (const [prop, children] of Object.entries(renderableNodeChildren)) {
      if (children) {
        if (children.length === 1) {
          result[prop] = this.renderElement(children[0]);
        } else if (children.length > 1) {
          result[prop] = {
            type: 'jsxFragment',
            value: children
              .map((child): string => this.renderJsxContent(this.renderElement(child)))
              .join('\n'),
          };
        }
      }
    }

    if (this.editor && component) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [prop, argType] of Object.entries(component.argTypes)) {
        if (argType?.typeDef.type === 'element') {
          if (argType.control?.type === 'slots') {
            const existingProp = result[prop];

            result[prop] = {
              type: 'jsxElement',
              value: `
                <${this.runtimeAlias}.Slots prop=${JSON.stringify(prop)}>
                  ${existingProp ? this.renderJsxContent(existingProp) : ''}
                </${this.runtimeAlias}.Slots>
              `,
            };
          } else if (argType.control?.type === 'slot') {
            const existingProp = result[prop];

            result[prop] = {
              type: 'jsxElement',
              value: `
                <${this.runtimeAlias}.Placeholder prop=${JSON.stringify(prop)}>
                  ${existingProp ? this.renderJsxContent(existingProp) : ''}
                </${this.runtimeAlias}.Placeholder>
              `,
            };
          }
        }
      }
    }

    return result;
  }

  renderComponent(
    node: studioDom.StudioNode,
    component: StudioComponentDefinition,
    resolvedProps: ResolvedProps,
    resolvedChildren: ResolvedProps,
  ): PropExpression {
    const rendered = component.render(this, {
      ...resolvedProps,
      ...resolvedChildren,
    });

    return {
      type: 'jsxElement',
      value: this.editor
        ? `
          <${this.runtimeAlias}.RuntimeStudioNode nodeId="${node.id}">
            ${rendered}
          </${this.runtimeAlias}.RuntimeStudioNode>
        `
        : rendered,
    };
  }

  renderElement(node: studioDom.StudioElementNode): PropExpression {
    const component = getStudioComponent(this.dom, node.component);

    const resolvedProps = studioDom.isElement(node) ? this.resolveElementProps(node) : {};
    const resolvedChildren = this.renderComponentChildren(
      component,
      studioDom.getChildNodes(this.dom, node),
    );

    return this.renderComponent(node, component, resolvedProps, resolvedChildren);
  }

  /**
   * Renders a node to a string that can be inlined as the return value of a React component
   * @example
   * `function Hello () {
   *   return ${RESULT};
   * }`
   */
  renderRoot(node: studioDom.StudioPageNode): string {
    const component = getStudioComponent(this.dom, 'Page');
    const { children } = studioDom.getChildNodes(this.dom, node);
    const resolvedChildren = this.renderComponentChildren(component, { children });
    const expr = this.renderComponent(node, component, {}, resolvedChildren);
    return this.renderJsExpression(expr);
  }

  /**
   * Renders resolved properties to a string that can be inlined as JSX attrinutes
   * @example `<Hello ${RESULT} />`
   */
  renderProps(resolvedProps: ResolvedProps): string {
    return (Object.entries(resolvedProps) as ExactEntriesOf<ResolvedProps>)
      .map(([name, expr]) => {
        if (!expr) {
          return '';
        }
        return `${name}={${this.renderJsExpression(expr)}}`;
      })
      .join(' ');
  }

  /**
   * Renders resolved properties to a string that can be inlined as a JS object
   * @example
   *     `const hello = ${RESULT}`;
   *     // "const hello = { foo: 'bar' }"
   */
  renderPropsAsObject(resolvedProps: ResolvedProps): string {
    const keyValuePairs = (Object.entries(resolvedProps) as ExactEntriesOf<ResolvedProps>).map(
      ([name, expr]) => {
        if (!expr) {
          return '';
        }
        return `${name}: ${this.renderJsExpression(expr)}`;
      },
    );
    return `{${keyValuePairs.join(', ')}}`;
  }

  /**
   * Renders an expression to a string that can be used as a javascript
   * expression. e.g. as the RHS of an assignment statement
   * @example `const hello = ${RESULT}`
   */
  // eslint-disable-next-line class-methods-use-this
  renderJsExpression(expr?: PropExpression): string {
    if (!expr) {
      return 'undefined';
    }
    if (expr.type === 'jsxFragment') {
      return `<>${expr.value}</>`;
    }
    return expr.value;
  }

  /**
   * Renders an expression to a string that can be inlined as children in
   * a JSX element.
   * @example `<Hello>${RESULT}</Hello>`
   */
  renderJsxContent(expr?: PropExpression): string {
    if (!expr) {
      return '';
    }
    if (expr.type === 'jsxElement' || expr.type === 'jsxFragment') {
      return expr.value;
    }
    return `{${this.renderJsExpression(expr)}}`;
  }

  /**
   * Adds an import to the page module. Returns an identifier that's based on [suggestedName] that can
   * be used to reference the import.
   */
  addImport(
    source: string,
    imported: '*' | 'default' | string,
    suggestedName: string = imported,
  ): string {
    return this.imports.add(source, imported, suggestedName);
  }

  renderControlledStateHooks(): string {
    return Array.from(this.controlledStateHooks.values(), (stateHook) => {
      const defaultValue = JSON.stringify(stateHook.defaultValue);
      return `const [${stateHook.stateVar}, ${stateHook.setStateVar}] = ${this.reactAlias}.useState(${defaultValue});`;
    }).join('\n');
  }

  renderDataQueryState(): string {
    return Array.from(this.stateHooks.values(), (hook) => {
      const INITIAL_DATA_QUERY = this.addImport(
        '@mui/studio-core',
        'INITIAL_DATA_QUERY',
        'INITIAL_DATA_QUERY',
      );
      return `const [${hook.stateVar}, ${hook.setStateVar}] = React.useState(${INITIAL_DATA_QUERY});`;
    }).join('\n');
  }

  renderStateHooks(): string {
    return Array.from(this.stateHooks.values(), (stateHook) => {
      switch (stateHook.type) {
        case 'derived': {
          const node = studioDom.getNode(this.dom, stateHook.nodeId, 'derivedState');
          const resolvedParams = this.resolveBindables(
            node.params,
            propValueTypesToArgTypesTo(node.argTypes),
          );
          const paramsArg = this.renderPropsAsObject(resolvedParams);
          const depsArray = Object.values(resolvedParams).map((resolvedProp) =>
            this.renderJsExpression(resolvedProp),
          );
          const derivedStateGetter = this.addImport(
            `../derivedState/${node.id}.ts`,
            'default',
            node.name,
          );
          return `const ${
            stateHook.stateVar
          } = React.useMemo(() => ${derivedStateGetter}(${paramsArg}), [${depsArray.join(', ')}])`;
        }
        case 'api': {
          const node = studioDom.getNode(this.dom, stateHook.nodeId, 'queryState');
          const propTypes = argTypesToPropValueTypes(getQueryNodeArgTypes(this.dom, node));
          const resolvedProps = this.resolveBindables(
            node.params,
            propValueTypesToArgTypesTo(propTypes),
          );
          const params = this.renderPropsAsObject(resolvedProps);

          const useDataQuery = this.addImport('@mui/studio-core', 'useDataQuery', 'useDataQuery');

          return `${useDataQuery}(${stateHook.setStateVar}, ${JSON.stringify(
            node.api,
          )}, ${params});`;
        }
        case 'fetched': {
          const node = studioDom.getNode(this.dom, stateHook.nodeId, 'fetchedState');

          const url = this.resolveBindable(node.url, { typeDef: { type: 'string' } });

          const paramsExpr = this.renderPropsAsObject({
            url,
            collectionPath: literalPropExpression(node.collectionPath),
            fieldPaths: literalPropExpression(node.fieldPaths),
          });

          const useFetchedState = this.addImport(
            '@mui/studio-core',
            'useFetchedState',
            'useFetchedState',
          );

          return `const ${stateHook.stateVar} = ${useFetchedState}(${paramsExpr});`;
        }
        default:
          throw new Error(
            `Invariant: Missing renderer for state hook of type "${(stateHook as StateHook).type}"`,
          );
      }
    }).join('\n');
  }

  renderPageState(): string {
    const stateHookObjects = new Map<string, ResolvedProps>();
    Array.from(this.controlledStateHooks.values()).forEach((hook) => {
      let hookObject = stateHookObjects.get(hook.nodeName);
      if (!hookObject) {
        hookObject = {};
        stateHookObjects.set(hook.nodeName, hookObject);
      }
      hookObject[hook.propName] = { type: 'expression', value: hook.stateVar };
    });

    const renderedControlledStateProps = Array.from(
      stateHookObjects.entries(),
      ([name, properties]) => `${name}: ${this.renderPropsAsObject(properties)}`,
    );

    const renderedStateProps = Array.from(
      this.stateHooks.values(),
      (hook) => `${hook.nodeName}: ${hook.stateVar}`,
    );

    return `{${[...renderedControlledStateProps, ...renderedStateProps].join(',')}}`;
  }

  renderMemoizedConsts(): string {
    console.log(this.memoizedConsts);
    return this.memoizedConsts
      .map(
        ({ varName, value }) =>
          `const ${varName} = ${this.reactAlias}.useMemo(() => (${value}), [])`,
      )
      .join('\n');
  }

  render() {
    this.collectAllState();

    const controlledStateHooks = this.renderControlledStateHooks();
    const dataQueryState = this.renderDataQueryState();

    this.pageStateIdentifier = this.moduleScope.createUniqueBinding('pageState');
    const pageState = this.renderPageState();

    const statehooks = this.renderStateHooks();

    const root: string = this.renderRoot(this.page);

    // TODO: Add seal for memoized consts as well? It needs to run after renderRoot.
    const memoizedConsts = this.renderMemoizedConsts();

    this.imports.seal();

    const imports = this.imports.render();

    return `
      ${imports}

      export default function App () {
        ${controlledStateHooks}
        ${dataQueryState}

        const ${this.pageStateIdentifier} = ${pageState}
        
        ${statehooks}

        ${memoizedConsts}

        ${this.editor ? `${this.runtimeAlias}.useDiagnostics(${this.pageStateIdentifier});` : ''}

        return (
          ${root}
        );
      }
    `;
  }
}

export default function renderPageCode(
  dom: studioDom.StudioDom,
  pageNodeId: NodeId,
  configInit: Partial<RenderPageConfig> = {},
) {
  const config: RenderPageConfig = {
    editor: false,
    pretty: false,
    ...configInit,
  };

  const page = studioDom.getNode(dom, pageNodeId, 'page');

  const ctx = new Context(dom, page, config);
  let code: string = ctx.render();

  if (config.pretty) {
    code = prettier.format(code, {
      parser: 'babel-ts',
      plugins: [parserBabel],
    });
  }

  return { code };
}
