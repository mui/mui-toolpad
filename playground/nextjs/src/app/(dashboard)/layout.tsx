import * as React from 'react';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContent } from '@toolpad/core/PageContent';

export default function DashboardPagesLayout(props: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <PageContent>{props.children}</PageContent>
    </DashboardLayout>
  );
}
