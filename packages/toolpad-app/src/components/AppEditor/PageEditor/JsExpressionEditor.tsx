import * as React from 'react';
import jsonToTs from 'json-to-ts';
import { Skeleton, styled, SxProps } from '@mui/material';
import { WithControlledProp } from '../../../utils/types';
import reactLazyNoSsr from '../../../utils/reactLazyNoSsr';

const TypescriptEditor = reactLazyNoSsr(() => import('../../TypescriptEditor'));

const JsExpressionEditorRoot = styled('div')(({ theme }) => ({
  height: 150,
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
  const extraLibs = React.useMemo(() => {
    const type = jsonToTs(globalScope);

    const globals = Object.keys(globalScope)
      .map((key) => `declare const ${key}: RootObject[${JSON.stringify(key)}];`)
      .join('\n');

    const content = `
      ${type.join('\n')}

      ${globals}
    `;

    return [{ content, filePath: 'file:///node_modules/@mui/toolpad/index.d.ts' }];
  }, [globalScope]);

  return (
    <JsExpressionEditorRoot
      sx={{ ...sx, ...(disabled ? { opacity: 0.5, pointerEvents: 'none' } : {}) }}
    >
      <React.Suspense fallback={<Skeleton variant="rectangular" height="100%" />}>
        <TypescriptEditor
          value={value}
          onChange={(code = '') => onChange(code)}
          disabled={disabled}
          extraLibs={extraLibs}
          functionBody={functionBody}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={autoFocus}
        />
      </React.Suspense>
    </JsExpressionEditorRoot>
  );
}
