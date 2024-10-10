/**
 * @vitest-environment jsdom
 */

import * as React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, within, screen } from '@testing-library/react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import LayersIcon from '@mui/icons-material/Layers';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { AppProvider, Navigation } from '../AppProvider';
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
      <AppProvider branding={BRANDING}>
        <DashboardLayout>Hello world</DashboardLayout>
      </AppProvider>,
    );

    const header = screen.getByRole('banner');

    expect(within(header).getByText('My Company')).toBeTruthy();
    expect(within(header).getByAltText('Placeholder Logo')).toBeTruthy();
  });

  test('can switch theme', async () => {
    const user = userEvent.setup();

    render(
      <AppProvider>
        <DashboardLayout>Hello world</DashboardLayout>
      </AppProvider>,
    );

    const getBackgroundColorCSSVariable = () =>
      getComputedStyle(document.documentElement).getPropertyValue(
        '--mui-palette-common-background',
      );

    const header = screen.getByRole('banner');

    const themeSwitcherButton = within(header).getByLabelText('Switch to dark mode');

    expect(getBackgroundColorCSSVariable()).toBe('#fff');

    await user.click(themeSwitcherButton);

    expect(getBackgroundColorCSSVariable()).toBe('#000');

    await user.click(themeSwitcherButton);

    expect(getBackgroundColorCSSVariable()).toBe('#fff');
  });

  test('navigation works correctly', async () => {
    const NAVIGATION: Navigation = [
      {
        kind: 'header',
        title: 'Main items',
      },
      {
        title: 'Dashboard',
        segment: 'dashboard',
        icon: <DashboardIcon />,
      },
      {
        title: 'Orders',
        segment: 'orders',
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
        segment: 'reports',
        title: 'Reports',
        icon: <BarChartIcon />,
        children: [
          {
            segment: 'sales',
            title: 'Sales',
            icon: <DescriptionIcon />,
          },
          {
            segment: 'traffic',
            title: 'Traffic',
            icon: <DescriptionIcon />,
          },
        ],
      },
      {
        segment: 'integrations',
        title: 'Integrations',
        icon: <LayersIcon />,
      },
    ];

    const user = userEvent.setup();

    render(
      <AppProvider navigation={NAVIGATION}>
        <DashboardLayout>Hello world</DashboardLayout>
      </AppProvider>,
    );

    const desktopNavigation = screen.getByRole('navigation', { name: 'Desktop' });

    // List subheaders are present

    expect(within(desktopNavigation).getByText('Main items')).toBeTruthy();
    expect(within(desktopNavigation).getByText('Analytics')).toBeTruthy();

    // List items and their links are present

    const dashboardLink = within(desktopNavigation).getByRole('link', { name: 'Dashboard' });
    const ordersLink = within(desktopNavigation).getByRole('link', { name: 'Orders' });

    expect(dashboardLink.getAttribute('href')).toBe('/dashboard');
    expect(ordersLink.getAttribute('href')).toBe('/orders');

    const reportsItem = within(desktopNavigation).getByText('Reports');

    expect(reportsItem).toBeTruthy();
    expect(within(desktopNavigation).getByText('Integrations')).toBeTruthy();

    // Nested list items show when parent item is clicked

    expect(within(desktopNavigation).queryByText('Sales')).toBeNull();
    expect(within(desktopNavigation).queryByText('Traffic')).toBeNull();

    await user.click(reportsItem);

    expect(within(desktopNavigation).getByText('Sales')).toBeTruthy();
    expect(within(desktopNavigation).getByText('Traffic')).toBeTruthy();
  });

  test('starts with parent items expanded if any of their children is the current page', () => {
    const NAVIGATION: Navigation = [
      {
        segment: 'reports',
        title: 'Reports',
        icon: <BarChartIcon />,
        children: [
          {
            segment: 'sales',
            title: 'Sales',
            icon: <DescriptionIcon />,
          },
          {
            segment: 'traffic',
            title: 'Traffic',
            icon: <DescriptionIcon />,
          },
        ],
      },
    ];

    const mockRouter = {
      pathname: '/reports/sales',
      searchParams: new URLSearchParams(),
      navigate: vi.fn(),
    };

    render(
      <AppProvider navigation={NAVIGATION} router={mockRouter}>
        <DashboardLayout>Hello world</DashboardLayout>
      </AppProvider>,
    );

    const desktopNavigation = screen.getByRole('navigation', { name: 'Desktop' });

    expect(within(desktopNavigation).getByText('Sales')).toBeTruthy();
    expect(within(desktopNavigation).getByText('Traffic')).toBeTruthy();
  });

  test('shows correct selected page item', () => {
    const NAVIGATION: Navigation = [
      {
        title: 'Dashboard',
        segment: 'dashboard',
        icon: <DashboardIcon />,
      },
      {
        title: 'Orders',
        segment: 'orders',
        icon: <ShoppingCartIcon />,
      },
      {
        segment: 'dynamic',
        title: 'Dynamic',
        icon: <BarChartIcon />,
        pattern: 'dynamic/:dynamicId',
      },
      {
        segment: 'optional',
        title: 'Optional',
        pattern: 'optional{/:optionalId}?',
      },
      {
        segment: 'oneOrMore',
        title: 'One or more',
        pattern: 'oneormore{/:oneormoreId}+',
      },
      {
        segment: 'zeroOrMore',
        title: 'Zero or more',
        pattern: 'zeroormore{/:zeroormoreId}*',
      },
    ];

    function AppWithPathname({ pathname }: { pathname: string }) {
      const mockRouter = {
        pathname,
        searchParams: new URLSearchParams(),
        navigate: vi.fn(),
      };

      return (
        <AppProvider navigation={NAVIGATION} router={mockRouter}>
          <DashboardLayout>Hello world</DashboardLayout>
        </AppProvider>
      );
    }

    const { rerender } = render(<AppWithPathname pathname="/dashboard" />);

    const desktopNavigation = screen.getByRole('navigation', { name: 'Desktop' });

    expect(within(desktopNavigation).getByRole('link', { name: 'Dashboard' })).toHaveClass(
      'Mui-selected',
    );

    rerender(<AppWithPathname pathname="/orders" />);

    expect(within(desktopNavigation).getByRole('link', { name: 'Dashboard' })).not.toHaveClass(
      'Mui-selected',
    );
    expect(within(desktopNavigation).getByRole('link', { name: 'Orders' })).toHaveClass(
      'Mui-selected',
    );

    rerender(<AppWithPathname pathname="/dynamic" />);
    expect(within(desktopNavigation).getByRole('link', { name: 'Dynamic' })).not.toHaveClass(
      'Mui-selected',
    );
    rerender(<AppWithPathname pathname="/dynamic/123" />);
    expect(within(desktopNavigation).getByRole('link', { name: 'Dynamic' })).toHaveClass(
      'Mui-selected',
    );
    rerender(<AppWithPathname pathname="/dynamic/123/456" />);
    expect(within(desktopNavigation).getByRole('link', { name: 'Dynamic' })).not.toHaveClass(
      'Mui-selected',
    );

    rerender(<AppWithPathname pathname="/optional" />);
    expect(within(desktopNavigation).getByRole('link', { name: 'Optional' })).toHaveClass(
      'Mui-selected',
    );
    rerender(<AppWithPathname pathname="/optional/123" />);
    expect(within(desktopNavigation).getByRole('link', { name: 'Optional' })).toHaveClass(
      'Mui-selected',
    );
    rerender(<AppWithPathname pathname="/optional/123/456" />);
    expect(within(desktopNavigation).getByRole('link', { name: 'Optional' })).not.toHaveClass(
      'Mui-selected',
    );

    rerender(<AppWithPathname pathname="/oneormore" />);
    expect(within(desktopNavigation).getByRole('link', { name: 'One or more' })).not.toHaveClass(
      'Mui-selected',
    );
    rerender(<AppWithPathname pathname="/oneormore/123" />);
    expect(within(desktopNavigation).getByRole('link', { name: 'One or more' })).toHaveClass(
      'Mui-selected',
    );
    rerender(<AppWithPathname pathname="/oneormore/123/456" />);
    expect(within(desktopNavigation).getByRole('link', { name: 'One or more' })).toHaveClass(
      'Mui-selected',
    );

    rerender(<AppWithPathname pathname="/zeroormore" />);
    expect(within(desktopNavigation).getByRole('link', { name: 'Zero or more' })).toHaveClass(
      'Mui-selected',
    );
    rerender(<AppWithPathname pathname="/zeroormore/123" />);
    expect(within(desktopNavigation).getByRole('link', { name: 'Zero or more' })).toHaveClass(
      'Mui-selected',
    );
    rerender(<AppWithPathname pathname="/zeroormore/123/456" />);
    expect(within(desktopNavigation).getByRole('link', { name: 'Zero or more' })).toHaveClass(
      'Mui-selected',
    );
  });

  test('renders navigation actions', async () => {
    const NAVIGATION: Navigation = [
      {
        title: 'Item 1',
        segment: 'item1',
        icon: <DescriptionIcon />,
        action: <div>Action 1</div>,
      },
      {
        title: 'Item',
        segment: 'item2',
        icon: <DescriptionIcon />,
        action: <div>Action 2</div>,
      },
    ];

    render(
      <AppProvider navigation={NAVIGATION}>
        <DashboardLayout>Hello world</DashboardLayout>
      </AppProvider>,
    );

    const desktopNavigation = screen.getByRole('navigation', { name: 'Desktop' });

    expect(within(desktopNavigation).getByText('Action 1')).toBeTruthy();
    expect(within(desktopNavigation).getByText('Action 2')).toBeTruthy();
  });

  test('renders without the navigation and toggle button', async () => {
    const NAVIGATION: Navigation = [
      {
        title: 'Dashboard',
        segment: 'dashboard',
        icon: <DashboardIcon />,
      },
      {
        title: 'Orders',
        segment: 'orders',
        icon: <ShoppingCartIcon />,
      },
    ];

    render(
      <AppProvider navigation={NAVIGATION}>
        <DashboardLayout hideNavigation>Hello world</DashboardLayout>
      </AppProvider>,
    );

    const desktopNavigation = screen.queryByRole('navigation', { name: 'Desktop' });
    const navigationToggle = screen.queryByLabelText('Collapse menu');

    // Expect that navigation and menu button are not rendered
    expect(desktopNavigation).toBeNull();
    expect(navigationToggle).toBeNull();

    // Ensure that main content is still rendered
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  test('renders without default collapsed navigation on desktop', async () => {
    const NAVIGATION: Navigation = [
      {
        title: 'Dashboard',
        segment: 'dashboard',
        icon: <DashboardIcon />,
      },
    ];

    render(
      <AppProvider navigation={NAVIGATION}>
        <DashboardLayout defaultSidebarCollapsed>Hello world</DashboardLayout>
      </AppProvider>,
    );

    // Expect that menu button has expand action
    expect(screen.getAllByLabelText('Expand menu')).toBeTruthy();
    expect(screen.queryByLabelText('Collapse menu')).toBeNull();

    // Ensure that main content is still rendered
    expect(screen.getByText('Hello world')).toBeTruthy();
  });
});
