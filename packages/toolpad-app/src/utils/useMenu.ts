import { ButtonProps, MenuProps } from '@mui/material';
import * as React from 'react';

export default function useMenu() {
  const buttonId = React.useId();
  const menuId = React.useId();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const onMenuClose = React.useCallback(() => setAnchorEl(null), []);

  const buttonProps = React.useMemo<ButtonProps>(
    () => ({
      id: buttonId,
      'aria-controls': open ? menuId : undefined,
      'aria-haspopup': 'true',
      'aria-expanded': open ? 'true' : undefined,
      onClick(event: React.MouseEvent<HTMLButtonElement>) {
        setAnchorEl(event.currentTarget);
      },
    }),
    [buttonId, menuId, open],
  );

  const menuProps = React.useMemo<MenuProps>(
    () => ({
      id: menuId,
      anchorEl,
      open,
      onClose: onMenuClose,
      MenuListProps: {
        'aria-labelledby': buttonId,
      },
    }),
    [anchorEl, buttonId, menuId, onMenuClose, open],
  );

  return {
    buttonProps,
    menuProps,
    onMenuClose,
  };
}
