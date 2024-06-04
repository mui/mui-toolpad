'use client';
import * as React from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  AppProvider as BaseAppProvider,
  AppProviderProps as BaseAppProviderProps,
  Navigate,
  Router,
} from '../AppProvider';

export function AppProvider(props: BaseAppProviderProps) {
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

  return <BaseAppProvider router={routerImpl} {...props} />;
}
