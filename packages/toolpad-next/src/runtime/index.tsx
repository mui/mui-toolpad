import * as React from 'react';
import useStorageState from '@mui/toolpad-utils/hooks/useStorageState';
import { Button, ButtonProps } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { ToolpadFile } from '../shared/schemas';
import DevtoolOverlay from './DevtoolOverlay';

const useCurrentlyEditedComponentId =
  typeof window === 'undefined'
    ? () => [null, () => {}] as [string | null, React.Dispatch<React.SetStateAction<string | null>>]
    : () => useStorageState(window.sessionStorage, 'currently-edited-component-id', null);

const CurrentComponentIdContext = React.createContext<string | null>(null);

const nextId = 1;

export function EditButton(props: ButtonProps) {
  const [currentEditedComponentId, setCurrentlyEditedComponentId] = useCurrentlyEditedComponentId();
  const currentComponentId = React.useContext(CurrentComponentIdContext);

  if (currentEditedComponentId) {
    return null;
  }

  return (
    <Button
      {...props}
      variant="contained"
      onClick={() => setCurrentlyEditedComponentId(currentComponentId)}
      startIcon={<EditIcon />}
    >
      Edit
    </Button>
  );
}

export interface WithDevtoolParams {
  name: string;
  file: ToolpadFile;
}

export function withDevtool<P extends React.JSX.IntrinsicAttributes>(
  Component: React.ComponentType<P>,
  { name, file }: WithDevtoolParams,
): React.ComponentType<P> {
  return function ComponentWithDevtool(props) {
    const [currentlyEditedComponentId, setCurrentlyEditedComponentId] =
      useCurrentlyEditedComponentId();

    const [editedComponentId] = React.useState(() => {
      return `component-${nextId}`;
    });

    const editing = currentlyEditedComponentId === editedComponentId;

    return (
      <CurrentComponentIdContext.Provider value={editedComponentId}>
        {editing ? (
          <React.Fragment>
            <Component {...props} />
            <DevtoolOverlay
              name={name}
              file={file}
              onClose={() => setCurrentlyEditedComponentId(null)}
            />
          </React.Fragment>
        ) : (
          <Component {...props} />
        )}
      </CurrentComponentIdContext.Provider>
    );
  } satisfies React.ComponentType<P>;
}
