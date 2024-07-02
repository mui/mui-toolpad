import * as React from 'react';

/**
 * @ignore - internal component.
 */

export interface NavigationPageItem {
  kind?: 'page';
  title?: string;
  slug: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
}

export interface NavigationSubheaderItem {
  kind: 'header';
  title: string;
}

export interface NavigationDividerItem {
  kind: 'divider';
}

export type NavigationItem = NavigationPageItem | NavigationSubheaderItem | NavigationDividerItem;

export type Navigation = NavigationItem[];

export const NavigationContext = React.createContext<Navigation>([]);

export const getItemKind = (item: NavigationItem) => item.kind ?? 'page';

export const isPageItem = (item: NavigationItem): item is NavigationPageItem =>
  getItemKind(item) === 'page';
