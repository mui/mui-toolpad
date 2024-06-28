import * as React from 'react';
import {
  Box,
  Collapse,
  darken,
  IconButton,
  Link,
  styled,
  Typography,
  TextField,
} from '@mui/material';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowDropDownSharpIcon from '@mui/icons-material/ArrowDropDownSharp';
import invariant from 'invariant';
import InputAdornment from '@mui/material/InputAdornment';
import AccountCircle from '@mui/icons-material/Search';
import { uncapitalize } from '@toolpad/utils/strings';
import * as appDom from '@toolpad/studio-runtime/appDom';
import useLocalStorageState from '@toolpad/utils/hooks/useLocalStorageState';
import ComponentCatalogItem from './ComponentCatalogItem';
import CreateCodeComponentNodeDialog from '../../PagesExplorer/CreateCodeComponentNodeDialog';
import { useAppState } from '../../../AppState';
import { usePageEditorApi } from '../PageEditorProvider';
import { useToolpadComponents } from '../../toolpadComponents';
import HelpTooltipIcon from '../../../../components/HelpTooltipIcon';

interface FutureComponentSpec {
  url: string;
  displayName: string;
}

const FUTURE_COMPONENTS = new Map<string, FutureComponentSpec>([
  ['Map', { url: 'https://github.com/mui/mui-toolpad/issues/864', displayName: 'Map' }],
  [
    'Pie Chart',
    { url: 'https://github.com/mui/mui-toolpad/issues/2615', displayName: 'Pie Chart' },
  ],
  ['Drawer', { url: 'https://github.com/mui/mui-toolpad/issues/1540', displayName: 'Drawer' }],
  ['Html', { url: 'https://github.com/mui/mui-toolpad/issues/1311', displayName: 'Html' }],
  ['Icon', { url: 'https://github.com/mui/mui-toolpad/issues/83', displayName: 'Icon' }],
  ['Card', { url: 'https://github.com/mui/mui-toolpad/issues/748', displayName: 'Card' }],
  ['Slider', { url: 'https://github.com/mui/mui-toolpad/issues/746', displayName: 'Slider' }],
  ['Radio', { url: 'https://github.com/mui/mui-toolpad/issues/744', displayName: 'Radio' }],
]);

const COMPONENT_CATALOG_WIDTH_COLLAPSED = 40;

const ComponentCatalogRoot = styled('div')({
  position: 'relative',
  width: COMPONENT_CATALOG_WIDTH_COLLAPSED + 1,
  height: '100%',
  zIndex: 1,
  overflow: 'visible',
});

export interface ComponentCatalogProps {
  className?: string;
}

