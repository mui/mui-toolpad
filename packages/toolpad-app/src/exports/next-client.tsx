'use client';

import * as React from 'react';
import ToolpadApp, { ToolpadAppProps } from '../runtime/ToolpadApp';
import { AppHostContext, AppHost } from '../runtime/AppHostContext';

const appContext: AppHost = {
  isPreview: false,
  isCustomServer: true,
};

export default function ToolpadAppClient(props: ToolpadAppProps) {
  return (
    <AppHostContext.Provider value={appContext}>
      <ToolpadApp {...props} />
    </AppHostContext.Provider>
  );
}
