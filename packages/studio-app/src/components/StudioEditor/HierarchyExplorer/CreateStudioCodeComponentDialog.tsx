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
import * as studioDom from '../../../studioDom';
import { useDom, useDomApi } from '../../DomLoader';
import { format } from '../../../utils/prettier';
import DialogForm from '../../DialogForm';

function createDefaultCodeComponent(name: string): string {
  const componentId = name.replace(/\s/g, '');
  const propTypeId = `${componentId}Props`;
  return format(`
    import * as React from 'react';
    import type { ComponentConfig } from "@mui/studio-core";
    
    export interface ${propTypeId} {
      msg: string;
    }
    
    export const config: ComponentConfig<${propTypeId}> = {
      argTypes: {}
    }
    
    export default function ${componentId}({ msg }: ${propTypeId}) {
      return (
        <div>{msg}</div>
      );
    }

    ${componentId}.defaultProps = {
      msg: "Hello world!",
    };
  `);
}

export interface CreateStudioCodeComponentDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateStudioCodeComponentDialog({
  onClose,
  ...props
}: CreateStudioCodeComponentDialogProps) {
  const dom = useDom();
  const domApi = useDomApi();
  const [name, setName] = React.useState(`MyComponent`);
  const navigate = useNavigate();

  return (
    <Dialog {...props} onClose={onClose}>
      <DialogForm
        onSubmit={(e) => {
          e.preventDefault();
          const newNode = studioDom.createNode(dom, 'codeComponent', {
            name,
            attributes: {
              code: studioDom.createConst(createDefaultCodeComponent(name)),
              argTypes: studioDom.createConst({}),
            },
          });
          const appNode = studioDom.getApp(dom);
          domApi.addNode(newNode, appNode, 'codeComponents');
          onClose();
          navigate(`/editor/codeComponents/${newNode.id}`);
        }}
      >
        <DialogTitle>Create a new MUI Studio Code Component</DialogTitle>
        <DialogContent>
          <TextField
            sx={{ my: 1 }}
            autoFocus
            fullWidth
            label="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button type="submit" disabled={!name}>
            Create
          </Button>
        </DialogActions>
      </DialogForm>
    </Dialog>
  );
}
