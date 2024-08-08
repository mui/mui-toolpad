import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import * as React from 'react';
import ResetIcon from '@mui/icons-material/RestartAlt';
import * as appDom from '@toolpad/studio-runtime/appDom';
import { useDomApi } from '../AppState';

interface PageDisplayNameEditorProps {
  node: appDom.PageNode;
}

function validateInput(input: string) {
  if (!input) {
    return 'Input required';
  }
  return null;
}

export default function PageDisplayNameEditor({ node }: PageDisplayNameEditorProps) {
  const domApi = useDomApi();

  const pageDisplayName = React.useMemo(() => appDom.getPageDisplayName(node), [node]);

  const [pageDisplayNameInput, setPageDisplayNameInput] = React.useState(pageDisplayName);
  React.useEffect(() => setPageDisplayNameInput(pageDisplayName), [pageDisplayName]);

  const handlePageDisplayNameChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setPageDisplayNameInput(event.target.value),
    [],
  );

  const handleCommit = React.useCallback(() => {
    domApi.update((dom: appDom.AppDom) =>
      appDom.setNodeNamespacedProp(dom, node, 'attributes', 'displayName', pageDisplayNameInput),
    );
  }, [node, pageDisplayNameInput, domApi]);

  const handleReset = React.useCallback(() => {
    domApi.update((dom: appDom.AppDom) =>
      appDom.setNodeNamespacedProp(dom, node, 'attributes', 'displayName', undefined),
    );
  }, [node, domApi]);

  const handleKeyPress = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.code === 'Enter') {
        handleCommit();
      }
    },
    [handleCommit],
  );

  return (
    <TextField
      fullWidth
      label="Display name"
      value={pageDisplayNameInput}
      onChange={handlePageDisplayNameChange}
      onBlur={handleCommit}
      onKeyDown={handleKeyPress}
      error={!pageDisplayNameInput}
      helperText={validateInput(pageDisplayNameInput)}
      slotProps={{
        input: {
          endAdornment:
            pageDisplayNameInput === node.attributes.displayName ? (
              <InputAdornment position="end">
                <Tooltip title="Reset to default value">
                  <IconButton onClick={handleReset} edge="end">
                    <ResetIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : null,
        },
      }}
    />
  );
}
