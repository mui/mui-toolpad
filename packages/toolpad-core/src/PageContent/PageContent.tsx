'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { Box, Breadcrumbs, Container, Link, Stack, Toolbar, Typography } from '@mui/material';
import { RouterContext } from '../AppProvider';
import { Link as ToolpadLink } from '../shared/Link';
import {
  isPageItem,
  Navigation,
  NavigationContext,
  NavigationItem,
  NavigationPageItem,
} from '../contexts/NavigationContext';

const isRootPage = (item: NavigationItem) => isPageItem(item) && !item.slug;

interface BreadCrumbItem extends NavigationPageItem {
  path: string;
}

function createPageLookup(
  navigation: Navigation,
  segments: BreadCrumbItem[] = [],
  base = '',
): Map<string, BreadCrumbItem[]> {
  const result = new Map<string, BreadCrumbItem[]>();

  const resolveSlug = (slug: string) => `${base}${slug ? `/${slug}` : ''}` || '/';

  const root = navigation.find((item) => isRootPage(item)) as NavigationPageItem | undefined;
  const rootCrumb = root ? { path: resolveSlug(''), ...root } : undefined;

  for (const item of navigation) {
    if (!isPageItem(item)) {
      continue;
    }

    const path = resolveSlug(item.slug);
    if (result.has(path)) {
      throw new Error(`Duplicate path in navigation: ${path}`);
    }

    const itemCrumb: BreadCrumbItem = { path, ...item };

    const navigationSegments: BreadCrumbItem[] = [
      ...segments,
      ...(rootCrumb && !isRootPage(item) ? [rootCrumb] : []),
      itemCrumb,
    ];

    result.set(path, navigationSegments);

    if (item.children) {
      const childrenLookup = createPageLookup(item.children, navigationSegments, path);
      for (const [childPath, childItems] of childrenLookup) {
        if (result.has(childPath)) {
          throw new Error(`Duplicate path in navigation: ${childPath}`);
        }
        result.set(childPath, [itemCrumb, ...childItems]);
      }
    }
  }

  return result;
}

function matchPath(navigation: Navigation, path: string): BreadCrumbItem[] | null {
  const lookup = createPageLookup(navigation);
  return lookup.get(path) ?? null;
}

export interface PageContentProps {
  children?: React.ReactNode;
  actions?: React.ReactNode[];
  title?: string;
}
/**
 *
 * Demos:
 *
 * - [Page Content](https://mui.com/toolpad/core/react-page-content/)
 *
 * API:
 *
 * - [PageContent API](https://mui.com/toolpad/core/api/page-content)
 */
function PageContent(props: PageContentProps) {
  const { children, actions } = props;
  const routerContext = React.useContext(RouterContext);
  const navigationContext = React.useContext(NavigationContext);
  const pathname = routerContext?.pathname ?? '/';
  const breadCrumbs = React.useMemo(
    () => matchPath(navigationContext, pathname),
    [navigationContext, pathname],
  );

  const title = (breadCrumbs ? breadCrumbs[breadCrumbs.length - 1].title : '') ?? props.title;

  return (
    <Container sx={{ my: 2 }}>
      <Stack>
        <Stack>
          <Breadcrumbs aria-label="breadcrumb">
            {breadCrumbs
              ? breadCrumbs.map((item, index) => {
                  return index < breadCrumbs.length - 1 ? (
                    <Link
                      key={item.path}
                      component={ToolpadLink}
                      underline="hover"
                      color="inherit"
                      href={item.path}
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <Typography color="text.primary"> {item.title}</Typography>
                  );
                })
              : null}
          </Breadcrumbs>

          <Toolbar disableGutters>
            {title ? <Typography variant="h4">{title}</Typography> : null}
            <Box sx={{ flex: 1 }} />
            <Stack direction="row" spacing={1}>
              {actions}
            </Stack>
          </Toolbar>
        </Stack>
        <div>{children}</div>
      </Stack>
    </Container>
  );
}

PageContent.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  actions: PropTypes.arrayOf(PropTypes.node),
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  title: PropTypes.string,
} as any;

export { PageContent };
