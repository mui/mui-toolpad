import * as React from 'react';
import PropTypes from 'prop-types';
import {
  Menu,
  MenuItem,
  MenuList,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Stack,
} from '@mui/material';
import { AccountDetails } from '@toolpad/core';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';

const accounts = [
  {
    id: 1,
    name: 'Bharat Kashyap',
    email: 'bharatkashyap@outlook.com',
    image: 'https://avatars.githubusercontent.com/u/19550456',
    projects: [
      {
        id: 3,
        title: 'Project X',
      },
    ],
  },
  {
    id: 2,
    name: 'Bharat MUI',
    email: 'bharat@mui.com',
    color: '#8B4513', // Brown color
    projects: [{ id: 4, title: 'Project A' }],
  },
];

function ProjectsList(props) {
  const { open, anchorEl, handleMenuClose, handleEnter, handleLeave, projects } =
    props;

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
          minWidth: 200,
        }}
        disablePadding
        onMouseEnter={() => {
          handleEnter();
        }}
        onMouseLeave={handleLeave}
      >
        <Typography variant="caption" padding={1}>
          Projects
        </Typography>
        <Divider />
        {projects?.map((project) => (
          <MenuItem
            key={project.id}
            onClick={handleMenuClose}
            sx={{ px: 1, my: 1, columnGap: '1.25rem' }}
          >
            <ListItemIcon sx={{ minWidth: 24 }}>
              <FolderIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={project.title}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </MenuItem>
        ))}
        <Divider />
        <Button
          variant="text"
          sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto' }}
          size="small"
          startIcon={<AddIcon />}
          disableElevation
        >
          Create new
        </Button>
      </MenuList>
    </Menu>
  );
}

ProjectsList.propTypes = {
  anchorEl: PropTypes.object,
  handleEnter: PropTypes.func.isRequired,
  handleLeave: PropTypes.func.isRequired,
  handleMenuClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default function CustomMenu() {
  const mouseOnSubMenu = React.useRef(false);
  const mouseOnMenuItem = React.useRef(false);

  const [selectedProjects, setSelectedProjects] = React.useState([]);

  const handleSelectProjects = React.useCallback((id) => {
    setSelectedProjects(
      accounts.find((account) => account.id === id)?.projects ?? [],
    );
  }, []);

  const [subMenuAnchorEl, setSubMenuAnchorEl] = React.useState(null);
  const subMenuOpen = Boolean(subMenuAnchorEl);

  const handleTriggerEnter = React.useCallback(
    (event, id) => {
      handleSelectProjects(id);
      setSubMenuAnchorEl(event.currentTarget);
      // Wait for 300ms to see if the mouse has moved to a menu item
      setTimeout(() => {
        mouseOnMenuItem.current = true;
      }, 300);
    },
    [handleSelectProjects],
  );

  const handleTriggerLeave = React.useCallback(() => {
    mouseOnMenuItem.current = false;
    // Wait for 320ms to see if the mouse has moved to the sub menu
    // Timeout must be > 300ms to allow for `mouseOnMenuItem.current` to update
    // inside `handleTriggerEnter`
    setTimeout(() => {
      if (mouseOnSubMenu.current || mouseOnMenuItem.current) {
        return;
      }

      setSubMenuAnchorEl(null);
    }, 320);
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
    <Stack direction="column">
      <AccountDetails />
      <MenuList dense disablePadding>
        <Typography variant="body2" margin={1}>
          Accounts
        </Typography>
        {accounts.map((account) => (
          <MenuItem
            key={account.id}
            component="button"
            sx={{
              justifyContent: 'flex-start',
              width: '100%',
              columnGap: 2,
            }}
            // onClick={() => handleSelectProjects(account.id)}
            onMouseEnter={(event) => handleTriggerEnter(event, account.id)}
            onMouseLeave={handleTriggerLeave}
          >
            <ListItemIcon>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.95rem',
                  bgcolor: account.color,
                }}
                src={account.image ?? ''}
                alt={account.name ?? ''}
              >
                {account.name[0]}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: '100%',
              }}
              primary={account.name}
              secondary={account.email}
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
        ))}

        <Divider />
        <ProjectsList
          open={subMenuOpen}
          anchorEl={subMenuAnchorEl}
          handleEnter={handleSubMenuEnter}
          handleLeave={handleSubMenuLeave}
          handleMenuClose={handleSubMenuClose}
          projects={selectedProjects}
        />
      </MenuList>
    </Stack>
  );
}
