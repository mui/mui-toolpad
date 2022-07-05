import * as React from 'react';
import Editor from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { WithControlledProp } from '../utils/types';

interface TsModuleEditorProps extends WithControlledProp<string> {
  path: string;
  extraLibs?: { content: string; filePath?: string }[];
}

export default function TsModuleEditor({ path, extraLibs, value, onChange }: TsModuleEditorProps) {
  const editorRef = React.useRef<monacoEditor.editor.IStandaloneCodeEditor>();
  const monacoRef = React.useRef<typeof monacoEditor>();

  // @monaco-editor/react treats HandleEditorMount as stable. It will call the value that it
  // received on first render. Let's use this ref to store the actual value of extraLibs.
  const extraLibsRef = React.useRef(extraLibs || []);

  const HandleEditorMount = React.useCallback(
    (editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: typeof monacoEditor) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      editor.updateOptions({
        minimap: { enabled: false },
        accessibilitySupport: 'off',
        tabSize: 2,
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

      monacoRef.current?.languages.typescript.typescriptDefaults.setExtraLibs(extraLibsRef.current);

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
    },
    [
      // Don't add dependencies, @monaco-editor/react only uses the first occurence of this function it sees.
    ],
  );

  React.useEffect(() => {
    extraLibsRef.current = extraLibs || [];
    monacoRef.current?.languages.typescript.typescriptDefaults.setExtraLibs(extraLibsRef.current);
  }, [extraLibs]);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const model = editor.getModel();
    if (!model) {
      return;
    }

    const actualValue = model.getValue();

    if (value === actualValue) {
      return;
    }

    // Used to restore cursor position
    const state = editorRef.current?.saveViewState();

    editor.executeEdits(null, [
      {
        range: model.getFullModelRange(),
        text: value,
      },
    ]);

    if (state) {
      editorRef.current?.restoreViewState(state);
    }
  }, [value]);

  const handleChange = React.useCallback((newValue: string = '') => onChange(newValue), [onChange]);

  return (
    <Editor
      height="100%"
      defaultValue={value}
      onChange={handleChange}
      path={path}
      language="typescript"
      onMount={HandleEditorMount}
      theme="vs-dark"
    />
  );
}
