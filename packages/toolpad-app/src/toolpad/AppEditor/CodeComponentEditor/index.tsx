import * as React from 'react';
import { Box, Button, Stack, styled, Toolbar, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import * as ReactDOM from 'react-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { NodeId, createComponent, ToolpadComponent, TOOLPAD_COMPONENT } from '@mui/toolpad-core';
import { useQuery } from 'react-query';
import * as appDom from '../../../appDom';
import { useDom, useDomApi } from '../../DomLoader';
import { tryFormat } from '../../../utils/prettier';
import useShortcut from '../../../utils/useShortcut';
import { usePrompt } from '../../../utils/router';
import NodeNameEditor from '../NodeNameEditor';
import usePageTitle from '../../../utils/usePageTitle';
import useLatest from '../../../utils/useLatest';
import AppThemeProvider from '../../../runtime/AppThemeProvider';
import useCodeComponent from './useCodeComponent';
import { mapValues } from '../../../utils/collections';
import ErrorAlert from '../PageEditor/ErrorAlert';
import lazyComponent from '../../../utils/lazyComponent';
import CenteredSpinner from '../../../components/CenteredSpinner';
import SplitPane from '../../../components/SplitPane';

const TypescriptEditor = lazyComponent(() => import('../../../components/TypescriptEditor'), {
  noSsr: true,
  fallback: <CenteredSpinner />,
});

const Noop = createComponent(() => null);

const CanvasFrame = styled('iframe')({
  border: 'none',
  position: 'absolute',
  width: '100%',
  height: '100%',
});

interface FrameContentProps {
  children: React.ReactElement;
  document: Document;
}

function FrameContent(props: FrameContentProps) {
  const { children, document } = props;

  const cache = React.useMemo(
    () =>
      createCache({
        key: `code-component-sandbox`,
        prepend: true,
        container: document.head,
      }),
    [document],
  );

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}

const EXTRA_LIBS_HTTP_MODULES = [
  {
    content: `declare module "https://*";`,
  },
];

interface CodeComponentEditorContentProps {
  codeComponentNode: appDom.CodeComponentNode;
}

function CodeComponentEditorContent({ codeComponentNode }: CodeComponentEditorContentProps) {
  const domApi = useDomApi();
  const dom = useDom();

  const { data: typings } = useQuery<Record<string, string>>(['/typings.json'], async () => {
    return fetch('/typings.json').then((res) => res.json());
  });

  const extraLibs = React.useMemo(() => {
    if (typings) {
      return [
        ...Object.entries(typings).map(([path, content]) => ({
          content,
          filePath: `file:///${path}`,
        })),
        ...EXTRA_LIBS_HTTP_MODULES,
      ];
    }

    return EXTRA_LIBS_HTTP_MODULES;
  }, [typings]);

  const [input, setInput] = React.useState<string>(codeComponentNode.attributes.code.value);
  React.useEffect(
    () => setInput(codeComponentNode.attributes.code.value),
    [codeComponentNode.attributes.code.value],
  );

  const frameRef = React.useRef<HTMLIFrameElement>(null);

  usePageTitle(`${codeComponentNode.name} | Toolpad editor`);

  const handleSave = React.useCallback(() => {
    const pretty = tryFormat(input);
    setInput(pretty);
    domApi.setNodeNamespacedProp(
      codeComponentNode,
      'attributes',
      'code',
      appDom.createConst(pretty),
    );
  }, [codeComponentNode, domApi, input]);

  const allChangesAreCommitted = codeComponentNode.attributes.code.value === input;

  usePrompt(
    'Your code has unsaved changes. Are you sure you want to navigate away? All changes will be discarded.',
    !allChangesAreCommitted,
  );

  useShortcut({ code: 'KeyS', metaKey: true }, handleSave);

  const [iframeLoaded, onLoad] = React.useReducer(() => true, false);

  React.useEffect(() => {
    const document = frameRef.current?.contentDocument;
    // When we hydrate the iframe then the load event is already dispatched
    // once the iframe markup is parsed (maybe later but the important part is
    // that it happens before React can attach event listeners).
    // We need to check the readyState of the document once the iframe is mounted
    // and "replay" the missed load event.
    // See https://github.com/facebook/react/pull/13862 for ongoing effort in React
    // (though not with iframes in mind).
    if (document?.readyState === 'complete' && !iframeLoaded) {
      onLoad();
    }
  }, [iframeLoaded]);

  const frameDocument = frameRef.current?.contentDocument;

  const { Component: GeneratedComponent, error: compileError } = useCodeComponent(input);

  const CodeComponent: ToolpadComponent<any> = useLatest(GeneratedComponent) || Noop;
  const { argTypes } = CodeComponent[TOOLPAD_COMPONENT];

  const defaultProps = React.useMemo(
    () => mapValues(argTypes, (argType) => argType?.defaultValue),
    [argTypes],
  );

  return (
    <React.Fragment>
      <Stack sx={{ height: '100%' }}>
        <Toolbar sx={{ mt: 2, mb: 2 }}>
          <NodeNameEditor node={codeComponentNode} sx={{ maxWidth: 300 }} />
        </Toolbar>
        <Box flex={1}>
          <SplitPane split="vertical" allowResize size="50%">
            <TypescriptEditor
              value={input}
              onChange={(newValue) => setInput(newValue || '')}
              extraLibs={extraLibs}
            />

            <CanvasFrame ref={frameRef} title="Code component sandbox" onLoad={onLoad} />
          </SplitPane>
        </Box>
        <Toolbar
          sx={{
            justifyContent: 'end',
          }}
        >
          <Button disabled={allChangesAreCommitted} onClick={handleSave} variant="contained">
            Update
          </Button>
        </Toolbar>
      </Stack>
      {iframeLoaded && frameDocument
        ? ReactDOM.createPortal(
            <FrameContent document={frameDocument}>
              <React.Suspense fallback={null}>
                <ErrorBoundary
                  resetKeys={[CodeComponent]}
                  fallbackRender={({ error: runtimeError }) => <ErrorAlert error={runtimeError} />}
                >
                  <AppThemeProvider dom={dom}>
                    <CodeComponent {...defaultProps} />
                  </AppThemeProvider>
                </ErrorBoundary>
                {compileError ? <ErrorAlert error={compileError} /> : null}
              </React.Suspense>
            </FrameContent>,
            frameDocument.body,
          )
        : null}
    </React.Fragment>
  );
}

interface CodeComponentEditorProps {
  appId: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CodeComponentEditor({ appId }: CodeComponentEditorProps) {
  const dom = useDom();
  const { nodeId } = useParams();
  const codeComponentNode = appDom.getMaybeNode(dom, nodeId as NodeId, 'codeComponent');
  return codeComponentNode ? (
    <CodeComponentEditorContent key={nodeId} codeComponentNode={codeComponentNode} />
  ) : (
    <Typography sx={{ p: 4 }}>Non-existing Code Component &quot;{nodeId}&quot;</Typography>
  );
}
