import * as React from 'react';
import { RouterContext } from '../AppProvider';

/**
 * @ignore - internal component.
 */

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {}

export const Link = React.forwardRef(function Link(
  props: LinkProps,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { children, href, onClick, ...rest } = props;
  const routerContext = React.useContext(RouterContext);

  const handleLinkClick = React.useMemo(() => {
    if (!routerContext) {
      return onClick;
    }
    return (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const url = new URL(event.currentTarget.href);
      routerContext.navigate(url.pathname, { history: 'push' });
      onClick?.(event);
    };
  }, [routerContext, onClick]);

  return (
    <a ref={ref} href={href} {...rest} onClick={handleLinkClick}>
      {children}
    </a>
  );
});
