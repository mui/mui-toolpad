import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import * as appDom from '../../../appDom';
import DialogForm from '../../../components/DialogForm';
import useEvent from '../../../utils/useEvent';
import { useDom, useDomApi } from '../../DomLoader';
import { useNodeNameValidation } from './validation';

const DEFAULT_NAME = 'page';

export interface CreatePageDialogProps {
  appId: string;
  open: boolean;
  onClose: () => void;
}

export default function CreatePageDialog({
  appId,
  open,
  onClose,
  ...props
}: CreatePageDialogProps) {
  const dom = useDom();
  const domApi = useDomApi();

  const existingNames = React.useMemo(
    () => appDom.getExistingNamesForChildren(dom, appDom.getApp(dom), 'pages'),
    [dom],
  );

  const [name, setName] = React.useState(appDom.proposeName(DEFAULT_NAME, existingNames));

  const navigate = useNavigate();

  // Reset form
  const handleReset = useEvent(() => setName(appDom.proposeName(DEFAULT_NAME, existingNames)));

  React.useEffect(() => {
    if (open) {
      handleReset();
    }
  }, [open, handleReset]);

  const inputErrorMsg = useNodeNameValidation(name, existingNames, 'page');
  const isNameValid = !inputErrorMsg;

  return (
    <Dialog open={open} onClose={onClose} {...props}>
      <DialogForm
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          const newNode = appDom.createNode(dom, 'page', {
            name,
            attributes: {
              title: appDom.createConst(name),
            },
          });
          const appNode = appDom.getApp(dom);
          domApi.addNode(newNode, appNode, 'pages');

          onClose();
          navigate(`/app/${appId}/pages/${newNode.id}`);
        }}
      >
        <DialogTitle>Create a new MUI Toolpad Page</DialogTitle>
        <DialogContent>
          <TextField
            sx={{ my: 1 }}
            autoFocus
            fullWidth
            label="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={!isNameValid}
            helperText={inputErrorMsg}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isNameValid}>
            Create
          </Button>
        </DialogActions>
      </DialogForm>
    </Dialog>
  );
}
