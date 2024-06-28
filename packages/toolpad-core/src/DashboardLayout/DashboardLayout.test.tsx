/**
 * @vitest-environment jsdom
 */

import * as React from 'react';
import { describe, test, expect } from 'vitest';
import { render, within, screen } from '@testing-library/react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import LayersIcon from '@mui/icons-material/Layers';
import userEvent from '@testing-library/user-event';
import { BrandingContext, NavigationContext } from '../shared/context';
import type { Navigation } from '../AppProvider';
import { DashboardLayout } from './DashboardLayout';

describe('DashboardLayout', () => {
  test('renders content correctly', async () => {
    render(<DashboardLayout>Hello world</DashboardLayout>);

    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  test('renders branding correctly in header', async () => {
    const BRANDING = {
      title: 'My Company',
      logo: <img src="https://placehold.co/600x400" alt="Placeholder Logo" />,
    };

    render(
      <BrandingContext.Provider value={BRANDING}>
        <DashboardLayout>Hello world</DashboardLayout>
      </BrandingContext.Provider>,
    );

    const header = screen.getByRole('banner');

    expect(within(header).getByText('My Company')).toBeTruthy();
    expect(within(header).getByAltText('Placeholder Logo')).toBeTruthy();
  });

  test('navigation works correctly', async () => {
    const NAVIGATION: Navigation = [
      {
        kind: 'header',
        title: 'Main items',
      },
      {
        title: 'Dashboard',
        slug: '/dashboard',
        icon: <DashboardIcon />,
      },
      {
        title: 'Orders',
        slug: '/orders',
        icon: <ShoppingCartIcon />,
      },
      {
        kind: 'divider',
      },
      {
        kind: 'header',
        title: 'Analytics',
      },
      {
        title: 'Reports',
        icon: <BarChartIcon />,
        children: [
          {
            title: 'Sales',
            icon: <DescriptionIcon />,
          },
          {
            title: 'Traffic',
            icon: <DescriptionIcon />,
          },
        ],
      },
      {
        title: 'Integrations',
        icon: <LayersIcon />,
      },
    ];

    const user = userEvent.setup();
    render(
      <NavigationContext.Provider value={NAVIGATION}>
        <DashboardLayout>Hello world</DashboardLayout>
      </NavigationContext.Provider>,
    );

    const navigation = screen.getByRole('navigation');

    // Check list subheaders

    expect(within(navigation).getByText('Main items')).toBeTruthy();
    expect(within(navigation).getByText('Analytics')).toBeTruthy();

    // Check list items and their links

    const dashboardItem = within(navigation).getByRole('link', { name: 'Dashboard' });
    const ordersItem = within(navigation).getByRole('link', { name: 'Orders' });

    expect(dashboardItem.getAttribute('href')).toBe('/dashboard');
    expect(ordersItem.getAttribute('href')).toBe('/orders');

    const reportsItem = within(navigation).getByText('Reports');

    expect(reportsItem).toBeTruthy();
    expect(within(navigation).getByText('Integrations')).toBeTruthy();

    expect(within(navigation).queryByText('Sales')).toBeNull();
    expect(within(navigation).queryByText('Traffic')).toBeNull();

    // Check nested list items
    await user.click(reportsItem);

    expect(within(navigation).getByText('Sales')).toBeTruthy();
    expect(within(navigation).getByText('Traffic')).toBeTruthy();
  });
});
