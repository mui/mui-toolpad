import * as React from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';

export interface AppformatPrettierDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AppformatPrettierDialog({ open, onClose }: AppformatPrettierDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>prompting</DialogTitle>
      <DialogContent sx={{ minHeight: 100 }}>
        prettier failed with error X, do you want to save without formatting
      </DialogContent>
      <DialogActions>
        <Button color="primary" variant="text" onClick={onClose}>
          Save
        </Button>
        <Button color="inherit" variant="text" onClick={onClose}>
          retry
        </Button>
      </DialogActions>
    </Dialog>
  );
}
