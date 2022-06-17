import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import * as appDom from '../../../appDom';
import { useDom, useDomApi } from '../../DomLoader';
import { usePageEditorState } from './PageEditorProvider';
import MapEntriesEditor from '../../MapEntriesEditor';

export default function UrlQueryEditor() {
  const dom = useDom();
  const domApi = useDomApi();
  const { nodeId: pageNodeId } = usePageEditorState();

  const page = appDom.getNode(dom, pageNodeId, 'page');

  const [dialogOpen, setDialogOpen] = React.useState(false);

  const value = page.attributes.parameters?.value;
  const [input, setInput] = React.useState(value);
  React.useEffect(() => setInput(value), [value]);

  const handleSave = React.useCallback(() => {
    domApi.setNodeNamespacedProp(page, 'attributes', 'parameters', appDom.createConst(input || []));
  }, [domApi, page, input]);

  return (
    <React.Fragment>
      <Button color="inherit" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
        Add page parameters
      </Button>
      <Dialog fullWidth open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Edit page parameters</DialogTitle>
        <DialogContent>
          <Typography>
            The parameters you define below will be made available in bindings under the{' '}
            <code>page.parameters</code> global variable. You can set these parameters in the url
            with query variables (<code>?param=value</code>).
          </Typography>
          <MapEntriesEditor
            sx={{ my: 3 }}
            fieldLabel="Parameter"
            valueLabel="Default value"
            value={input || []}
            onChange={setInput}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" variant="text" onClick={() => setDialogOpen(false)}>
            Close
          </Button>
          <Button disabled={value === input} onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
