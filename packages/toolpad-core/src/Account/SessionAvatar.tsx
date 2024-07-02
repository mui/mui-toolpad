import * as React from 'react';
import Avatar, { AvatarProps } from '@mui/material/Avatar';
import { Session } from '../AppProvider/AppProvider';

/**
 * @ignore - internal component.
 */

export interface SessionAvatarProps extends AvatarProps {
  session: Session;
}

export function SessionAvatar({ session, ...props }: SessionAvatarProps) {
  return (
    <Avatar
      src={session.user?.image || ''}
      alt={session.user?.name || session.user?.email || ''}
      {...props}
    />
  );
}
