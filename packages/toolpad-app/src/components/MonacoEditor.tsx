/// <reference types="vite/client" />

/**
 * NOTE: This file can't SSR (use lazyComponent to load it)
 */
import '../utils/browserOnly';

import * as React from 'react';
import * as monaco from 'monaco-editor';
import { styled, SxProps } from '@mui/material';
import clsx from 'clsx';
import { nanoid } from 'nanoid/non-secure';
import invariant from 'invariant';
import {
  conf as jsonBasicConf,
  language as jsonBasicLanguage,
} from 'monaco-editor/esm/vs/basic-languages/javascript/javascript';
import {
  conf as typescriptBasicConf,
  language as typescriptBasicLanguage,
} from 'monaco-editor/esm/vs/basic-languages/typescript/typescript';
import {
  conf as mdBasicConf,
  language as mdBasicLanguage,
} from 'monaco-editor/esm/vs/basic-languages/markdown/markdown';
import { useTheme, Theme, lighten, rgbToHex } from '@mui/material/styles';

import { getDesignTokens } from '../theme';

export interface ExtraLib {
  content: string;
  filePath?: string;
}

function getExtension(language: string): string {
  switch (language) {
    case 'typescript':
      return '.tsx';
    case 'json':
      return '.json';
    case 'javascript':
      return '.jsx';
    case 'markdown':
      return '.md';
    case 'css':
      return '.css';
    case 'html':
      return '.html';
    case 'plaintext':
      return '.txt';
    default:
      return '.jsx';
  }
}

declare global {
  interface Window {
    MonacoEnvironment?: monaco.Environment | undefined;
  }
}

const designTokensDark = getDesignTokens('dark');

invariant(
  designTokensDark.palette?.background?.default &&
    designTokensDark.palette?.background?.paper &&
    designTokensDark.palette?.divider,
  'dark theme tokens missing',
);

const editorBackground = rgbToHex(lighten(designTokensDark.palette.background.default, 0.05));
const paperBackground = rgbToHex(designTokensDark.palette.background.paper);
const dividerColor = rgbToHex(designTokensDark.palette.divider);

monaco.editor.defineTheme('vs-toolpad-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    // See https://code.visualstudio.com/api/references/theme-color
    'editor.background': editorBackground,
    'menu.background': paperBackground,
    'menu.border': dividerColor,
    'menu.separatorBackground': dividerColor,
    'editorWidget.background': paperBackground,
    'editorWidget.border': dividerColor,
    'editor.lineHighlightBorder': dividerColor,
  },
});

monaco.editor.defineTheme('vs-toolpad-light', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {},
});

function registerLanguage(
  langId: string,
  language: monaco.languages.IMonarchLanguage,
  conf: monaco.languages.LanguageConfiguration,
) {
  monaco.languages.register({ id: langId });
  monaco.languages.registerTokensProviderFactory(langId, {
    create: async (): Promise<monaco.languages.IMonarchLanguage> => language,
  });
  monaco.languages.onLanguage(langId, async () => {
    monaco.languages.setLanguageConfiguration(langId, conf);
  });
}

/**
 * Monaco language services are singletons, we can't set language options per editor instance.
 * We're working around this limitiation by only considering diagnostics for the focused editor.
 * Unfocused editors will be configured with a syntax-coloring-only language which are registered below.
 * See https://github.com/microsoft/monaco-editor/issues/1105
 */
registerLanguage('jsonBasic', jsonBasicLanguage, jsonBasicConf);
registerLanguage('typescriptBasic', typescriptBasicLanguage, typescriptBasicConf);
registerLanguage('markdownBasic', mdBasicLanguage, mdBasicConf);

const JSON_DEFAULT_DIAGNOSTICS_OPTIONS: monaco.languages.json.DiagnosticsOptions = {};

monaco.languages.json.jsonDefaults.setDiagnosticsOptions(JSON_DEFAULT_DIAGNOSTICS_OPTIONS);

const TYPESCRIPT_DEFAULT_DIAGNOSTICS_OPTIONS: monaco.languages.typescript.DiagnosticsOptions = {
  noSemanticValidation: false,
  noSyntaxValidation: false,
};

monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
  TYPESCRIPT_DEFAULT_DIAGNOSTICS_OPTIONS,
);

const TYPESCRIPT_DEFAULT_COMPILER_OPTIONS: monaco.languages.typescript.CompilerOptions = {
  target: monaco.languages.typescript.ScriptTarget.Latest,
  allowNonTsExtensions: true,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  module: monaco.languages.typescript.ModuleKind.ESNext,
  noEmit: true,
  esModuleInterop: true,
  jsx: monaco.languages.typescript.JsxEmit.React,
  reactNamespace: 'React',
  allowJs: true,
  lib: ['es2020'],
  typeRoots: ['node_modules/@types'],
  strictNullChecks: true,
};

monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
  TYPESCRIPT_DEFAULT_COMPILER_OPTIONS,
);

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

let overflowWidgetsDomNode: HTMLDivElement | null = null;
function getOverflowWidgetsDomNode(theme: Theme): HTMLDivElement {
  if (!overflowWidgetsDomNode) {
    overflowWidgetsDomNode = document.createElement('div');
    // See https://github.com/microsoft/monaco-editor/issues/2233#issuecomment-913170212
    overflowWidgetsDomNode.classList.add('monaco-editor');
    overflowWidgetsDomNode.style.zIndex = String(theme.zIndex.tooltip + 1);
    document.body.append(overflowWidgetsDomNode);
  }

  return overflowWidgetsDomNode;
}

