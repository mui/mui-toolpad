import type * as monacoEditor from 'monaco-editor';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import * as React from 'react';
import Editor from '@monaco-editor/react';
import * as JSON5 from 'json5';
import type { EditorProps } from '../../types';
import useShortcut from '../../utils/useShortcut';

function JsonPropEditor({ label, argType, value, onChange, disabled }: EditorProps<any>) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const valueAsString = React.useMemo(() => JSON.stringify(value, null, 2), [value]);
  const [input, setInput] = React.useState(valueAsString);
  React.useEffect(() => setInput(valueAsString), [valueAsString]);

  const normalizedInitial = React.useMemo(() => JSON.stringify(value), [value]);
  const normalizedInput = React.useMemo(() => {
    if (!input) {
      return '';
    }
    try {
      return JSON.stringify(JSON5.parse(input));
    } catch {
      return null;
    }
  }, [input]);

  const handleSave = React.useCallback(() => {
    const newValue = input === '' ? undefined : JSON5.parse(input);
    onChange(newValue);
  }, [onChange, input]);

  const schemaUri =
    argType.typeDef.type === 'object' || argType.typeDef.type === 'array'
      ? argType.typeDef.schema
      : null;

  const HandleEditorMount = React.useCallback(
    (editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: typeof monacoEditor) => {
      editor.updateOptions({
        minimap: { enabled: false },
        accessibilitySupport: 'off',
      });

      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemaRequest: 'error',
        enableSchemaRequest: true,
        schemas: schemaUri
          ? [
              {
                uri: new URL(schemaUri, window.location.href).href,
                fileMatch: ['*'],
              },
            ]
          : [],
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
      });
    },
    [schemaUri],
  );

  useShortcut({ code: 'KeyS', metaKey: true, disabled: !dialogOpen }, handleSave);

  return (
    <React.Fragment>
      <Button variant="outlined" color="inherit" fullWidth onClick={() => setDialogOpen(true)}>
        {label}
      </Button>
      <Dialog fullWidth open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Edit JSON</DialogTitle>
        <DialogContent>
          <Editor
            height="200px"
            value={input}
            onChange={(newValue = '') => setInput(newValue)}
            language="json"
            options={{ readOnly: disabled }}
            onMount={HandleEditorMount}
            theme="vs-dark"
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" variant="text" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={normalizedInput === null || normalizedInitial === normalizedInput}
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}

export default JsonPropEditor;
