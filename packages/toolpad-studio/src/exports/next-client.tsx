'use client';

import * as React from 'react';
import { AppHostProvider } from '@toolpad/studio-runtime';
import ToolpadApp, { ToolpadAppProps } from '../runtime/ToolpadApp';

export default function ToolpadAppClient(props: ToolpadAppProps) {
  return (
    <AppHostProvider isPreview>
      <ToolpadApp {...props} />
    </AppHostProvider>
  );
}
