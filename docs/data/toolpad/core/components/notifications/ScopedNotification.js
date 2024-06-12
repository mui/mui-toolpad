import * as React from 'react';
import {
  NotificationsProvider,
  useNotifications,
} from '@toolpad/core/notifications';
import Button from '@mui/material/Button';
import { Box, Snackbar, styled } from '@mui/material';

const ScopedSnackbar = styled(Snackbar)({ position: 'absolute' });

const notificationsProviderSlots = {
  snackbar: ScopedSnackbar,
};

function ScopedContent() {
  const notifications = useNotifications();
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Button
        onClick={async () => {
          await notifications.show('Consider yourself notified!', {
            autoHideDuration: 3000,
          });
        }}
      >
        Notify me
      </Button>
    </Box>
  );
}

export default function ScopedNotification() {
  return (
    <Box sx={{ width: '100%', height: 150, position: 'relative' }}>
      <NotificationsProvider slots={notificationsProviderSlots}>
        <ScopedContent />
      </NotificationsProvider>
    </Box>
  );
}
