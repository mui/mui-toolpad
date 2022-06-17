import * as React from 'react';
import { styled, Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { NodeId } from '@mui/toolpad-core';
import RenderPanel from './RenderPanel';
import ComponentPanel from './ComponentPanel';
import { PageEditorProvider } from './PageEditorProvider';
import { useDom } from '../../DomLoader';
import * as appDom from '../../../appDom';
import ComponentCatalog from './ComponentCatalog';
import NotFoundEditor from '../NotFoundEditor';
import usePageTitle from '../../../utils/usePageTitle';
import SplitPane from '../../SplitPane';
import NonRenderedPageContent from './NonRenderedPageContent';

const classes = {
  componentPanel: 'Toolpad_ComponentPanel',
  pageContentPanel: 'Toolpad_PageContentPanel',
  renderPanel: 'Toolpad_RenderPanel',
};

const PageEditorRoot = styled('div')(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'row',
  overflow: 'hidden',
  [`& .${classes.pageContentPanel}`]: {
    flex: 1,
  },
  [`& .${classes.renderPanel}`]: {
    flex: 1,
  },
  [`& .${classes.componentPanel}`]: {
    width: 300,
    borderLeft: `1px solid ${theme.palette.divider}`,
  },
}));

interface PageEditorContentProps {
  appId: string;
  node: appDom.PageNode;
}

function PageEditorContent({ appId, node }: PageEditorContentProps) {
  usePageTitle(`${node.attributes.title.value} | Toolpad editor`);

  return (
    <PageEditorProvider key={node.id} appId={appId} nodeId={node.id}>
      <PageEditorRoot>
        <Box sx={{ flex: 1, position: 'relative' }}>
          <SplitPane
            split="horizontal"
            allowResize
            defaultSize="70%"
            pane2Style={{ overflow: 'auto' }}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <ComponentCatalog />
              <RenderPanel className={classes.renderPanel} />
            </Box>
            <NonRenderedPageContent />
          </SplitPane>
        </Box>
        <ComponentPanel className={classes.componentPanel} />
      </PageEditorRoot>
    </PageEditorProvider>
  );
}

interface PageEditorProps {
  appId: string;
}

export default function PageEditor({ appId }: PageEditorProps) {
  const dom = useDom();
  const { nodeId } = useParams();
  const pageNode = appDom.getMaybeNode(dom, nodeId as NodeId, 'page');

  return pageNode ? (
    <PageEditorContent appId={appId} node={pageNode} />
  ) : (
    <NotFoundEditor message={`Non-existing Page "${nodeId}"`} />
  );
}
