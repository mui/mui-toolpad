import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import * as appDom from '../../../appDom';
import { useDom, useDomApi } from '../../DomLoader';
import dataSources from '../../../toolpadDataSources/client';
import { ExactEntriesOf } from '../../../utils/types';
import DialogForm from '../../../components/DialogForm';
import { useNodeNameValidation } from './validation';
import useEvent from '../../../utils/useEvent';

const DEFAULT_NAME = 'connection';

export interface CreateConnectionDialogProps {
  appId: string;
  open: boolean;
  onClose: () => void;
}

export default function CreateConnectionDialog({
  appId,
  open,
  onClose,
  ...props
}: CreateConnectionDialogProps) {
  const dom = useDom();
  const domApi = useDomApi();

  const existingNames = React.useMemo(
    () => appDom.getExistingNamesForChildren(dom, appDom.getApp(dom), 'connections'),
    [dom],
  );

  const [name, setName] = React.useState(appDom.proposeName(DEFAULT_NAME, existingNames));

  const [dataSourceType, setDataSourceType] = React.useState('');
  const navigate = useNavigate();

  // Reset form
  const handleReset = useEvent(() => setName(appDom.proposeName(DEFAULT_NAME, existingNames)));

  React.useEffect(() => {
    if (open) {
      handleReset();
    }
  }, [open, handleReset]);

  const inputErrorMsg = useNodeNameValidation(name, existingNames, 'connection');
  const isNameValid = !inputErrorMsg;

  return (
    <Dialog open={open} onClose={onClose} {...props}>
      <DialogForm
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          const dataSource = dataSources[dataSourceType];
          if (!dataSource) {
            throw new Error(`Can't find a datasource for "${dataSourceType}"`);
          }
          const newNode = appDom.createNode(dom, 'connection', {
            name,
            attributes: {
              dataSource: appDom.createConst(dataSourceType),
              params: appDom.createSecret(null),
              status: appDom.createConst(null),
            },
          });
          const appNode = appDom.getApp(dom);
          domApi.addNode(newNode, appNode, 'connections');
          onClose();
          navigate(`/app/${appId}/connections/${newNode.id}`);
        }}
      >
        <DialogTitle>Create a new MUI Toolpad Connection</DialogTitle>
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
          <TextField
            select
            sx={{ my: 1 }}
            fullWidth
            value={dataSourceType}
            label="Type"
            onChange={(event) => setDataSourceType(event.target.value)}
          >
            {(Object.entries(dataSources) as ExactEntriesOf<typeof dataSources>).map(
              ([type, dataSourceDef]) =>
                dataSourceDef && (
                  <MenuItem key={type} value={type}>
                    {dataSourceDef.displayName}
                  </MenuItem>
                ),
            )}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!dataSourceType || !isNameValid}>
            Create
          </Button>
        </DialogActions>
      </DialogForm>
    </Dialog>
  );
}
