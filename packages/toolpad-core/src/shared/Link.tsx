import * as React from 'react';
import { RouterContext } from './context';

/**
 * @ignore - internal component.
 */

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /*
   * "replace" will replace the history stack with the URL being navigated to
   * "push" will push the URL being navigated to as a new entry onto the history stack
   * "auto" is the default and the mimics the "push" behaviour
   */
  history?: 'auto' | 'push' | 'replace';
  href: string;
}

export const DefaultLink = React.forwardRef(function Link(
  props: LinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { children, href, onClick, history, ...rest } = props;
  const routerContext = React.useContext(RouterContext);

  const handleLinkClick = React.useMemo(() => {
    if (!routerContext) {
      return onClick;
    }
    return (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const url = new URL(event.currentTarget.href);
      routerContext.navigate(url.pathname + url.search + url.hash, { history });
      onClick?.(event);
    };
  }, [routerContext, onClick, history]);

  return (
    <a ref={ref} href={href} {...rest} onClick={handleLinkClick}>
      {children}
    </a>
  );
});

export const Link = React.forwardRef(function Link(
  props: LinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  const routerContext = React.useContext(RouterContext);
  const LinkComponent = routerContext?.Link ?? DefaultLink;
  return (
    <LinkComponent ref={ref} {...props}>
      {props.children}
    </LinkComponent>
  );
});
