import { Box, Typography, TextField, MenuItem } from '@mui/material';
import * as React from 'react';
import { BindableAttrValue, NavigationAction, NodeId } from '@mui/toolpad-core';
import { WithControlledProp } from '../../../utils/types';
import { useDom } from '../../AppState';
import * as appDom from '../../../appDom';
import { usePageEditorState } from '../PageEditor/PageEditorProvider';
import { mapValues } from '../../../utils/collections';
import BindableEditor from '../PageEditor/BindableEditor';
import { useBindingEditorContext } from '.';
import { useEvaluateLiveBinding } from '../useEvaluateLiveBinding';

export interface NavigationActionParameterEditorProps
  extends WithControlledProp<BindableAttrValue<string> | null> {
  label: string;
}

function NavigationActionParameterEditor({
  label,
  value,
  onChange,
}: NavigationActionParameterEditorProps) {
  const { jsRuntime, globalScope, globalScopeMeta } = useBindingEditorContext();

  const liveBinding = useEvaluateLiveBinding({
    jsRuntime,
    input: value,
    globalScope,
  });

  return (
    <Box>
      <BindableEditor<string>
        liveBinding={liveBinding}
        jsRuntime={jsRuntime}
        globalScope={globalScope}
        globalScopeMeta={globalScopeMeta}
        label={label}
        propType={{ type: 'string' }}
        value={value || null}
        onChange={onChange}
      />
    </Box>
  );
}

export interface NavigationActionEditorProps extends WithControlledProp<NavigationAction | null> {}

export function NavigationActionEditor({ value, onChange }: NavigationActionEditorProps) {
  const { dom } = useDom();
  const root = appDom.getApp(dom);
  const { pages = [] } = appDom.getChildNodes(dom, root);
  const { nodeId: currentPageNodeId } = usePageEditorState();

  const getDefaultActionParameters = React.useCallback((page: appDom.PageNode) => {
    const defaultPageParameters = page.attributes.parameters?.value || [];

    return mapValues(Object.fromEntries(defaultPageParameters), (pageParameterValue) =>
      appDom.createConst(pageParameterValue),
    );
  }, []);

  const handlePageChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const pageId = event.target.value as NodeId;
      const page = appDom.getNode(dom, pageId);

      const defaultActionParameters = appDom.isPage(page) ? getDefaultActionParameters(page) : {};

      onChange({
        type: 'navigationAction',
        value: {
          page: appDom.ref(pageId),
          parameters: defaultActionParameters,
        },
      });
    },
    [dom, getDefaultActionParameters, onChange],
  );

  const handleActionParameterChange = React.useCallback(
    (page: appDom.PageNode, actionParameterName: string) =>
      (newValue: BindableAttrValue<string> | null) => {
        onChange({
          type: 'navigationAction',
          value: {
            page: appDom.ref(page.id),
            parameters: {
              ...(value?.value.parameters || {}),
              ...(newValue ? { [actionParameterName]: newValue } : {}),
            },
          },
        });
      },
    [onChange, value?.value.parameters],
  );

  const availablePages = React.useMemo(
    () => pages.filter((page) => page.id !== currentPageNodeId),
    [pages, currentPageNodeId],
  );

  const hasPagesAvailable = availablePages.length > 0;

  return (
    <Box sx={{ my: 1 }}>
      <Typography>Navigate to a page on this event</Typography>
      <TextField
        fullWidth
        sx={{ my: 3 }}
        label="page"
        select
        value={value?.value?.page ? appDom.deref(value.value.page) : ''}
        onChange={handlePageChange}
        disabled={!hasPagesAvailable}
        helperText={hasPagesAvailable ? null : 'No other pages available'}
      >
        {availablePages.map((page) => (
          <MenuItem key={page.id} value={page.id}>
            {page.name}
          </MenuItem>
        ))}
      </TextField>
      <Typography variant="overline">Page parameters:</Typography>
      {availablePages.map((page) => {
        const defaultActionParameters = getDefaultActionParameters(page);

        return Object.entries(value?.value.parameters || defaultActionParameters).map(
          (actionParameter) => {
            const [actionParameterName, actionParameterValue] = actionParameter;

            return (
              <NavigationActionParameterEditor
                key={actionParameterName}
                label={actionParameterName}
                value={actionParameterValue as BindableAttrValue<string>}
                onChange={handleActionParameterChange(page, actionParameterName)}
              />
            );
          },
        );
      })}
    </Box>
  );
}
