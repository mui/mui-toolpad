# Roadmap

<p class="description">Find out about our plans for Toolpad Studio.</p>

## Toolpad Studio roadmap

To learn more about our plans for Toolpad Studio, visit the [public roadmap](https://github.com/orgs/mui/projects/9).

:::warning
We operate in a dynamic environment, so things are subject to change.
The information provided is intended to outline the general direction, but is for informational purposes only.

We may decide to add or remove items at any time, depending on our capability to deliver, while meeting our quality standards.
The development, releases, and timing of any features or functionality remains at the sole discretion of MUI.
The roadmap does not represent a commitment, obligation, or promise to deliver at any time.
:::

## Global roadmap

To learn more about our plans for Material UI in general, visit the [global roadmap](/material-ui/discover-more/roadmap/).

## Pro Plan

A few features in Toolpad Studio are proposed to be placed under a paid plan. These:

- will not be covered under the free-forever MIT license
- will require the purchase of a paid license to use in production

The following features are currently planned to be included within this scope:

- ### Authorization

  Features allowing you to grant conditional access to pages based on user roles are part of this proposed paid plan. Read more about this feature on [authorization](/toolpad/studio/concepts/rbac/).

- ### Grouping and Aggregation

  Feature which allows you to configure grouping and aggregation features on the data grid through visual controls. Read more about this feature on the [data grid](/toolpad/studio/components/data-grid/#grouping-and-aggregating-pro) page.

:::info
The following Pro features are included with an [X Premium license](https://mui.com/x/introduction/licensing/#premium-plan):

- **Grouping and Aggregation**

  :::

## How to upgrade

Currently, accessing these features requires you to add the following to your `application.yml`:

```yml
spec:
  plan: pro
```

:::info
Add the above alongside any existing content of the `spec` attribute
:::

Using these features in production will require the purchase of a paid license. Please get in touch with us at [toolpad@mui.com](mailto:toolpad@mui.com) if you require to do so.
