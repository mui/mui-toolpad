import { Alert, Stack } from '@mui/material';
import * as React from 'react';
import { ArgTypeDefinition, ArgControlSpec, PropValueType } from '@mui/studio-core';
import studioPropControls from '../../propertyControls';
import * as studioDom from '../../../studioDom';
import { useDomApi } from '../../DomLoader';
import { BindingEditor } from './BindingEditor';
import { NodeId, StudioBindable } from '../../../types';
import { WithControlledProp } from '../../../utils/types';

function getDefaultControl(typeDef: PropValueType): ArgControlSpec | null {
  switch (typeDef.type) {
    case 'string':
      return typeDef.enum ? { type: 'select' } : { type: 'string' };
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'object':
      return { type: 'json' };
    case 'array':
      return { type: 'json' };
    default:
      return null;
  }
}

export interface BindableEditorProps<V> extends WithControlledProp<StudioBindable<V> | null> {
  propName: string;
  nodeId: NodeId;
  argType: ArgTypeDefinition;
  actualValue?: V;
}

export function BindableEditor<V>({
  propName,
  nodeId,
  argType,
  value,
  onChange,
  actualValue,
}: BindableEditorProps<V>) {
  const handlePropConstChange = React.useCallback(
    (newValue: V) => onChange({ type: 'const', value: newValue }),
    [onChange],
  );

  const controlSpec = argType.control ?? getDefaultControl(argType.typeDef);
  const control = controlSpec ? studioPropControls[controlSpec.type] : null;

  const initConstValue = React.useCallback(() => {
    if (value?.type === 'const') {
      return value.value;
    }

    return actualValue;
  }, [actualValue, value]);

  const [constValue, setConstValue] = React.useState(initConstValue);

  React.useEffect(() => {
    setConstValue(initConstValue());
    return () => {};
  }, [value, initConstValue]);

  const hasBinding =
    value?.type === 'boundExpression' ||
    value?.type === 'binding' ||
    value?.type === 'jsExpression';

  return (
    <Stack direction="row" alignItems="flex-start">
      {control ? (
        <React.Fragment>
          <control.Editor
            nodeId={nodeId}
            propName={propName}
            argType={argType}
            disabled={hasBinding}
            value={constValue}
            onChange={handlePropConstChange}
          />
          <BindingEditor<V>
            nodeId={nodeId}
            prop={propName}
            propType={argType.typeDef}
            value={value}
            onChange={onChange}
          />
        </React.Fragment>
      ) : (
        <Alert severity="warning">
          {`No control for property '${propName}' (type '${argType.typeDef.type}' ${
            argType.control ? `, control: '${argType.control.type}'` : ''
          })`}
        </Alert>
      )}
    </Stack>
  );
}

export interface ComponentPropEditorProps<P, K extends keyof P> {
  name: K;
  node: studioDom.StudioElementNode<P>;
  argType: ArgTypeDefinition;
  actualValue?: P[K];
}

export default function ComponentPropEditor<P, K extends keyof P & string>({
  name,
  node,
  argType,
  actualValue,
}: ComponentPropEditorProps<P, K>) {
  const domApi = useDomApi();

  const handlePropChange = React.useCallback(
    (newValue: StudioBindable<P[K]> | null) => {
      domApi.setNodeNamespacedProp(node, 'props', name, newValue);
    },
    [domApi, node, name],
  );

  const propValue = node.props[name] ?? null;

  return (
    <BindableEditor
      propName={name}
      argType={argType}
      nodeId={node.id}
      value={propValue}
      onChange={handlePropChange}
      actualValue={actualValue}
    />
  );
}
