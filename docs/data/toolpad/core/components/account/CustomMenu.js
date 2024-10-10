import * as React from 'react';
import PropTypes from 'prop-types';
import {
  Menu,
  MenuItem,
  MenuList,
  Divider,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SettingsIcon from '@mui/icons-material/Settings';

// Function to generate a random color
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i += 1) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const accounts = [
  { id: 1, name: 'John Doe', email: 'john@example.com', color: getRandomColor() },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', color: getRandomColor() },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', color: getRandomColor() },
];

function AccountSwitcher(props) {
  const { open, anchorEl, handleMenuClose, handleEnter, handleLeave } = props;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      slotProps={{
        root: {
          sx: {
            pointerEvents: 'none',
          },
        },
      }}
      anchorOrigin={{
        horizontal: 'right',
        vertical: 'top',
      }}
    >
      <MenuList
        sx={{
          pointerEvents: 'auto',
        }}
        disablePadding
        onMouseEnter={() => {
          handleEnter();
        }}
        onMouseLeave={handleLeave}
      >
        <Typography variant="body2" margin={1}>
          Accounts
        </Typography>
        <Divider />
        {accounts.map((account) => (
          <MenuItem
            key={account.id}
            onClick={handleMenuClose}
            sx={{ columnGap: '1.25rem' }}
          >
            <ListItemIcon>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.95rem',
                  bgcolor: account.color,
                }}
              >
                {account.name.charAt(0)}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={account.name}
              secondary={account.email}
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}

AccountSwitcher.propTypes = {
  anchorEl: PropTypes.object,
  handleEnter: PropTypes.func.isRequired,
  handleLeave: PropTypes.func.isRequired,
  handleMenuClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default function CustomMenu() {
  const handleMenuNavigation = (route) => () => {
    console.log(
      'Toolpad Core Account Demo --- CustomContent --- handleMenuNavigation --- route: ',
      route,
    );
  };

  const mouseOnSubMenu = React.useRef(false);

  const [subMenuAnchorEl, setSubMenuAnchorEl] = React.useState(null);
  const subMenuOpen = Boolean(subMenuAnchorEl);

  const handleTriggerEnter = React.useCallback((event) => {
    setSubMenuAnchorEl(event.currentTarget);
  }, []);

  const handleTriggerLeave = React.useCallback(() => {
    // Wait for 300ms to see if the mouse has moved to the sub menu
    setTimeout(() => {
      if (mouseOnSubMenu.current) {
        return;
      }
      setSubMenuAnchorEl(null);
    }, 300);
  }, []);

  const handleSubMenuEnter = React.useCallback(() => {
    mouseOnSubMenu.current = true;
  }, []);

  const handleSubMenuLeave = (event) => {
    mouseOnSubMenu.current = false;
    if (subMenuAnchorEl?.contains(event.relatedTarget)) {
      return;
    }
    setSubMenuAnchorEl(null);
  };

  const handleSubMenuClose = React.useCallback(() => {
    setSubMenuAnchorEl(null);
  }, []);

  return (
    <MenuList dense disablePadding>
      <MenuItem
        onClick={handleMenuNavigation('/profile')}
        component="button"
        sx={{
          justifyContent: 'flex-start',
          width: '100%',
        }}
      >
        <ListItemIcon>
          <PersonIcon />
        </ListItemIcon>
        Profile
      </MenuItem>
      <MenuItem
        onClick={handleMenuNavigation('/settings')}
        component="button"
        sx={{
          justifyContent: 'flex-start',
          width: '100%',
        }}
      >
        <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>
        Settings
      </MenuItem>
      <MenuItem
        onMouseEnter={handleTriggerEnter}
        onMouseLeave={handleTriggerLeave}
        component="button"
        sx={{
          justifyContent: 'flex-start',
          width: '100%',
        }}
      >
        <ListItemIcon>
          <ExitToAppIcon />
        </ListItemIcon>
        Switch Account
      </MenuItem>

      <Divider />
      <AccountSwitcher
        open={subMenuOpen}
        anchorEl={subMenuAnchorEl}
        handleEnter={handleSubMenuEnter}
        handleLeave={handleSubMenuLeave}
        handleMenuClose={handleSubMenuClose}
      />
    </MenuList>
  );
}
