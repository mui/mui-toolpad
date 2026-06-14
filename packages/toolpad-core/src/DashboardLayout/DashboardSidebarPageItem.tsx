'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { styled, type Theme, SxProps } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Grow from '@mui/material/Grow';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type {} from '@mui/material/themeCssVarsAugmentation';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import invariant from 'invariant';
import { Link } from '../shared/Link';
import { DashboardSidebarPageItemContext, NavigationContext } from '../shared/context';
import { getItemPath, getItemTitle } from '../shared/navigation';
import { MINI_DRAWER_WIDTH } from './shared';
import type { Navigation, NavigationPageItem } from '../AppProvider';

const NavigationListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: 8,
  '&.Mui-selected': {
    '& .MuiListItemIcon-root': {
      color: (theme.vars ?? theme).palette.primary.dark,
    },
    '& .MuiTypography-root': {
      color: (theme.vars ?? theme).palette.primary.dark,
    },
    '& .MuiSvgIcon-root': {
      color: (theme.vars ?? theme).palette.primary.dark,
    },
    '& .MuiAvatar-root': {
      backgroundColor: (theme.vars ?? theme).palette.primary.dark,
    },
    '& .MuiTouchRipple-child': {
      backgroundColor: (theme.vars ?? theme).palette.primary.dark,
    },
  },
  '& .MuiSvgIcon-root': {
    color: (theme.vars ?? theme).palette.action.active,
  },
  '& .MuiAvatar-root': {
    backgroundColor: (theme.vars ?? theme).palette.action.active,
  },
}));

export interface DashboardSidebarPageItemProps {
  /**
   * Navigation page item definition.
   */
  item: NavigationPageItem;
  /**
   * Link `href` for when the item is rendered as a link.
   * @default getItemPath(navigationContext, item)
   */
  href?: string;
  /**
   * The component used to render the item as a link.
   * @default Link
   */
  LinkComponent?: React.ElementType;
  /**
   * If `true`, expands any nested navigation in the item, otherwise collapse it.
   * @default false
   */
  expanded?: boolean;
  /**
   * Use to apply selected styling.
   * @default false
   */
  selected?: boolean;
  /**
   * If `true`, the item is disabled.
   * @default false
   */
  disabled?: boolean;
}

export interface DashboardSidebarPageItemContextProps
  extends Partial<DashboardSidebarPageItemProps> {
  id: string;
  onClick: (itemId: string, item: NavigationPageItem) => void;
  isMini?: boolean;
  isSidebarFullyExpanded?: boolean;
  isSidebarFullyCollapsed?: boolean;
  renderNestedNavigation: (subNavigation: Navigation) => React.ReactNode;
}

const LIST_ITEM_ICON_SIZE = 34;
/**
 *
 * Demos:
 *
 * - [Dashboard Layout](https://mui.com/toolpad/core/react-dashboard-layout/)
 *
 * API:
 *
 * - [DashboardSidebarPageItem API](https://mui.com/toolpad/core/api/dashboard-sidebar-page-item)
 */
