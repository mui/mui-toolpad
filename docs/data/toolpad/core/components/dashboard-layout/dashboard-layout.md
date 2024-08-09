---
productId: toolpad-core
title: Dashboard Layout
components: AppProvider, DashboardLayout, Account
---

# Dashboard Layout

<p class="description">The dashboard layout component provides a customizable out-of-the-box layout for a typical dashboard page.</p>

The `DashboardLayout` component is a quick, easy way to provide a standard full-screen layout with a header and sidebar to any dashboard page, as well as ready-to-use and easy to customize navigation and branding.

Many features of this component are configurable through the [AppProvider](https://mui.com/toolpad/core/react-app-provider/) component that should wrap it.

## Demo

A `DashboardLayout` brings in a header and sidebar with navigation, as well as a scrollable area for page content.

If application [themes](https://mui.com/toolpad/core/react-app-provider/#theming) are defined for both light and dark mode, a theme switcher in the header allows for easy switching between the two modes.

{{"demo": "DashboardLayoutBasic.js", "height": 500, "iframe": true}}

## Branding

Some elements of the `DashboardLayout` can be configured to match your personalized brand.

This can be done via the `branding` prop in the [AppProvider](https://mui.com/toolpad/core/react-app-provider/), which allows for setting a custom `logo` image or `title` text in the page header.

{{"demo": "DashboardLayoutBranding.js", "height": 400, "iframe": true}}

## Navigation

The `navigation` prop in the [AppProvider](https://mui.com/toolpad/core/react-app-provider/) allows for setting any type of navigation structure in the `DashboardLayout` sidebar by including different navigation elements as building blocks in any order.

The flexibility in composing and ordering these different elements allows for a great variety of navigation structures to fit your use case.

### Navigation Links

Navigation links can be placed in the sidebar as items with the format:

```tsx
{ segment: 'home', title: 'Home', icon: <DescriptionIcon /> }
```

{{"demo": "DashboardLayoutNavigationLinks.js", "height": 400, "iframe": true}}

### Navigation Headings

Navigation headings can be placed in the sidebar as items with the format:

```tsx
{ kind: 'header', title: 'Animals' }
```

{{"demo": "DashboardLayoutNavigationHeadings.js", "height": 400, "iframe": true}}

### Navigation Dividers

Dividers can can be placed between items in the sidebar as items with the format:

```tsx
{
  kind: 'divider';
}
```

{{"demo": "DashboardLayoutNavigationDividers.js", "height": 400, "iframe": true}}

### Nested Navigation

Nested navigation structures can be placed in the sidebar as items with the format:

```tsx
{ title: 'Movies', icon: <FolderIcon />, children: [ ... ] }
```

{{"demo": "DashboardLayoutNavigationNested.js", "height": 400, "iframe": true}}

### Navigation Actions

Navigation links have an optional `action` prop that can be used to render any content on the right-side of the respective list item, such as badges with numbers, or buttons to toggle a popover menu.

{{"demo": "DashboardLayoutNavigationActions.js", "height": 400, "iframe": true}}

## Account

The `DashboardLayout` comes integrated with the [`<Account />`](/toolpad/core/react-account/) component. It renders as an account management menu when a user is signed in – a `session` object is present – and a button when not.

:::warning
The use of an `iframe` may cause some spacing issues in the following demo.
:::

{{"demo": "DashboardLayoutAccount.js", "height": 400, "iframe": true}}
