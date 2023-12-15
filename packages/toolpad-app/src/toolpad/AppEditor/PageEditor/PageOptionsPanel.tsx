import {
  Stack,
  Typography,
  Divider,
  Tooltip,
  Link,
  ToggleButtonGroup,
  ToggleButton,
  Autocomplete,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import * as React from 'react';
import { useAppState, useDomApi } from '../../AppState';
import { usePageEditorState } from './PageEditorProvider';
import QueryEditor from './QueryEditor';
import UrlQueryEditor from './UrlQueryEditor';
import NodeNameEditor from '../NodeNameEditor';
import * as appDom from '../../../appDom';
import PageTitleEditor from '../PageTitleEditor';
import PageDisplayNameEditor from '../PageDisplayNameEditor';
import { FEATURE_FLAG_AUTHORIZATION } from '../../../constants';

const PAGE_DISPLAY_OPTIONS: { value: appDom.PageDisplayMode; label: string }[] = [
  { value: 'shell', label: 'App shell' },
  { value: 'standalone', label: 'No shell' },
];

export default function PageOptionsPanel() {
  const { nodeId: pageNodeId } = usePageEditorState();
  const { dom } = useAppState();
  const domApi = useDomApi();

  const appNode = appDom.getApp(dom);

  const page = appDom.getNode(dom, pageNodeId, 'page');
  const handleDisplayModeChange = React.useCallback(
    (event: React.MouseEvent<HTMLElement>, newValue: appDom.PageDisplayMode) => {
      domApi.update((draft) =>
        appDom.setNodeNamespacedProp(draft, page, 'attributes', 'display', newValue),
      );
    },
    [domApi, page],
  );

  const availableRoles = React.useMemo(() => {
    return new Map(appNode.attributes?.authorization?.roles?.map((role) => [role.name, role]));
  }, [appNode]);

  const handleAllowedRolesChange = React.useCallback(
    (event: React.SyntheticEvent, newValue: string[]) => {
      domApi.update((draft) =>
        appDom.setNodeNamespacedProp(draft, page, 'attributes', 'authorization', {
          ...page.attributes.authorization,
          allowedRoles: newValue,
        }),
      );
    },
    [domApi, page],
  );

  const handleAllowAllChange = React.useCallback(
    (event: React.SyntheticEvent, isAllowed: boolean) => {
      domApi.update((draft) =>
        appDom.setNodeNamespacedProp(
          draft,
          page,
          'attributes',
          'authorization',
          isAllowed ? undefined : { allowedRoles: [] },
        ),
      );
    },
    [domApi, page],
  );

  return (
    <Stack spacing={2} alignItems="stretch" data-testid="page-editor">
      <Typography variant="subtitle1">Page:</Typography>
      <div>
        <NodeNameEditor node={page} />
        <PageDisplayNameEditor node={page} />
        <PageTitleEditor node={page} />
      </div>
      <div>
        <Typography variant="body2">Display mode:</Typography>
        <Tooltip
          arrow
          placement="left-start"
          title={
            <Typography variant="inherit">
              Control how the navigation panel is rendered in the final application. Read more in
              the{' '}
              <Link
                href="https://mui.com/toolpad/concepts/page-properties/#display-mode"
                target="_blank"
                rel="noopener"
              >
                docs
              </Link>
              .
            </Typography>
          }
        >
          <ToggleButtonGroup
            exclusive
            value={page.attributes.display ?? 'shell'}
            onChange={handleDisplayModeChange}
            aria-label="Display mode"
            fullWidth
          >
            {PAGE_DISPLAY_OPTIONS.map((option) => {
              return (
                <ToggleButton key={option.value} value={option.value}>
                  {option.label}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Tooltip>
      </div>
      {FEATURE_FLAG_AUTHORIZATION ? (
        <div>
          <Typography variant="body2">Authorization:</Typography>
          <FormControlLabel
            control={
              <Checkbox checked={!page.attributes.authorization} onChange={handleAllowAllChange} />
            }
            label="Allow access to all roles"
          />
          <Autocomplete
            multiple
            options={Array.from(availableRoles.keys())}
            value={page.attributes.authorization?.allowedRoles ?? []}
            onChange={handleAllowedRolesChange}
            disabled={!page.attributes.authorization}
            fullWidth
            noOptionsText="No roles defined"
            renderInput={(params) => (
              <TextField {...params} label="Allowed roles" placeholder="Roles" />
            )}
          />
        </div>
      ) : null}
      {appDom.isCodePage(page) ? null : (
        <div>
          <Divider variant="middle" sx={{ alignSelf: 'stretch' }} />
          <Typography variant="overline">Page State:</Typography>
          <UrlQueryEditor pageNodeId={pageNodeId} />
          <QueryEditor />
        </div>
      )}
    </Stack>
  );
}