function DashboardSidebarPageItem(props: DashboardSidebarPageItemProps) {
  const navigationContext = React.useContext(NavigationContext);
  const pageItemContextProps = React.useContext(DashboardSidebarPageItemContext);

  invariant(pageItemContextProps, 'No navigation page item context provided.');

  const contextAwareProps = {
    ...pageItemContextProps,
    ...props,
  };

  const {
    item,
    href = getItemPath(navigationContext, item),
    LinkComponent: LinkComponentProp,
    expanded = false,
    selected = false,
    disabled = false,
    id,
    onClick,
    isMini = false,
    isSidebarFullyExpanded = true,
    isSidebarFullyCollapsed = false,
    renderNestedNavigation,
  } = contextAwareProps;

  const [hoveredMiniSidebarItemId, setHoveredMiniSidebarItemId] = React.useState<string | null>(
    null,
  );

  const handleClick = React.useCallback(() => {
    onClick(id, item);
  }, [id, item, onClick]);

  let nestedNavigationCollapseSx: SxProps<Theme> = { display: 'none' };
  if (isMini && isSidebarFullyCollapsed) {
    nestedNavigationCollapseSx = {
      fontSize: 18,
      position: 'absolute',
      top: '41.5%',
      right: '2px',
      transform: 'translateY(-50%) rotate(-90deg)',
    };
  } else if (!isMini && isSidebarFullyExpanded) {
    nestedNavigationCollapseSx = {
      ml: 0.5,
      transform: `rotate(${expanded ? 0 : -90}deg)`,
      transition: (theme: Theme) =>
        theme.transitions.create('transform', {
          easing: theme.transitions.easing.sharp,
          duration: 100,
        }),
    };
  }

  const hasExternalHref = href.startsWith('http://') || href.startsWith('https://');

  const LinkComponent = LinkComponentProp ?? (hasExternalHref ? 'a' : Link);

  const title = getItemTitle(item);

  const listItem = (
    <ListItem
      {...(item.children && isMini
        ? {
            onMouseEnter: () => {
              setHoveredMiniSidebarItemId(id);
            },
            onMouseLeave: () => {
              setHoveredMiniSidebarItemId(null);
            },
          }
        : {})}
      sx={{
        py: 0,
        px: 1,
        overflowX: 'hidden',
      }}
    >
      <NavigationListItemButton
        selected={selected}
        disabled={disabled}
        sx={{
          px: 1.4,
          height: isMini ? 60 : undefined,
        }}
        {...(item.children && !isMini
          ? {
              onClick: handleClick,
            }
          : {})}
        {...(!item.children
          ? {
              LinkComponent,
              ...(hasExternalHref
                ? {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  }
                : {}),
              href,
              onClick: handleClick,
            }
          : {})}
      >
        {item.icon || isMini ? (
          <Box
            sx={
              isMini
                ? {
                    position: 'absolute',
                    left: '50%',
                    top: 'calc(50% - 6px)',
                    transform: 'translate(-50%, -50%)',
                  }
                : {}
            }
          >
            <ListItemIcon
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: LIST_ITEM_ICON_SIZE,
              }}
            >
              {item.icon ?? null}
              {!item.icon && isMini ? (
                <Avatar
                  sx={{
                    width: LIST_ITEM_ICON_SIZE - 7,
                    height: LIST_ITEM_ICON_SIZE - 7,
                    fontSize: 12,
                  }}
                >
                  {title
                    .split(' ')
                    .slice(0, 2)
                    .map((titleWord) => titleWord.charAt(0).toUpperCase())}
                </Avatar>
              ) : null}
            </ListItemIcon>
            {isMini ? (
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: -18,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 10,
                  fontWeight: 500,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: MINI_DRAWER_WIDTH - 28,
                }}
              >
                {title}
              </Typography>
            ) : null}
          </Box>
        ) : null}
        {!isMini ? (
          <ListItemText
            primary={title}
            sx={{
              ml: 1.2,
              whiteSpace: 'nowrap',
              zIndex: 1,
            }}
          />
        ) : null}
        {item.action && !isMini && isSidebarFullyExpanded ? item.action : null}
        {item.children ? <ExpandMoreIcon sx={nestedNavigationCollapseSx} /> : null}
      </NavigationListItemButton>
      {item.children && isMini ? (
        <Grow in={id === hoveredMiniSidebarItemId}>
          <Box
            sx={{
              position: 'fixed',
              left: MINI_DRAWER_WIDTH - 2,
              pl: '6px',
            }}
          >
            <Paper
              sx={{
                pt: 0.5,
                pb: 0.5,
                transform: 'translateY(calc(50% - 30px))',
              }}
            >
              {renderNestedNavigation(item.children)}
            </Paper>
          </Box>
        </Grow>
      ) : null}
    </ListItem>
  );

  return (
    <React.Fragment key={id}>
      {listItem}
      {item.children && !isMini ? (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {renderNestedNavigation(item.children)}
        </Collapse>
      ) : null}
    </React.Fragment>
  );
}

DashboardSidebarPageItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the item is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, expands any nested navigation in the item, otherwise collapse it.
   * @default false
   */
  expanded: PropTypes.bool,
  /**
   * Link `href` for when the item is rendered as a link.
   * @default getItemPath(navigationContext, item)
   */
  href: PropTypes.string,
  /**
   * Navigation page item definition.
   */
  item: PropTypes.shape({
    action: PropTypes.node,
    children: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.shape({
          kind: PropTypes.oneOf(['header']).isRequired,
          title: PropTypes.string.isRequired,
        }),
        PropTypes.shape({
          kind: PropTypes.oneOf(['divider']).isRequired,
        }),
      ]).isRequired,
    ),
    icon: PropTypes.node,
    kind: PropTypes.oneOf(['page']),
    pattern: PropTypes.string,
    segment: PropTypes.string,
    title: PropTypes.string,
  }).isRequired,
  /**
   * The component used to render the item as a link.
   * @default Link
   */
  LinkComponent: PropTypes.elementType,
  /**
   * Use to apply selected styling.
   * @default false
   */
  selected: PropTypes.bool,
} as any;

export { DashboardSidebarPageItem };
