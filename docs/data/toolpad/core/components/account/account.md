---
productId: toolpad-core
title: Account
components: Account, AccountDetails
---

# Account

<p class="description">A component that renders an account management dropdown for your application.</p>

:::info
If this is your first time using Toolpad Core, it's recommended to read about the [basic concepts](/toolpad/core/introduction/base-concepts/) first.
:::

The `Account` component is a quick and easy way to display an account management menu for authenticated users. It is deeply integrated with the `SignInPage` and `DashboardLayout` components, meaning that it automatically appears in the top navigation bar inside `DashboardLayout` once your users have signed in through the `SignInPage`.

## States

### Signed In

If a `session` object is present, the component is rendered as a dropdown containing the user's account details as well as an option to sign out.

{{"demo": "AccountDemoSignedIn.js", "bg": "outlined" }}

### Signed Out

When signed out, the component renders as an inline sign in button within the dashboard layout.

{{"demo": "AccountDemoSignedOut.js", "bg": "outlined" }}

## Customization

### Slot Props

The underlying `signInButton`, `signOutButton` and `iconButton` components can be customized by passing in `slotProps` to the `Account` component.

Labels for the sign in and sign out buttons can be customized through the `localeText` prop.

{{"demo": "AccountCustom.js", "bg": "outlined" }}

### Slots

You can pass in your own components to completely override the default components inside the `Account` popover through the `slots` prop.

#### Content

Use the `content` slot to customize the content of the popover. You can use the `AccountDetails` component inside your custom account popover:

```tsx
import { AccountDetails } from '@toolpad/core';

function CustomAccount() {
  return (
    <Stack direction="column">
      <AccountDetails />
      <MenuList dense disablePadding>
        // ...
      </MenuList>
    </Stack>
  );
}
```

##### Account Switcher

{{"demo": "AccountSlotsAccountSwitcher.js", "bg": "outlined"}}

The `content` prop can take any React component, so you can use it to display information instead of adding menu items:

##### Crypto Wallet

{{"demo": "AccountSlotsInfo.js", "bg": "outlined" }}
