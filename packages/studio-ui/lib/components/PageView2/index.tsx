import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { styled } from '@mui/material';
import { transform } from 'sucrase';
import {
  StudioPage,
  NodeLayout,
  NodeId,
  CodeGenContext,
  StudioNodeProp,
  StudioNodeProps,
} from '../../types';
import { getNode } from '../../studioPage';
import { getStudioComponent } from '../../studioComponents';

const PageViewRoot = styled('div')({});

export function getNodeLayout(viewElm: HTMLElement, elm: HTMLElement): NodeLayout | null {
  // TODO
  return null;
}

export function getViewCoordinates(
  viewElm: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  // TODO
  return null;
}

const dependencies: {
  [source: string]: (() => Promise<any>) | undefined;
} = {
  react: () => import('react'),
  '@mui/material/Button': () => import('@mui/material/Button'),
  '@mui/x-data-grid': () => import('@mui/x-data-grid'),
  '@mui/material/Container': () => import('@mui/material/Container'),
  '@mui/material/Stack': () => import('@mui/material/Stack'),
  '@mui/material/Paper': () => import('@mui/material/Paper'),
  '@mui/material/TextField': () => import('@mui/material/TextField'),
};

interface Import {
  default: string | null;
  named: { imported: string; local: string }[];
}

class Context implements CodeGenContext {
  private page: StudioPage;

  private imports = new Map<string, Import>([
    [
      'react',
      {
        default: 'React',
        named: [],
      },
    ],
  ]);

  constructor(page: StudioPage) {
    this.page = page;
  }

  renderNode(nodeId: NodeId): string {
    const node = getNode(this.page, nodeId);
    const component = getStudioComponent(node.component);
    return component.render(this, node);
  }

  // eslint-disable-next-line class-methods-use-this
  renderPropValue(nodeId: NodeId, prop: string): unknown {
    const node = getNode(this.page, nodeId);
    const component = getStudioComponent(node.component);
    const propDefinition = component.props[prop];
    const nodeProp = node.props[prop];
    if (propDefinition) {
      if (nodeProp?.type === 'const') {
        return nodeProp.value;
      }
      if (nodeProp?.type === 'binding') {
        return '[[TODO]]';
      }
      return undefined;
    }
    throw new Error(`Unknown prop "${prop}" for component "${node.component}" on node "${nodeId}"`);
  }

  // eslint-disable-next-line class-methods-use-this
  renderProps(nodeId: NodeId, props?: string[]): string {
    const node = getNode(this.page, nodeId);
    const renderedProps = props || Object.keys(node.props);
    return renderedProps
      .map((prop) => {
        return `${prop}={${JSON.stringify(this.renderPropValue(nodeId, prop))}}`;
      })
      .join(' ');
  }

  addImport(source: string, imported: string, local: string = imported) {
    let specifiers = this.imports.get(source);
    if (!specifiers) {
      specifiers = { default: null, named: [] };
      this.imports.set(source, specifiers);
    }
    if (imported === 'default') {
      if (specifiers.default && specifiers.default !== local) {
        throw new Error(`Default import specifier for "${source}" already defined as "${local}"`);
      } else {
        specifiers.default = local;
      }
    } else {
      specifiers.named.push({ imported, local });
    }
  }

  renderImports(): string {
    return Array.from(this.imports.entries(), ([source, specifiers]) => {
      const renderedSpecifiers = [];
      if (specifiers.default) {
        renderedSpecifiers.push(specifiers.default);
      }
      if (specifiers.named.length > 0) {
        const renderedNamedSpecifiers = specifiers.named
          .map((specifier) => {
            return specifier.imported === specifier.local
              ? specifier.imported
              : `${specifier.imported} as ${specifier.local}`;
          })
          .join(',');
        renderedSpecifiers.push(`{ ${renderedNamedSpecifiers} }`);
      }
      return `import ${renderedSpecifiers.join(', ')} from '${source}';`;
    }).join('\n');
  }

  async loadDependencies(): Promise<any> {
    return Object.fromEntries(
      await Promise.all(
        Array.from(this.imports.keys(), async (source) => {
          const loader = dependencies[source];
          if (!loader) {
            throw new Error(`Unsupported module imported "${source}"`);
          }
          return [source, await loader()];
        }),
      ),
    );
  }
}

function renderPage(page: StudioPage) {
  const ctx = new Context(page);
  const root = ctx.renderNode(page.root);

  const code = `
    ${ctx.renderImports()}

    export default function App () {
      return (${root});
    }
  `;

  return { code, loadDependencies: () => ctx.loadDependencies() };
}

export interface PageViewProps {
  className?: string;
  page: StudioPage;
}

export default React.forwardRef(function PageView(
  { className, page }: PageViewProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const renderedPage = React.useMemo(() => {
    return renderPage(page);
  }, [page]);

  React.useEffect(() => {
    if (!containerRef.current) {
      return () => {};
    }
    const container = containerRef.current;

    let canceled = false;
    renderedPage.loadDependencies().then((importedModules) => {
      if (canceled) {
        return;
      }

      console.log(renderedPage.code, importedModules);

      const { code: compiledCode } = transform(renderedPage.code, {
        transforms: ['jsx', 'typescript', 'imports'],
      });

      const run = new Function('require', 'module', 'exports', compiledCode);

      const require = (moduleId: string) => {
        return importedModules[moduleId];
      };
      const mod = {
        exports: {
          default: (() => null) as React.FC,
        },
      };
      run(require, mod, mod.exports);
      const App = mod.exports.default;
      ReactDOM.render(<App />, container);
    });

    return () => {
      canceled = true;
      ReactDOM.unmountComponentAtNode(container);
    };
  }, [renderedPage]);

  return (
    <PageViewRoot ref={ref} className={className}>
      <div ref={containerRef} />
    </PageViewRoot>
  );
});
