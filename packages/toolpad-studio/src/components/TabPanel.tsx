import { TabPanel as MuiTabPanel, TabPanelProps as MuiTabPanelProps } from '@mui/lab';
import { styled } from '@mui/material';

interface TabPanelProps extends MuiTabPanelProps {
  disableGutters?: boolean;
}

const TabPanel: React.ComponentType<TabPanelProps> = styled(MuiTabPanel, {
  shouldForwardProp: (prop) => prop !== 'disableGutters',
})<{
  disableGutters?: boolean;
}>(({ disableGutters }) => ({
  ...(disableGutters && {
    padding: 0,
  }),
}));

export default TabPanel;
