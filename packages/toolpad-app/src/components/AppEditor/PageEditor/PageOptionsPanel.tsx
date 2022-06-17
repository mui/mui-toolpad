import { Stack, Button, Typography, Divider } from '@mui/material';
import * as React from 'react';
import PageIcon from '@mui/icons-material/Web';
import { useDom } from '../../DomLoader';
import { usePageEditorState } from './PageEditorProvider';
import QueryEditor from './QueryEditor';
import UrlQueryEditor from './UrlQueryEditor';
import NodeNameEditor from '../NodeNameEditor';
import * as appDom from '../../../appDom';

export default function PageOptionsPanel() {
  const state = usePageEditorState();
  const pageNodeId = state.nodeId;
  const dom = useDom();

  const page = appDom.getNode(dom, pageNodeId, 'page');

  return (
    <div>
      <Stack spacing={1} alignItems="start">
        <Typography variant="subtitle1">Page:</Typography>
        <NodeNameEditor node={page} />
        <Button
          startIcon={<PageIcon />}
          color="inherit"
          component="a"
          href={`/app/${state.appId}/preview/pages/${pageNodeId}`}
        >
          Preview
        </Button>
        <Divider variant="middle" sx={{ alignSelf: 'stretch' }} />
        <Typography variant="subtitle1">Page State:</Typography>
        <UrlQueryEditor />
        <QueryEditor />
      </Stack>
    </div>
  );
}
