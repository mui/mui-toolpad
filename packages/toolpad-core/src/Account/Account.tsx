import * as React from 'react';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import Popover from '@mui/material/Popover';
import Avatar from '@mui/material/Avatar';
import Button, { ButtonProps } from '@mui/material/Button';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Logout from '@mui/icons-material/Logout';
import { AccountDetails } from './AccountDetails';
import { SessionContext, AuthenticationContext } from '../AppProvider/AppProvider';
import DEFAULT_LOCALE_TEXT from '../shared/locales/en';

const SignOutContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  padding: theme.spacing(1),
  justifyContent: 'flex-end',
}));

export interface AccountSlots {
  /**
   * The component used for the icon button
   * @default IconButton
   */
  iconButton?: React.ElementType;
  /**
   * The component used for the sign in button.
   * @default Button
   */
  signInButton?: React.ElementType;
  /**
   * The component used for the sign out button.
   * @default MenuItem
   */
  signOutButton?: React.ElementType;
  /**
   * The component used for the content of the popover
   * @default null
   */
  content?: React.ElementType;
}

export interface AccountProps {
  /**
   * The components used for each slot inside.
   */
  slots?: AccountSlots;
  /**
   * The props used for each slot inside.
   */
  slotProps?: {
    signInButton?: ButtonProps;
    signOutButton?: ButtonProps;
    iconButton?: IconButtonProps;
  };
  /**
   * The labels for the account component.
   * @default DEFAULT_LOCALE_TEXT
   */
  localeText?: typeof DEFAULT_LOCALE_TEXT;
}
/**
 *
 * Demos:
 *
 * - [Account](https://mui.com/toolpad/core/react-account/)
 * - [Dashboard Layout](https://mui.com/toolpad/core/react-dashboard-layout/)
 * - [Sign-in Page](https://mui.com/toolpad/core/react-sign-in-page/)
 *
 * API:
 *
 * - [Account API](https://mui.com/toolpad/core/api/account)
 */
function Account(props: AccountProps) {
  const { slots, slotProps, localeText = DEFAULT_LOCALE_TEXT } = props;
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const session = React.useContext(SessionContext);
  const authentication = React.useContext(AuthenticationContext);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  if (!authentication) {
    return null;
  }

  if (!session?.user) {
    return slots?.signInButton ? (
      <slots.signInButton onClick={authentication.signIn} />
    ) : (
      <Button
        disableElevation
        variant="contained"
        color="inherit"
        size="small"
        onClick={authentication.signIn}
        sx={{
          textTransform: 'capitalize',
          filter: 'opacity(0.9)',
          transition: 'filter 0.2s ease-in',
          '&:hover': {
            filter: 'opacity(1)',
          },
        }}
        {...slotProps?.signInButton}
      >
        {localeText?.signInLabel}
      </Button>
    );
  }
  return (
    <React.Fragment>
      <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
        <Tooltip title={session.user.name ?? 'Account'}>
          {slots?.iconButton ? (
            <slots.iconButton />
          ) : (
            <IconButton
              onClick={handleClick}
              aria-describedby="account-menu"
              aria-label="Current User"
              size="small"
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              {...slotProps?.iconButton}
            >
              <Avatar
                sx={{ height: 32, width: 32 }}
                src={session.user.image || ''}
                alt={session.user.name || ''}
              />
            </IconButton>
          )}
        </Tooltip>
      </div>
      <Popover
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClick={handleClose}
        onClose={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1,
              // Attach a caret to the dropdown menu
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {slots?.content ? <slots.content /> : <AccountDetails />}
        {slots?.signOutButton ? (
          <slots.signOutButton onClick={authentication?.signOut} />
        ) : (
          <SignOutContainer>
            <Button
              disabled={!authentication}
              variant="outlined"
              size="small"
              disableElevation
              onClick={authentication?.signOut}
              sx={{
                textTransform: 'capitalize',
                fontWeight: 'normal',
                filter: 'opacity(0.9)',
                transition: 'filter 0.2s ease-in',
                '&:hover': {
                  filter: 'opacity(1)',
                },
              }}
              startIcon={<Logout />}
              {...slotProps?.signOutButton}
            >
              {localeText?.signOutLabel}
            </Button>
          </SignOutContainer>
        )}
      </Popover>
    </React.Fragment>
  );
}

Account.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The labels for the account component.
   * @default DEFAULT_LOCALE_TEXT
   */
  localeText: PropTypes.shape({
    signInLabel: PropTypes.string.isRequired,
    signOutLabel: PropTypes.string.isRequired,
  }),
  /**
   * The props used for each slot inside.
   */
  slotProps: PropTypes.shape({
    iconButton: PropTypes.object,
    signInButton: PropTypes.object,
    signOutButton: PropTypes.object,
  }),
  /**
   * The components used for each slot inside.
   */
  slots: PropTypes.shape({
    content: PropTypes.elementType,
    iconButton: PropTypes.elementType,
    signInButton: PropTypes.elementType,
    signOutButton: PropTypes.elementType,
  }),
} as any;

export { Account };
