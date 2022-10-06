import * as React from 'react';
import jsonToTs from 'json-to-ts';
import { Skeleton, styled, SxProps } from '@mui/material';
import { WithControlledProp } from '../../../utils/types';
import lazyComponent from '../../../utils/lazyComponent';

const TypescriptEditor = lazyComponent(() => import('../../../components/TypescriptEditor'), {
  noSsr: true,
  fallback: <Skeleton variant="rectangular" height="100%" />,
});

const JsExpressionEditorRoot = styled('div')(({ theme }) => ({
  height: 150,
  border: `1px solid ${theme.palette.divider}`,
}));

export interface JsExpressionEditorProps extends WithControlledProp<string> {
  globalScope?: Record<string, unknown>;
  disabled?: boolean;
  autoFocus?: boolean;
  functionBody?: boolean;
  topLevelAwait?: boolean;
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
  topLevelAwait,
  onFocus,
  onBlur,
  sx,
}: JsExpressionEditorProps) {
  const extraLibs = React.useMemo(() => {
    const type = jsonToTs(globalScope);

    const globals = Object.keys(globalScope)
      .map((key) => `declare const ${key}: RootObject[${JSON.stringify(key)}];`)
      .join('\n');

    // TODO: cleanup after Toolpad v1
    const queryDeprecation = `
      /** @deprecated use parameters */
      declare const query: Query;
    `;

    const content = `
      ${type.join('\n')}

      // TODO: cleanup after Toolpad v1
      ${globalScope.query && globalScope.parameters ? queryDeprecation : ''}
      ${globals}
    `;

    return [{ content, filePath: 'file:///node_modules/@mui/toolpad/index.d.ts' }];
  }, [globalScope]);

  return (
    <JsExpressionEditorRoot sx={sx}>
      <TypescriptEditor
        value={value}
        onChange={(code = '') => onChange(code)}
        disabled={disabled}
        extraLibs={extraLibs}
        functionBody={functionBody}
        topLevelAwait={topLevelAwait}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
      />
    </JsExpressionEditorRoot>
  );
}
