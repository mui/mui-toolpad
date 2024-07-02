import * as React from 'react';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { redirect } from 'next/navigation';
import { auth } from '../../auth';

export default async function DashboardPagesLayout(props: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return <DashboardLayout>{props.children}</DashboardLayout>;
}
