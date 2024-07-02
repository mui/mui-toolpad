import * as React from 'react';
import { PageContent } from '@toolpad/core/PageContent';
import { AppProvider } from '@toolpad/core/AppProvider';

const NAVIGATION = [
  {
    kind: 'header' as const,
    title: 'Main items',
  },
  {
    slug: '',
    title: 'Dashboard',
    icon: 'DashboardIcon',
  },
  {
    slug: 'orders',
    title: 'Orders',
    icon: 'ShoppingCartIcon',
  },
];

export default function BasicPageContent() {
  return (
    <AppProvider navigation={NAVIGATION}>
      <PageContent>The content</PageContent>
    </AppProvider>
  );
}
