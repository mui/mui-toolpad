import * as React from 'react';
import { DialogProvider, useDialogs } from '@toolpad/core/useDialogs';
import Button from '@mui/material/Button';

function DemoContent() {
  const dialogs = useDialogs();
  return (
    <div>
      <Button
        onClick={async () => {
          // preview-start
          await dialogs.alert('Hello World');
          // preview-end
        }}
      >
        Alert
      </Button>
    </div>
  );
}

export default function AlertDialog() {
  return (
    <DialogProvider>
      <DemoContent />
    </DialogProvider>
  );
}
