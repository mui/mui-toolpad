/**
 * @vitest-environment jsdom
 */

import * as React from 'react';
import { describe } from 'vitest';
import describeConformance from '@toolpad/utils/describeConformance';
import { NotificationsProvider } from './NotificationsProvider';

describe('NotificationsProvider', () => {
  describeConformance(<NotificationsProvider />, () => ({
    skip: ['themeDefaultProps'],
    slots: {
      snackbar: {},
    },
  }));
});