export default function ComponentCatalog({ className }: ComponentCatalogProps) {
  const api = usePageEditorApi();
  const { dom } = useAppState();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [openStart, setOpenStart] = React.useState(0);
  const [openCustomComponents, setOpenCustomComponents] = useLocalStorageState(
    'catalog-custom-expanded',
    true,
  );
  const [openFutureComponents, setOpenFutureComponents] = useLocalStorageState(
    'catalog-future-expanded',
    true,
  );

  const closeTimeoutRef = React.useRef<NodeJS.Timeout>();
  const openDrawer = React.useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    setOpenStart(Date.now());
  }, []);

  const closeDrawer = React.useCallback(
    (delay?: number) => {
      const timeOpen = Date.now() - openStart;
      const defaultDelay = timeOpen > 750 ? 500 : 0;
      closeTimeoutRef.current = setTimeout(() => {
        setOpenStart(0);
      }, delay ?? defaultDelay);
    },
    [openStart, setOpenStart],
  );

  const toolpadComponents = useToolpadComponents();

  const handleDragStart = (componentType: string) => (event: React.DragEvent<HTMLElement>) => {
    const def = toolpadComponents[componentType];
    invariant(def, `No component definition found for "${componentType}"`);

    event.dataTransfer.dropEffect = 'copy';
    const newNode = appDom.createElement(
      dom,
      def.builtIn || componentType,
      def.initialProps || {},
      undefined,
      uncapitalize(def.displayName),
    );
    api.newNodeDragStart(newNode);
    closeDrawer(0);
  };

  const handleMouseEnter = React.useCallback(() => openDrawer(), [openDrawer]);
  const handleMouseLeave = React.useCallback(() => closeDrawer(), [closeDrawer]);

  const [createCodeComponentDialogOpen, setCreateCodeComponentDialogOpen] = React.useState(false);

  const handleCreateCodeComponentDialogOpen = React.useCallback(() => {
    setCreateCodeComponentDialogOpen(true);
    closeDrawer(0);
  }, [closeDrawer]);
  const handleCreateCodeComponentDialogClose = React.useCallback(
    () => setCreateCodeComponentDialogOpen(false),
    [],
  );

  const filteredItems = React.useMemo(() => {
    const entries = Object.entries(toolpadComponents);
    if (!searchTerm) {
      return entries;
    }
    const regex = new RegExp(searchTerm.split('').join('.*'), 'i');
    return entries.filter(
      ([componentName, component]) =>
        regex.test(componentName) || component?.synonyms.some((name) => regex.test(name)),
    );
  }, [toolpadComponents, searchTerm]);

  const drawerOpen = !!openStart || searchFocused;

  React.useEffect(() => {
    if (!drawerOpen) {
      setSearchTerm('');
    }
  }, [drawerOpen]);

  return (
    <React.Fragment>
      <ComponentCatalogRoot
        data-testid="component-catalog"
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            position: 'absolute',
            top: 0,
            bottom: 0,
            backgroundColor: 'background.default',
            borderRight: 1,
            borderColor: 'divider',
          }}
        >
          <Collapse
            in={drawerOpen}
            orientation="horizontal"
            timeout={200}
            sx={{
              height: '100%',
              justifyContent: 'flex-end',
              display: 'flex',
            }}
          >
            <Box sx={{ flexDirection: 'column', display: 'flex', height: '100%' }}>
              <Box
                sx={{
                  width: '100%',
                  pl: 1,
                  pr: 1,
                }}
              >
                <TextField
                  placeholder="Search components..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircle />
                      </InputAdornment>
                    ),
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </Box>
              <Box
                sx={{
                  flex: 1,
                  width: 250,
                  overflow: 'auto',
                  scrollbarGutter: 'stable',
                }}
              >
                <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={1} padding={1}>
                  {filteredItems.map(([componentId, componentType]) => {
                    invariant(componentType, `No component definition found for "${componentId}"`);
                    return componentType.builtIn && !componentType.system ? (
                      <ComponentCatalogItem
                        key={componentId}
                        id={componentId}
                        draggable
                        onDragStart={handleDragStart(componentId)}
                        displayName={componentType.displayName}
                        builtIn={componentType.builtIn}
                        kind={'builtIn'}
                      />
                    ) : null;
                  })}
                </Box>

                <Box
                  pl={2}
                  pr={1.5}
                  pb={0}
                  display="flex"
                  flexDirection={'row'}
                  justifyContent="space-between"
                >
                  <Box display="flex" alignItems="center">
                    <Typography mr={0.5} variant="overline">
                      Custom Components
                    </Typography>
                    <HelpTooltipIcon
                      helpText={
                        <Typography variant="inherit">
                          Expand Toolpad Studio with your own React components.{' '}
                          <Link
                            href="https://mui.com/toolpad/studio/concepts/custom-components"
                            target="_blank"
                            rel="noopener"
                          >
                            Learn more
                          </Link>
                          .
                        </Typography>
                      }
                    />
                  </Box>
                  <IconButton
                    aria-label="Expand custom components"
                    sx={{
                      p: 0,
                      height: '100%',
                      alignSelf: 'center',
                      cursor: 'pointer',
                      transform: `rotate(${openCustomComponents ? 180 : 0}deg)`,
                      transition: 'all 0.2s ease-in',
                    }}
                    onClick={() => setOpenCustomComponents((prev) => !prev)}
                  >
                    <ArrowDropDownSharpIcon />
                  </IconButton>
                </Box>
                <Collapse in={openCustomComponents} orientation={'vertical'}>
                  <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={1} padding={1} pt={0}>
                    {filteredItems.map(([componentId, componentType]) => {
                      invariant(
                        componentType,
                        `No component definition found for "${componentId}"`,
                      );
                      return !componentType.builtIn ? (
                        <ComponentCatalogItem
                          key={componentId}
                          id={componentId}
                          draggable
                          onDragStart={handleDragStart(componentId)}
                          displayName={componentType.displayName}
                          kind={'custom'}
                        />
                      ) : null;
                    })}
                    <ComponentCatalogItem
                      id="CreateNew"
                      displayName="Create"
                      kind="create"
                      onClick={handleCreateCodeComponentDialogOpen}
                    />
                  </Box>
                </Collapse>

                <Box padding={1}>
                  <Box
                    sx={(theme) => ({
                      py: 2,
                      pl: 1,
                      pr: 0.5,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderRadius: 1,
                      backgroundColor: darken(theme.palette.background.default, 0.1),
                      borderColor: theme.palette.divider,
                    })}
                  >
                    <Box pb={0} display="flex" flexDirection={'row'} justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        More components coming soon!
                      </Typography>
                      <IconButton
                        aria-label="Expand custom components"
                        sx={{
                          p: 0,
                          height: '100%',
                          alignSelf: 'start',
                          cursor: 'pointer',
                          transform: `rotate(${openFutureComponents ? 180 : 0}deg)`,
                          transition: 'all 0.2s ease-in',
                        }}
                        onClick={() => setOpenFutureComponents((prev) => !prev)}
                      >
                        <ArrowDropDownSharpIcon />
                      </IconButton>
                    </Box>
                    <Collapse in={openFutureComponents} orientation={'vertical'}>
                      <Typography variant="caption" color="text.secondary">
                        👍 Upvote on GitHub to get it prioritized.
                      </Typography>
                      <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={1} pt={1} pb={0}>
                        {Array.from(FUTURE_COMPONENTS, ([key, { displayName, url }]) => {
                          return (
                            <Link
                              href={url}
                              underline="none"
                              target="_blank"
                              key={`futureComponent.${key}`}
                            >
                              <ComponentCatalogItem
                                id={key}
                                displayName={displayName}
                                kind={'future'}
                              />
                            </Link>
                          );
                        })}
                      </Box>
                    </Collapse>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Collapse>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: COMPONENT_CATALOG_WIDTH_COLLAPSED,
            }}
          >
            <Box sx={{ mt: 2 }}>{openStart ? <ArrowLeftIcon /> : <ArrowRightIcon />}</Box>
            <Box position="relative">
              <Typography
                sx={{
                  position: 'absolute',
                  top: 0,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 20,
                  transform: 'rotate(90deg) translate(-10px, 0)',
                  transformOrigin: '0 50%',
                  whiteSpace: 'nowrap',
                }}
              >
                Component library
              </Typography>
            </Box>
          </Box>
        </Box>
      </ComponentCatalogRoot>
      <CreateCodeComponentNodeDialog
        open={!!createCodeComponentDialogOpen}
        onClose={handleCreateCodeComponentDialogClose}
      />
    </React.Fragment>
  );
}
