import { Stack, Typography, Divider } from '@mui/material';
import * as React from 'react';
import { useDom } from '../../AppState';
import { usePageEditorState } from './PageEditorProvider';
import QueryEditor from './QueryEditor';
import UrlQueryEditor from './UrlQueryEditor';
import NodeNameEditor from '../NodeNameEditor';
import * as appDom from '../../../appDom';
import PageModuleEditor from './PageModuleEditor';

// Page modules are deprecated
const ENABLE_PAGE_MODULE_EDITOR = false;

export default function PageOptionsPanel() {
  const { nodeId: pageNodeId } = usePageEditorState();
  const { dom } = useDom();

  const page = appDom.getNode(dom, pageNodeId, 'page');

  return (
    <div>
      <Stack spacing={1} alignItems="start">
        <Typography variant="subtitle1">Page:</Typography>
        <NodeNameEditor node={page} />
        {ENABLE_PAGE_MODULE_EDITOR ? <PageModuleEditor pageNodeId={pageNodeId} /> : null}
        <Divider variant="middle" sx={{ alignSelf: 'stretch' }} />
        <Typography variant="overline">Page State:</Typography>
        <UrlQueryEditor pageNodeId={pageNodeId} />
        <QueryEditor />
      </Stack>
    </div>
  );
}
