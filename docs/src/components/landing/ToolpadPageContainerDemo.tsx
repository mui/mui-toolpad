import * as React from 'react';
import Frame from 'docs/src/components/action/Frame';
import Paper from '@mui/material/Paper';
import DemoSandbox from 'docs/src/modules/components/DemoSandbox';
import { HighlightedCode } from '@mui/docs/HighlightedCode';
import { AppProvider } from '@toolpad/core/AppProvider';
import { PageContainer } from '@toolpad/core/PageContainer';
import { useDemoRouter } from '@toolpad/core/internals';
import Grid from '@mui/material/Grid2';
import { createTheme, styled, useTheme } from '@mui/material/styles';

const code = `
<PageContainer>
  Page content
</PageContainer>
`;

const NAVIGATION = [
  { segment: '', title: 'Home' },
  { segment: 'orders', title: 'Orders' },
];

const PlaceHolder = styled('div')<{ height: number }>(({ theme, height }) => ({
  border: `1px solid ${theme.palette.divider}`,
  height,
  borderRadius: theme.shape.borderRadius,
}));

function PageContainerDemo() {
  const router = useDemoRouter('/orders');
  const theme = useTheme();
  const demoTheme = React.useMemo(
    () =>
      createTheme({
        cssVariables: {
          colorSchemeSelector: 'data-toolpad-color-scheme',
        },
        colorSchemes: {
          [theme.palette.mode === 'light' ? 'light' : 'dark']: true,
        },
      }),
    [theme.palette.mode],
  );
  return (
    <AppProvider navigation={NAVIGATION} router={router} theme={demoTheme}>
      <PageContainer>
        <Grid container spacing={2}>
          <Grid size={6}>
            <PlaceHolder height={100} />
          </Grid>
          <Grid size={6}>
            <PlaceHolder height={100} />
          </Grid>
          <Grid size={12}>
            <PlaceHolder height={200} />
          </Grid>
        </Grid>
      </PageContainer>
    </AppProvider>
  );
}

const NOOP = () => {};

export default function ToolpadPageContainerDemo() {
  return (
    <Frame sx={{ height: '100%' }}>
      <Frame.Demo sx={{ p: 2 }}>
        <Paper
          variant="outlined"
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            maxWidth: '100%',
            mx: 'auto',
            bgcolor: '#FFF',
            borderRadius: '8px',
            overflow: 'hidden',
            ...theme.applyDarkStyles({
              bgcolor: 'primaryDark.900',
            }),
          })}
        >
          <DemoSandbox
            iframe
            name="DashboardLayout"
            onResetDemoClick={NOOP}
            productId="toolpad-core"
          >
            <PageContainerDemo />
          </DemoSandbox>
        </Paper>
      </Frame.Demo>
      <Frame.Info data-mui-color-scheme="dark" sx={{ maxHeight: 600, overflow: 'auto' }}>
        <HighlightedCode copyButtonHidden plainStyle code={code} language="jsx" />
      </Frame.Info>
    </Frame>
  );
}
