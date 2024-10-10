import * as React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Avatar, Link } from '@mui/material';
import { Account, AuthenticationContext, SessionContext } from '@toolpad/core';

const demoSession = {
  user: {
    name: 'Bharat Kashyap',
    email: 'bharat@mui.com',
    image: 'https://avatars.githubusercontent.com/u/19550456',
  },
  org: {
    name: 'MUI Inc.',
    url: 'https://mui.com',
    logo: 'https://mui.com/static/logo.svg',
  },
};

function UserDetailsContainer({ session }) {
  if (!session?.user) {
    return <Typography>No user session available</Typography>;
  }
  const { name, email, image } = session.user;
  const { logo: orgLogo, name: orgName, url: orgUrl } = session.org;

  return (
    <Box sx={{ p: 2 }}>
      <Stack>
        <Stack flexDirection="row" gap={2} justifyContent="flex-start" mb={2}>
          <Avatar src={image ?? ''} alt={name ?? ''} />
          <Stack>
            <Typography fontWeight="bolder">{name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {email}
            </Typography>
          </Stack>
        </Stack>
        {session.org && (
          <Stack>
            <Typography textAlign="center" fontSize="0.625rem" gutterBottom>
              This account is managed by
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
              <Avatar
                variant="square"
                src={orgLogo}
                alt={orgName}
                sx={{ width: 27, height: 24 }}
              />
              <Stack>
                <Typography variant="caption" fontWeight="bolder">
                  {orgName}
                </Typography>
                <Link
                  variant="caption"
                  href={orgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {orgUrl}
                </Link>
              </Stack>
            </Box>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

UserDetailsContainer.propTypes = {
  session: PropTypes.shape({
    org: PropTypes.shape({
      logo: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    }).isRequired,
    user: PropTypes.shape({
      email: PropTypes.string,
      id: PropTypes.string,
      image: PropTypes.string,
      name: PropTypes.string,
    }),
  }).isRequired,
};

export default function AccountCustomUserDetails() {
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
        {/* preview-start */}
        <Account
          slots={{
            userDetailsContainer: UserDetailsContainer,
          }}
        />
        {/* preview-end */}
      </SessionContext.Provider>
    </AuthenticationContext.Provider>
  );
}
