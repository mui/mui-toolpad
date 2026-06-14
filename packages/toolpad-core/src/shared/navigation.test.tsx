/**
 * @vitest-environment jsdom
 */

import { describe, test, expect } from 'vitest';
import type { Navigation } from '../AppProvider';
import { getItemPath, matchPath } from './navigation';

describe('navigation', () => {
  describe('getItemPath', () => {
    test('returns path without searchParams when not specified', () => {
      const navigation: Navigation = [
        {
          segment: 'dashboard',
          title: 'Dashboard',
        },
      ];

      const path = getItemPath(navigation, navigation[0] as any);
      expect(path).toBe('/dashboard');
    });

    test('includes searchParams when specified', () => {
      const searchParams = new URLSearchParams({ page: '2', filter: 'active' });
      const navigation: Navigation = [
        {
          segment: 'jobs',
          title: 'Jobs',
          searchParams,
        },
      ];

      const path = getItemPath(navigation, navigation[0] as any);
      expect(path).toBe('/jobs?page=2&filter=active');
    });

    test('inherits parent searchParams in nested navigation', () => {
      const parentSearchParams = new URLSearchParams({ theme: 'dark' });
      const navigation: Navigation = [
        {
          segment: 'reports',
          title: 'Reports',
          searchParams: parentSearchParams,
          children: [
            {
              segment: 'sales',
              title: 'Sales',
            },
          ],
        },
      ];

      const parent = navigation[0] as any;
      const child = parent.children[0];

      expect(getItemPath(navigation, parent)).toBe('/reports?theme=dark');
      expect(getItemPath(navigation, child)).toBe('/reports/sales?theme=dark');
    });

    test('child searchParams override parent searchParams', () => {
      const parentSearchParams = new URLSearchParams({ foo: 'bar', baz: 'quux' });
      const childSearchParams = new URLSearchParams({ foo: 'hello' });
      const navigation: Navigation = [
        {
          segment: 'movies',
          title: 'Movies',
          searchParams: parentSearchParams,
          children: [
            {
              segment: 'lord-of-the-rings',
              title: 'Lord of the Rings',
              searchParams: childSearchParams,
            },
            {
              segment: 'harry-potter',
              title: 'Harry Potter',
            },
          ],
        },
      ];

      const parent = navigation[0] as any;
      const child1 = parent.children[0];
      const child2 = parent.children[1];

      expect(getItemPath(navigation, parent)).toBe('/movies?foo=bar&baz=quux');
      expect(getItemPath(navigation, child1)).toBe('/movies/lord-of-the-rings?foo=hello&baz=quux');
      expect(getItemPath(navigation, child2)).toBe('/movies/harry-potter?foo=bar&baz=quux');
    });

    test('empty searchParams clears inherited searchParams', () => {
      const parentSearchParams = new URLSearchParams({ foo: 'bar' });
      const emptySearchParams = new URLSearchParams();
      const navigation: Navigation = [
        {
          segment: 'movies',
          title: 'Movies',
          searchParams: parentSearchParams,
          children: [
            {
              segment: 'dune',
              title: 'Dune',
              searchParams: emptySearchParams,
            },
          ],
        },
      ];

      const parent = navigation[0] as any;
      const child = parent.children[0];

      expect(getItemPath(navigation, parent)).toBe('/movies?foo=bar');
      expect(getItemPath(navigation, child)).toBe('/movies/dune');
    });
  });

  describe('matchPath', () => {
    test('matches path ignoring searchParams in navigation item', () => {
      const navigation: Navigation = [
        {
          segment: 'jobs',
          title: 'Jobs',
          searchParams: new URLSearchParams({ page: '2' }),
        },
      ];

      // matchPath should match the pathname, ignoring the searchParams defined in nav
      const match = matchPath(navigation, '/jobs');
      expect(match).toBe(navigation[0]);
    });

    test('matches path with different search params in URL', () => {
      const navigation: Navigation = [
        {
          segment: 'jobs',
          title: 'Jobs',
          searchParams: new URLSearchParams({ page: '2' }),
        },
      ];

      // Even if URL has different params, it should still match based on pathname
      const match = matchPath(navigation, '/jobs?page=1');
      expect(match).toBe(navigation[0]);
    });
  });
});
