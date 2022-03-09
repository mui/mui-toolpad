import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import * as studioDom from '../../../studioDom';
import { useDom, useDomApi } from '../../DomLoader';
import dataSources from '../../../studioDataSources/client';
import { ExactEntriesOf } from '../../../utils/types';
import DialogForm from '../../DialogForm';

export interface CreateStudioConnectionDialogProps {
  appId: string;
  open: boolean;
  onClose: () => void;
}

export default function CreateStudioConnectionDialog({
  appId,
  onClose,
  ...props
}: CreateStudioConnectionDialogProps) {
  const dom = useDom();
  const domApi = useDomApi();
  const [dataSourceType, setDataSourceType] = React.useState('');
  const navigate = useNavigate();

  return (
    <Dialog {...props} onClose={onClose}>
      <DialogForm
        onSubmit={(e) => {
          e.preventDefault();
          const dataSource = dataSources[dataSourceType];
          if (!dataSource) {
            throw new Error(`Can't find a datasource for "${dataSourceType}"`);
          }
          const newNode = studioDom.createNode(dom, 'connection', {
            attributes: {
              dataSource: studioDom.createConst(dataSourceType),
              params: studioDom.createConst(dataSource.getInitialConnectionValue()),
              status: studioDom.createConst(null),
            },
          });
          const appNode = studioDom.getApp(dom);
          domApi.addNode(newNode, appNode, 'connections');
          onClose();
          navigate(`/app/${appId}/editor/connections/${newNode.id}`);
        }}
      >
        <DialogTitle>Create a new MUI Studio API</DialogTitle>
        <DialogContent>
          <FormControl size="small" fullWidth>
            <InputLabel id="select-connection-type">Type</InputLabel>
            <Select
              labelId="select-connection-type"
              size="small"
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
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button type="submit" disabled={!dataSourceType}>
            Create
          </Button>
        </DialogActions>
      </DialogForm>
    </Dialog>
  );
}
