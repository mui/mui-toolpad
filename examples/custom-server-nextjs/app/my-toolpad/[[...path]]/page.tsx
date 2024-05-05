import * as React from 'react';
import { ToolpadApp } from '@toolpad/studio/next';

export default function ToolpadPage() {
  return <ToolpadApp base="/my-next-app/my-toolpad" dir="./toolpad" />;
}
