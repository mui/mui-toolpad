import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Tab, Box, styled, Typography } from '@mui/material';
import * as React from 'react';
import PageOptionsPanel from './PageOptionsPanel';
import ComponentEditor from './ComponentEditor';
import ThemeEditor from './ThemeEditor';
import { useAppState, useAppStateApi, useDom } from '../../AppState';
import { PageViewTab } from '../../../utils/domView';
import * as appDom from '../../../appDom';

const classes = {
  panel: 'Toolpad_Panel',
};

const ComponentPanelRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  [`& .${classes.panel}`]: {
    flex: 1,
    padding: theme.spacing(2),
    overflow: 'auto',
  },
}));

export interface ComponentPanelProps {
  className?: string;
}

export default function ComponentPanel({ className }: ComponentPanelProps) {
  const { dom } = useDom();
  const { currentView } = useAppState();
  const appStateApi = useAppStateApi();

  const currentTab = currentView.kind === 'page' ? currentView.tab : null;

  const selectedNodeId = currentView.kind === 'page' ? currentView.selectedNodeId : null;
  const selectedNode = selectedNodeId ? appDom.getMaybeNode(dom, selectedNodeId) : null;

  const handleChange = (event: React.SyntheticEvent, newValue: PageViewTab) =>
    appStateApi.setTab(newValue);

  return (
    <ComponentPanelRoot className={className}>
      <TabContext value={currentTab || 'page'}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="Component options">
            <Tab label="Page" value="page" />
            <Tab label="Component" value="component" />
            <Tab label="Theme" value="theme" />
          </TabList>
        </Box>
        <TabPanel value="page" className={classes.panel}>
          <PageOptionsPanel />
        </TabPanel>
        <TabPanel value="component" className={classes.panel}>
          {selectedNode && appDom.isElement(selectedNode) ? (
            <ComponentEditor node={selectedNode} />
          ) : (
            <Typography variant="body1">No component selected.</Typography>
          )}
        </TabPanel>
        <TabPanel value="theme" className={classes.panel}>
          <ThemeEditor />
        </TabPanel>
      </TabContext>
    </ComponentPanelRoot>
  );
}
