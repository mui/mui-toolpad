import * as React from 'react';
import Editor from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import jsonToTs from 'json-to-ts';
import { styled, SxProps } from '@mui/material';
import { WithControlledProp } from '../../../utils/types';

const JsExpressionEditorRoot = styled('div')(({ theme }) => ({
  border: '1px solid black',
  borderColor: theme.palette.divider,
  borderRadius: theme.shape.borderRadius,
}));

export interface JsExpressionEditorProps extends WithControlledProp<string> {
  globalScope?: Record<string, unknown>;
  disabled?: boolean;
  autoFocus?: boolean;
  functionBody?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  sx?: SxProps;
}

export function JsExpressionEditor({
  value,
  onChange,
  globalScope = {},
  disabled,
  autoFocus,
  functionBody,
  onFocus,
  onBlur,
  sx,
}: JsExpressionEditorProps) {
  const id = React.useId();

  const editorRef = React.useRef<monacoEditor.editor.IStandaloneCodeEditor>();
  const monacoRef = React.useRef<typeof monacoEditor>();

  const libSource = React.useMemo(() => {
    const type = jsonToTs(globalScope);

    const globals = Object.keys(globalScope)
      .map((key) => `declare const ${key}: RootObject[${JSON.stringify(key)}];`)
      .join('\n');

    return `
      ${type.join('\n')}

      ${globals}
    `;
  }, [globalScope]);

  const libSourceDisposable = React.useRef<monacoEditor.IDisposable>();
  const setLibSource = React.useCallback(() => {
    libSourceDisposable.current?.dispose();
    if (monacoRef.current) {
      libSourceDisposable.current =
        monacoRef.current.languages.typescript.typescriptDefaults.addExtraLib(
          libSource,
          'file:///node_modules/@mui/toolpad/index.d.ts',
        );
    }
  }, [libSource]);
  React.useEffect(() => () => libSourceDisposable.current?.dispose(), []);

  React.useEffect(() => setLibSource(), [setLibSource]);

  React.useEffect(() => {
    if (editorRef.current && onFocus) {
      const { dispose } = editorRef.current.onDidFocusEditorText(onFocus);
      return () => dispose();
    }
    return () => {};
  }, [onFocus]);

  React.useEffect(() => {
    if (editorRef.current && onBlur) {
      const { dispose } = editorRef.current.onDidBlurEditorText(onBlur);
      return () => dispose();
    }
    return () => {};
  }, [onBlur]);

  const isMount = React.useRef(true);
  const HandleEditorMount = React.useCallback(
    (editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: typeof monacoEditor) => {
      monacoRef.current = monaco;
      editorRef.current = editor;

      editor.updateOptions({
        minimap: { enabled: false },
        accessibilitySupport: 'off',
        fixedOverflowWidgets: true,
      });

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: 'React',
        allowJs: true,
        typeRoots: ['node_modules/@types'],
      });

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        diagnosticCodesToIgnore: functionBody ? [1108] : [],
      });

      if (isMount && autoFocus && !disabled) {
        editor.focus();
        isMount.current = false;
      }

      setLibSource();
    },
    [setLibSource, autoFocus, disabled, functionBody],
  );

  return (
    <JsExpressionEditorRoot
      sx={{ ...sx, ...(disabled ? { opacity: 0.5, pointerEvents: 'none' } : {}) }}
    >
      <Editor
        height="150px"
        value={value}
        onChange={(code = '') => onChange(code)}
        path={`./expression/${id}.tsx`}
        language="typescript"
        onMount={HandleEditorMount}
        options={{
          readOnly: disabled,
        }}
        theme="vs-dark"
      />
    </JsExpressionEditorRoot>
  );
}
