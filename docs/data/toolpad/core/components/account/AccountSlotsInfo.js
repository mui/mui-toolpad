import * as React from 'react';
import {
  Avatar,
  Button,
  Divider,
  Typography,
  Stack,
  IconButton,
} from '@mui/material';
import WalletIcon from '@mui/icons-material/AccountBalance';
import SendIcon from '@mui/icons-material/Send';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import CopyIcon from '@mui/icons-material/ContentCopy';

import { Account, AuthenticationContext, SessionContext } from '@toolpad/core';

const demoSession = {
  user: {
    name: 'Bharat Kashyap',
    email: 'bharatkashyap@outlook.com',
    image: 'https://avatars.githubusercontent.com/u/19550456',
  },
};

const mockData = {
  address: '0x1234...5678',
  balance: '1,234.56 ETH',
  usdBalance: '$2,345,678.90 USD',
};

function CryptoWalletInfo() {
  return (
    <div>
      <Stack spacing={2} sx={{ width: 300, p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <WalletIcon />
          </Avatar>
          <Stack>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              {mockData.address}
              <IconButton size="small" sx={{ ml: 1 }}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Main Account
            </Typography>
          </Stack>
        </Stack>
        <Divider />
        <Stack>
          <Typography variant="h6" fontWeight="bold">
            {mockData.balance}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mockData.usdBalance}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            fullWidth
            disableElevation
            color="primary"
            startIcon={<SendIcon />}
          >
            Send
          </Button>
          <Button
            variant="outlined"
            fullWidth
            disableElevation
            startIcon={<ShoppingCart />}
          >
            Buy
          </Button>
        </Stack>
      </Stack>
      <Divider />
    </div>
  );
}

export default function AccountSlotsInfo() {
  const [session, setSession] = React.useState(demoSession);
  const authentication = React.useMemo(() => {
    return {
      signIn: () => {
        setSession(demoSession);
      },
      signOut: () => {
        setSession(null);
      },
    };
  }, []);

  return (
    <AuthenticationContext.Provider value={authentication}>
      <SessionContext.Provider value={session}>
        <Account
          slots={{
            content: CryptoWalletInfo,
          }}
          slotProps={{
            userDetailsContainer: {
              sx: {
                p: 2,
                gap: 2,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
              },
            },
          }}
        />
      </SessionContext.Provider>
    </AuthenticationContext.Provider>
  );
}
