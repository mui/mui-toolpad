import { pathToRegexp } from 'path-to-regexp';
import invariant from 'invariant';
import type {
  Navigation,
  NavigationItem,
  NavigationPageItem,
  NavigationSubheaderItem,
} from '../AppProvider';

export const getItemKind = (item: NavigationItem) => item.kind ?? 'page';

export const isPageItem = (item: NavigationItem): item is NavigationPageItem =>
  getItemKind(item) === 'page';

export const getItemTitle = (item: NavigationPageItem | NavigationSubheaderItem) => {
  return isPageItem(item) ? (item.title ?? item.segment ?? '') : item.title;
};

/**
 * Builds a map of navigation page items to their respective paths. This map is used to quickly
 * lookup the path of a navigation item. It will be cached for the lifetime of the navigation.
 */
function buildItemToPathMap(navigation: Navigation): Map<NavigationPageItem, string> {
  const map = new Map<NavigationPageItem, string>();

  const visit = (item: NavigationItem, base: string, parentSearchParams?: URLSearchParams) => {
    if (isPageItem(item)) {
      // Append segment to base path. Make sure to always have an initial slash, and slashes between segments.
      const pathname =
        `${base.startsWith('/') ? base : `/${base}`}${base && base !== '/' && item.segment ? '/' : ''}${item.segment || ''}` ||
        '/';

      // Merge parent searchParams with item's searchParams
      // If item has searchParams defined (even if empty), it replaces parent params
      let searchParams = parentSearchParams;
      if (item.searchParams !== undefined) {
        searchParams = new URLSearchParams(item.searchParams);
        // If parent params exist and item params is not empty, merge them
        if (parentSearchParams && item.searchParams.size > 0) {
          for (const [key, value] of parentSearchParams.entries()) {
            if (!searchParams.has(key)) {
              searchParams.set(key, value);
            }
          }
        }
      }

      const searchString = searchParams && searchParams.size > 0 ? `?${searchParams.toString()}` : '';
      const path = pathname + searchString;

      map.set(item, path);
      if (item.children) {
        for (const child of item.children) {
          visit(child, pathname, searchParams);
        }
      }
    }
  };

  for (const item of navigation) {
    visit(item, '', undefined);
  }

  return map;
}

const itemToPathMapCache = new WeakMap<Navigation, Map<NavigationPageItem, string>>();

/**
 * Gets the cached map of navigation page items to their respective paths.
 */
function getItemToPathMap(navigation: Navigation) {
  let map = itemToPathMapCache.get(navigation);
  if (!map) {
    map = buildItemToPathMap(navigation);
    itemToPathMapCache.set(navigation, map);
  }
  return map;
}

/**
 * Build a lookup map of paths to navigation items. This map is used to match paths against
 * to find the active page. Only pathname is used for matching, searchParams are ignored.
 */
function buildItemLookup(navigation: Navigation) {
  const map = new Map<string | RegExp, NavigationPageItem>();
  const visit = (item: NavigationItem) => {
    if (isPageItem(item)) {
      const fullPath = getItemPath(navigation, item);
      // Extract pathname without search params for matching
      const pathname = fullPath.split('?')[0];
      if (map.has(pathname)) {
        console.warn(`Duplicate path in navigation: ${pathname}`);
      }

      map.set(pathname, item);
      if (item.pattern) {
        const basePath = item.segment ? pathname.slice(0, -item.segment.length) : pathname;
        map.set(pathToRegexp(basePath + item.pattern), item);
      }
      if (item.children) {
        for (const child of item.children) {
          visit(child);
        }
      }
    }
  };
  for (const item of navigation) {
    visit(item);
  }
  return map;
}
const itemLookupMapCache = new WeakMap<Navigation, Map<string | RegExp, NavigationPageItem>>();
function getItemLookup(navigation: Navigation) {
  let map = itemLookupMapCache.get(navigation);
  if (!map) {
    map = buildItemLookup(navigation);
    itemLookupMapCache.set(navigation, map);
  }
  return map;
}

/**
 * Matches a path against the navigation to find the active page. i.e. the page that should be
 * marked as selected in the navigation. Only the pathname is matched, search params are ignored.
 */
export function matchPath(navigation: Navigation, path: string): NavigationPageItem | null {
  const lookup = getItemLookup(navigation);
  // Strip search params and hash from the path for matching
  const pathname = path.split('?')[0].split('#')[0];

  for (const [key, item] of lookup.entries()) {
    if (typeof key === 'string' && key === pathname) {
      return item;
    }
    if (key instanceof RegExp && key.test(pathname)) {
      return item;
    }
  }

  return null;
}

/**
 * Gets the path for a specific navigation page item.
 */
export function getItemPath(navigation: Navigation, item: NavigationPageItem): string {
  const map = getItemToPathMap(navigation);
  const path = map.get(item);
  invariant(path, `Item not found in navigation: ${item.title}`);
  return path;
}

/**
 * Checks if a specific navigation page item has the active page as a child item.
 */
export function hasSelectedNavigationChildren(
  navigation: Navigation,
  item: NavigationPageItem,
  activePagePath: string,
): boolean {
  if (item.children) {
    return item.children.some((nestedItem) => {
      if (!isPageItem(nestedItem)) {
        return false;
      }

      if (nestedItem.children) {
        return hasSelectedNavigationChildren(navigation, nestedItem, activePagePath);
      }

      return activePagePath === getItemPath(navigation, nestedItem);
    });
  }

  return false;
}
