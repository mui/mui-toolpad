import * as React from 'react';
import { DocsContext as Docs } from '../shared/context';
import { Router } from '../AppProvider';

export const DocsContext = Docs;

/**
 * Internal utility for demos
 * @ignore - internal component.
 */

const DUMMY_BASE = 'https://example.com';

/**
 * Hook to create a router for demos.
 * @returns An in-memory router To be used in demos demos.
 */
export function useDemoRouter(initialUrl: string = '/') {
  const [url, setUrl] = React.useState(() => new URL(initialUrl, DUMMY_BASE));

  const router = React.useMemo<Router>(() => {
    return {
      pathname: url.pathname,
      searchParams: url.searchParams,
      navigate: (newUrl) => {
        const nextUrl = new URL(newUrl, DUMMY_BASE);
        if (nextUrl.pathname !== url.pathname || nextUrl.search !== url.search) {
          setUrl(nextUrl);
        }
      },
    };
  }, [url.pathname, url.search, url.searchParams]);

  return router;
}

export { Link } from '../shared/Link';
