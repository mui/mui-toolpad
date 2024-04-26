# Data Grid

<p class="description">Learn about how to use data grids in Toolpad Studio.</p>

## Demo

Toolpad Studio builds on top of the [MUI X Data Grid](https://mui.com/x/react-data-grid/) to add faster customisation and integration with your internal tools.

{{"demo": "DataGridBasic.js", "hideToolbar": true, "bg": "inline"}}

## Usage

A Data Grid is an essential component in an internal application. The following properties make it usable to work alongside other Toolpad Studio components, queries, data providers.

### Rows

Rows property requires an array of data to show inside the data grid. It can be configured either by clicking on it and providing JSON or by binding it to a query output. The video below shows how to bind data to data grid using rows linking:

<video controls width="100%" height="auto" style="contain" alt="datagrid-rows">
  <source src="/static/toolpad/docs/studio/components/datagrid/datagrid_rows.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

### Columns

Columns property is used to configure the columns to be displayed. Choose a column and you'll get a pop-up window to configure its header name, width, alignment and data type.
From the `type` drop down you can also [customize a column](/toolpad/studio/how-to-guides/customize-datagrid/).

<video controls width="100%" height="auto" style="contain" alt="datagrid-columns">
  <source src="/static/toolpad/docs/studio/components/datagrid/datagrid_column.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

### Grouping and aggregating (Pro)

When you use the Toolpad [pro plan](/toolpad/studio/getting-started/roadmap/#pro-plan), the DataGrid gains grouping and aggregating capabilities. You can turn this off for individual columns.

<video controls width="100%" height="auto" style="contain" alt="datagrid-columns">
  <source src="/static/toolpad/docs/studio/components/datagrid/datagrid_grouping.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

{{"demo": "DataGridPro.js", "hideToolbar": true, "bg": "inline"}}

### Id field

Id field property is used to identify which column contains the id column. By default, the data grid looks for a property named `id` in the data set to get that identifier. If the row's identifier is not called `id`, then you need to use this prop to tell the data grid where it's located.

### Selection

This property shows the currently selected row or `null` in case no row has been selected. It is available to be bound to take any action on the selected row like [deleting a row](/toolpad/studio/how-to-guides/delete-datagrid-row/) from data grid.

<video controls width="100%" height="auto" style="contain" alt="datagrid-selection">
  <source src="/static/toolpad/docs/studio/components/datagrid/datagrid_selection.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

### Loading

Loading property is used to to inform the user when the data is being prepared. It can be [bound to](/toolpad/studio/how-to-guides/delete-datagrid-row/#configure-loading-states-optional) React query properties like isFetching, isLoading.

<video controls width="100%" height="auto" style="contain" alt="datagrid-loading">
  <source src="/static/toolpad/docs/studio/components/datagrid/datagrid_loading.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Appearance

### `density`

Takes three options: `compact`, `standard` and `comfortable`. The first two are shown below:

#### Compact

{{"demo": "DataGridBasic.js", "hideToolbar": true, "bg": "inline"}}

#### Standard

{{"demo": "DataGridStandard.js", "hideToolbar": true, "bg": "inline"}}

### `hideToolbar`

This prop is used to show – or hide – the toolbar from the data grid. The following Data Grid is rendered along with the toolbar, by setting `hideToolbar` to `true`:

{{"demo": "DataGridHideToolbar.js", "hideToolbar": true, "bg": "inline"}}

## API

See the documentation below for a complete reference to all props available to the datagrid component in Toolpad Studio.

- [`<datagrid />`](/toolpad/studio/reference/components/data-grid/)
