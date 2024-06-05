import * as React from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { AppProvider, AppProviderProps, Navigate, Router } from '../AppProvider';

/**
 * @ignore - internal component.
 */
export function AppProviderNextApp(props: AppProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { push, replace } = useRouter();

  const navigate = React.useCallback<Navigate>(
    (url, { history = 'auto' } = {}) => {
      if (history === 'auto' || history === 'push') {
        return push(String(url));
      }
      if (history === 'replace') {
        return replace(String(url));
      }
      throw new Error(`Invalid history option: ${history}`);
    },
    [push, replace],
  );

  const routerImpl = React.useMemo<Router>(
    () => ({
      pathname,
      searchParams,
      navigate,
    }),
    [pathname, navigate, searchParams],
  );

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <AppProvider router={routerImpl} {...props} />
    </AppRouterCacheProvider>
  );
}
