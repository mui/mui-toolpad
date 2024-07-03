---
productId: toolpad-core
title: Dashboard Layout
components: AppProvider, DashboardLayout
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

{{"demo": "DashboardLayoutBranding.js", "height": 500, "iframe": true}}

## Navigation

The `navigation` prop in the [AppProvider](https://mui.com/toolpad/core/react-app-provider/) allows for setting any type of navigation structure in the `DashboardLayout` sidebar by including different navigation elements as building blocks in any order, such as:

- links `{ slug: '/home', title: 'Home', icon: <DescriptionIcon /> }`;
- headings `{ kind: 'header', title: 'Epic Fantasy' }`;
- dividers `{ kind: 'divider' }`;
- collapsible nested navigation `{ title: 'Fantasy', icon: <FolderIcon />, children: [ ... ] }`.

The flexibility in composing and ordering these different elements allows for a great variety of navigation structures to fit your use case.

{{"demo": "DashboardLayoutNavigation.js", "height": 640, "iframe": true}}
