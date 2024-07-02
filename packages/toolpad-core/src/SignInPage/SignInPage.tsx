'use client';

import * as React from 'react';
import PropTypes from 'prop-types';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import PasswordIcon from '@mui/icons-material/Password';
import Stack from '@mui/material/Stack';
import { BrandingContext } from '../AppProvider';

const IconProviderMap = new Map<string, React.ReactNode>([
  ['github', <GitHubIcon key="github" />],
  ['credentials', <PasswordIcon key="credentials" />],
  [
    'google',
    <img
      alt="Google logo"
      loading="lazy"
      key="google"
      height="18"
      width="18"
      src="https://authjs.dev/img/providers/google.svg"
      style={{ marginLeft: '2px', marginRight: '2px' }}
    />,
  ],
]);

export interface AuthProvider {
  id: string;
  name: string;
}

export interface SignInPageProps {
  /**
   * The list of authentication providers to display.
   * @default []
   */
  providers?: AuthProvider[];
  /**
   * Callback fired when a user signs in.
   * @param provider The authentication provider.
   * @param formData The form data if the provider is 'credentials'.
   * @default undefined
   */
  signIn?: (provider: AuthProvider, formData?: FormData) => void;
}

/**
 *
 * Demos:
 *
 * - [Sign In Page](https://mui.com/toolpad/core/react-sign-in-page/)
 *
 * API:
 *
 * - [SignInPage API](https://mui.com/toolpad/core/api/sign-in-page)
 */
function SignInPage(props: SignInPageProps) {
  const { providers, signIn } = props;
  const branding = React.useContext(BrandingContext);
  const credentialsProvider = providers?.find((provider) => provider.id === 'credentials');

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          {branding?.logo ?? <LockOutlinedIcon />}
        </Avatar>
        <Typography variant="h5" gutterBottom>
          Sign in {branding?.title ? `to ${branding.title}` : null}
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Welcome user, please sign in to continue
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Stack spacing={1}>
            {Object.values(providers ?? {}).map((provider) => {
              if (provider.id === 'credentials') {
                return null;
              }
              return (
                <form
                  key={provider.id}
                  onSubmit={(event) => {
                    event.preventDefault();
                    signIn?.(provider);
                  }}
                >
                  <LoadingButton
                    key={provider.id}
                    variant="contained"
                    type="submit"
                    fullWidth
                    size="large"
                    disableElevation
                    name={'provider'}
                    value={provider.id}
                    startIcon={IconProviderMap.get(provider.id)}
                    color="inherit"
                    sx={{
                      textTransform: 'capitalize',
                      filter: 'opacity(0.9)',
                      transition: 'filter 0.2s ease-in',
                      '&:hover': {
                        filter: 'opacity(1)',
                      },
                    }}
                  >
                    <span>Sign in with {provider.name}</span>
                  </LoadingButton>
                </form>
              );
            })}
          </Stack>

          {credentialsProvider ? (
            <React.Fragment>
              <Divider sx={{ mt: 2, mx: 0, mb: 1 }}>or</Divider>
              <Box
                component="form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  signIn?.(credentialsProvider, formData);
                }}
                noValidate
              >
                <TextField
                  margin="dense"
                  required
                  inputProps={{
                    sx: { paddingTop: '12px', paddingBottom: '12px' },
                  }}
                  InputLabelProps={{
                    sx: { lineHeight: '1rem' },
                  }}
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                />
                <TextField
                  margin="dense"
                  required
                  fullWidth
                  inputProps={{
                    sx: { paddingTop: '12px', paddingBottom: '12px' },
                  }}
                  InputLabelProps={{
                    sx: { lineHeight: '1rem' },
                  }}
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                />
                <FormControlLabel
                  control={<Checkbox value="remember" color="primary" />}
                  label="Remember me"
                  slotProps={{ typography: { color: 'textSecondary' } }}
                />
                <Button
                  type="submit"
                  fullWidth
                  size="large"
                  variant="contained"
                  disableElevation
                  color="inherit"
                  sx={{
                    mt: 3,
                    mb: 2,
                    textTransform: 'capitalize',
                    filter: 'opacity(0.9)',
                    transition: 'filter 0.2s ease-in',
                    '&:hover': {
                      filter: 'opacity(1)',
                    },
                  }}
                >
                  Sign in with username and password
                </Button>
                <Grid container>
                  <Grid item xs>
                    <Link href="/" variant="body2">
                      Forgot password?
                    </Link>
                  </Grid>
                  <Grid item>
                    <Link href="/" variant="body2">
                      {"Don't have an account? Sign Up"}
                    </Link>
                  </Grid>
                </Grid>
              </Box>
            </React.Fragment>
          ) : null}
        </Box>
      </Box>
    </Container>
  );
}

SignInPage.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   * The list of authentication providers to display.
   * @default []
   */
  providers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  /**
   * @ignore
   * Callback fired when a user signs in.
   * @param provider The authentication provider.
   * @param formData The form data if the provider is 'credentials'.
   * @default undefined
   */
  signIn: PropTypes.func,
} as any;

export { SignInPage };
