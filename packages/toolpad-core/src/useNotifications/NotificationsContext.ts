'use client';
import * as React from 'react';
import type { ShowNotification, CloseNotification, RemoveNotification } from './useNotifications';

/**
 * @ignore - internal component.
 */

export interface NotificationsContextValue {
  show: ShowNotification;
  close: CloseNotification;
  remove: RemoveNotification;
}

export const NotificationsContext = React.createContext<NotificationsContextValue | null>(null);
