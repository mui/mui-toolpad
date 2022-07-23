/**
 * NOTE: This file can't SSR (use lazyComponent to load it)
 */
import '../utils/browserOnly';

import * as React from 'react';
import * as monaco from 'monaco-editor';
import { styled, SxProps, useTheme } from '@mui/material';
import clsx from 'clsx';
import cuid from 'cuid';
import monacoEditorTheme from '../monacoEditorTheme';

function getExtension(language: string): string {
  switch (language) {
    case 'typescript':
      return '.tsx';
    case 'json':
      return '.json';
    case 'javascript':
      return '.jsx';
    case 'css':
      return '.css';
    case 'html':
      return '.html';
    default:
      return '.jsx';
  }
}

declare global {
  interface Window {
    MonacoEnvironment: monaco.Environment;
  }
}

window.MonacoEnvironment = {
  async getWorker(_, label) {
    if (label === 'typescript') {
      return new Worker(
        new URL(`monaco-editor/esm/vs/language/typescript/ts.worker`, import.meta.url),
      );
    }
    if (label === 'json') {
      return new Worker(new URL(`monaco-editor/esm/vs/language/json/json.worker`, import.meta.url));
    }
    if (label === 'html') {
      return new Worker(new URL(`monaco-editor/esm/vs/language/html/html.worker`, import.meta.url));
    }
    if (label === 'css') {
      return new Worker(new URL(`monaco-editor/esm/vs/language/css/css.worker`, import.meta.url));
    }
    if (label === 'editorWorkerService') {
      return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
    }
    throw new Error(`Failed to resolve worker with label "${label}"`);
  },
} as monaco.Environment;

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

const classes = {
  monacoHost: 'Toolpad_MonacoEditorMonacoHost',
  overlay: 'Toolpad_MonacoEditorOverlay',
  disabled: 'Toolpad_MonacoEditorDisabled',
};

const EditorRoot = styled('div')(({ theme }) => ({
  height: '100%',
  position: 'relative',

  [`& .${classes.monacoHost}`]: {
    position: 'absolute',
    inset: '0 0 0 0',
  },

  [`& .${classes.overlay}`]: {
    position: 'absolute',
    inset: '0 0 0 0',
    background: theme.palette.background.default,
    opacity: 0.5,
    display: 'none',
  },

  [`&.${classes.disabled}`]: {
    pointerEvents: 'none',
  },

  [`&.${classes.disabled} .${classes.overlay}`]: {
    display: 'block',
  },
}));

export interface MonacoEditorHandle {
  editor: monaco.editor.IStandaloneCodeEditor;
  monaco: typeof monaco;
}

type EditorOptions = monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions;

export interface MonacoEditorProps {
  value?: string;
  onChange?: (newValue: string) => void;
  disabled?: boolean;
  sx?: SxProps;
  autoFocus?: boolean;
  language?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  options?: EditorOptions;
  className?: string;
}

export default React.forwardRef<MonacoEditorHandle, MonacoEditorProps>(function MonacoEditor(
  {
    value,
    onChange,
    sx,
    language = 'typescript',
    onFocus,
    onBlur,
    className,
    disabled,
    options,
    autoFocus,
  },
  ref,
) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const overflowWidgetsDomNodeRef = React.useRef<HTMLElement | null>(null);
  const instanceRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const theme = useTheme();
  const overflowWidgetsDomNodeZindex = theme.zIndex.tooltip + 1;

  React.useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const extraOptions: EditorOptions = {
      readOnly: disabled,
      ...options,
    };

    if (instanceRef.current) {
      if (extraOptions) {
        instanceRef.current.updateOptions(extraOptions);
      }

      const model = instanceRef.current.getModel();
      if (typeof value === 'string' && model) {
        const actualValue = model.getValue();

        if (value !== actualValue) {
          // Used to restore cursor position
          const state = instanceRef.current.saveViewState();

          instanceRef.current.executeEdits(null, [
            {
              range: model.getFullModelRange(),
              text: value,
            },
          ]);

          if (state) {
            instanceRef.current.restoreViewState(state);
          }
        }
      }
    } else {
      const pathUri = monaco.Uri.parse(`./scripts/${cuid()}${getExtension(language)}`);
      const model = monaco.editor.createModel(value || '', language, pathUri);

      if (!overflowWidgetsDomNodeRef.current) {
        const overflowWidgetsDomNode = document.createElement('div');
        // See https://github.com/microsoft/monaco-editor/issues/2233#issuecomment-913170212
        overflowWidgetsDomNode.classList.add('monaco-editor');
        overflowWidgetsDomNode.style.zIndex = String(overflowWidgetsDomNodeZindex);
        document.body.append(overflowWidgetsDomNode);
        overflowWidgetsDomNodeRef.current = overflowWidgetsDomNode;
      }

      instanceRef.current = monaco.editor.create(rootRef.current, {
        model,
        language,
        minimap: { enabled: false },
        accessibilitySupport: 'off',
        tabSize: 2,
        automaticLayout: true,
        theme: monacoEditorTheme,
        fixedOverflowWidgets: true,
        // See https://github.com/microsoft/monaco-editor/issues/181
        overflowWidgetsDomNode: overflowWidgetsDomNodeRef.current,
        ...extraOptions,
      });

      if (autoFocus && !disabled) {
        instanceRef.current.focus();
      }
    }
  }, [language, value, options, disabled, autoFocus, overflowWidgetsDomNodeZindex]);

  React.useEffect(() => {
    const editor = instanceRef.current;

    const onDidChangeModelContentSub = editor?.onDidChangeModelContent(() => {
      const editorValue = editor.getValue();

      if (onChange && value !== editorValue) {
        onChange(editorValue);
      }
    });

    return () => onDidChangeModelContentSub?.dispose();
  }, [onChange, value]);

  React.useEffect(() => {
    const editor = instanceRef.current;

    if (onFocus) {
      const onDidFocusEditorTextSub = editor?.onDidFocusEditorText(onFocus);
      return () => onDidFocusEditorTextSub?.dispose();
    }
    return () => {};
  }, [onFocus]);

  React.useEffect(() => {
    const editor = instanceRef.current;
    if (onBlur) {
      const onDidBlurEditorTextSub = editor?.onDidBlurEditorText(onBlur);
      return () => onDidBlurEditorTextSub?.dispose();
    }
    return () => {};
  }, [onBlur]);

  React.useEffect(() => {
    return () => {
      instanceRef.current?.getModel()?.dispose();
      instanceRef.current?.dispose();
      instanceRef.current = null;
      overflowWidgetsDomNodeRef.current?.remove();
      overflowWidgetsDomNodeRef.current = null;
    };
  }, []);

  React.useImperativeHandle(
    ref,
    () => {
      return {
        get editor() {
          const editor = instanceRef.current;
          if (!editor) {
            throw new Error('Editor not created yet');
          }
          return editor;
        },
        get monaco() {
          return monaco;
        },
      };
    },
    [],
  );

  return (
    <EditorRoot className={clsx({ [classes.disabled]: disabled }, className)} sx={sx}>
      <div className={classes.monacoHost} ref={rootRef} />
      <div className={classes.overlay} />
    </EditorRoot>
  );
});
