import * as React from 'react';
import Avatar, { AvatarProps } from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { SessionContext } from '../AppProvider';

/**
 *
 * Demos:
 *
 * - [Account](https://mui.com/toolpad/core/react-account/)
 *
 * API:
 *
 * - [AccountDetails API](https://mui.com/toolpad/core/api/account-details)
 */

function AccountDetails(props: AvatarProps) {
  const session = React.useContext(SessionContext);

  if (!session) {
    return null;
  }

  return (
    <Stack direction="column">
      <Stack direction="row" justifyContent="flex-start" spacing={2} gap={1} padding={2}>
        <Avatar
          src={session.user?.image || ''}
          alt={session.user?.name || session.user?.email || ''}
          sx={{ height: 48, width: 48 }}
          {...props}
        />
        <div>
          <Typography fontWeight="bolder">{session.user?.name}</Typography>
          <Typography variant="caption">{session.user?.email}</Typography>
        </div>
      </Stack>
      <Divider />
    </Stack>
  );
}

export { AccountDetails };
