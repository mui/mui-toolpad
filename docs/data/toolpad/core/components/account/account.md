---
productId: toolpad-core
title: Account
components: Account
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

### Locale Text

Labels for the sign in and sign out buttons can be customized through the `localeText` prop.

{{"demo": "AccountLocale.js", "bg": "outlined" }}

### Slot Props

The underlying `signInButton`, `signOutButton`, `iconButton` and `userDetailsContainer` sections can be customized by passing in `slotProps` to the `Account` component.

{{"demo": "AccountCustom.js", "bg": "outlined" }}

### Slots

You can pass in your own components to completely override the default components inside the `Account` popover through the `slots` prop.

#### Content

Use the `content` slot to add any additional options in the space between the user's account details and the sign out button, to create larger, more complex menus:

##### Account Switcher

{{"demo": "AccountSlotsAccountSwitcher.js", "bg": "gradient"}}

The `content` prop can take any React component, so you can use it to display information instead of adding menu items:

##### Crypto Wallet

{{"demo": "AccountSlotsInfo.js", "bg": "outlined" }}

#### User Details Container

By passing a custom component to the `userDetailsContainer` slot, you can override the section which displays the signed-in user's details. The custom component receives a `session` prop which contains the current authentication session:

```tsx
// ...
import { Session } from '@toolpad/core';

interface CustomSession extends Session {
  org: {
    name: string;
    url: string;
    logo: string;
  };
}

function UserDetailsContainer({ session }: UserDetailsContainerProps) {
  // ...
}
```

##### Enterprise Profile

{{"demo": "AccountCustomUserDetails.js", "bg": "outlined" }}