export interface MonacoEditorHandle {
  editor: monaco.editor.IStandaloneCodeEditor;
  monaco: typeof monaco;
}

type EditorOptions = monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions;

interface MonacoEditorBaseProps {
  value?: string;
  onChange?: (newValue: string) => void;
  disabled?: boolean;
  sx?: SxProps;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  options?: EditorOptions;
  className?: string;
  'data-testid'?: string;
}

export type MonacoEditorProps = MonacoEditorBaseProps &
  (
    | {
        language: 'typescript';
        diagnostics?: monaco.languages.typescript.DiagnosticsOptions;
        compilerOptions?: monaco.languages.typescript.CompilerOptions | undefined;
        extraLibs?: ExtraLib[];
      }
    | {
        language: 'json';
        diagnostics?: monaco.languages.json.DiagnosticsOptions;
        compilerOptions?: undefined;
        extraLibs?: undefined;
      }
    | {
        language: 'markdown';
        diagnostics?: undefined;
        compilerOptions?: undefined;
        extraLibs?: undefined;
      }
    | {
        language?: string | undefined;
        diagnostics?: undefined;
        compilerOptions?: undefined;
        extraLibs?: undefined;
      }
  );

export default React.forwardRef<MonacoEditorHandle, MonacoEditorProps>(function MonacoEditor(
  {
    value,
    onChange,
    sx,
    language = 'plaintext',
    diagnostics,
    compilerOptions,
    extraLibs,
    onFocus,
    onBlur,
    className,
    disabled,
    options,
    autoFocus,
    ...props
  },
  ref,
) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const instanceRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const theme = useTheme();
  const monacoTheme = theme.palette.mode === 'dark' ? 'vs-toolpad-dark' : 'vs-toolpad-light';

  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    /**
     * Update the language and diagnostics of the currently focused editor. Non-focused editors
     * will get a syntax-coloring-only version of the language.
     * This is our workaround for having different diagnostics options per editor instance.
     * See https://github.com/microsoft/monaco-editor/issues/1105
     */
    const model = instanceRef.current?.getModel();
    if (!model) {
      return;
    }

    if (language === 'json') {
      if (isFocused) {
        monaco.editor.setModelLanguage(model, 'json');
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          ...JSON_DEFAULT_DIAGNOSTICS_OPTIONS,
          ...(diagnostics as monaco.languages.json.DiagnosticsOptions),
        });
      } else {
        monaco.editor.setModelLanguage(model, 'jsonBasic');
      }
    } else if (language === 'typescript') {
      if (isFocused) {
        monaco.editor.setModelLanguage(model, 'typescript');
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          ...TYPESCRIPT_DEFAULT_DIAGNOSTICS_OPTIONS,
          ...(diagnostics as monaco.languages.typescript.DiagnosticsOptions),
        });
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          ...TYPESCRIPT_DEFAULT_COMPILER_OPTIONS,
          ...compilerOptions,
        });
        monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs || []);
      } else {
        monaco.editor.setModelLanguage(model, 'typescriptBasic');
      }
    } else {
      monaco.editor.setModelLanguage(model, language);
    }
  }, [isFocused, language, diagnostics, extraLibs, compilerOptions]);

  React.useEffect(() => {
    invariant(rootRef.current, 'Ref not attached');
    const extraOptions: EditorOptions = {
      readOnly: disabled,
      theme: monacoTheme,
      scrollbar: {
        alwaysConsumeMouseWheel: false,
        ...options?.scrollbar,
      },
      ...options,
    };

    let instance = instanceRef.current;

    if (instance) {
      instance.updateOptions(extraOptions);

      const model = instance.getModel();
      if (typeof value === 'string' && model) {
        const actualValue = model.getValue();

        if (value !== actualValue) {
          // Used to restore cursor position
          const state = instance.saveViewState();

          instance.executeEdits(null, [
            {
              range: model.getFullModelRange(),
              text: value,
            },
          ]);

          if (state) {
            instance.restoreViewState(state);
          }
        }
      }
    } else {
      const pathUri = monaco.Uri.parse(`/scripts/${nanoid(7)}${getExtension(language)}`);
      const model = monaco.editor.createModel(value || '', language, pathUri);

      instance = monaco.editor.create(rootRef.current, {
        model,
        language,
        minimap: { enabled: false },
        accessibilitySupport: 'off',
        tabSize: 2,
        automaticLayout: true,
        fixedOverflowWidgets: true,
        // See https://github.com/microsoft/monaco-editor/issues/181
        overflowWidgetsDomNode: getOverflowWidgetsDomNode(theme),
        ...extraOptions,
      });

      instanceRef.current = instance;

      instance.onDidFocusEditorWidget(() => setIsFocused(true));
      instance.onDidBlurEditorWidget(() => setIsFocused(false));

      if (autoFocus && !disabled) {
        instance.focus();
      }
    }
  }, [language, value, options, disabled, autoFocus, theme, monacoTheme]);

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
    <EditorRoot className={clsx({ [classes.disabled]: disabled }, className)} sx={sx} {...props}>
      <div className={classes.monacoHost} ref={rootRef} />
      <div className={classes.overlay} />
    </EditorRoot>
  );
});
