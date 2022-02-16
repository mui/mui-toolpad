import { styled, Typography } from '@mui/material';
import * as React from 'react';
import { ArgTypeDefinitions } from '@mui/studio-core';
import * as studioDom from '@studioDom';
import { ExactEntriesOf } from '@utils/types';
import { getStudioComponent, useStudioComponent } from '../../../studioComponents';
import ComponentPropEditor from './ComponentPropEditor';
import { useDom } from '../../DomLoader';
import { usePageEditorState } from './PageEditorProvider';
import PageOptionsPanel from './PageOptionsPanel';
import RuntimeErrorAlert from './RuntimeErrorAlert';
import NodeNameEditor from './NodeNameEditor';

const classes = {
  control: 'StudioControl',
};

const ComponentPropsEditorRoot = styled('div')(({ theme }) => ({
  [`& .${classes.control}`]: {
    margin: theme.spacing(1, 0),
  },
}));

interface ComponentPropsEditorProps<P> {
  node: studioDom.StudioElementNode<P>;
}

function ComponentPropsEditor<P>({ node }: ComponentPropsEditorProps<P>) {
  const dom = useDom();
  const definition = getStudioComponent(dom, node.component);

  return (
    <ComponentPropsEditorRoot>
      {(Object.entries(definition.argTypes) as ExactEntriesOf<ArgTypeDefinitions<P>>).map(
        ([propName, propTypeDef]) =>
          propTypeDef ? (
            <div key={propName} className={classes.control}>
              <ComponentPropEditor node={node} propName={propName} argType={propTypeDef} />
            </div>
          ) : null,
      )}
    </ComponentPropsEditorRoot>
  );
}

interface SelectedNodeEditorProps {
  node: studioDom.StudioElementNode;
}

function SelectedNodeEditor({ node }: SelectedNodeEditorProps) {
  const dom = useDom();
  const { viewState } = usePageEditorState();
  const nodeError = viewState.nodes[node.id]?.error;

  const component = useStudioComponent(dom, node.component);

  return (
    <React.Fragment>
      <Typography variant="subtitle1">{component.displayName}</Typography>
      <Typography variant="subtitle2">ID: {node.id}</Typography>
      <NodeNameEditor node={node} />
      {nodeError ? <RuntimeErrorAlert error={nodeError} /> : null}
      {node ? (
        <React.Fragment>
          <div>props:</div>
          <ComponentPropsEditor node={node} />
        </React.Fragment>
      ) : null}
    </React.Fragment>
  );
}

export interface ComponentEditorProps {
  className?: string;
}

export default function ComponentEditor({ className }: ComponentEditorProps) {
  const dom = useDom();
  const editor = usePageEditorState();

  const { selection } = editor;

  const selectedNode = selection ? studioDom.getNode(dom, selection) : null;

  return (
    <div className={className}>
      {selectedNode && studioDom.isElement(selectedNode) ? (
        // Add key to make sure it mounts every time selected node changes
        <SelectedNodeEditor key={selectedNode.id} node={selectedNode} />
      ) : (
        <PageOptionsPanel />
      )}
    </div>
  );
}
