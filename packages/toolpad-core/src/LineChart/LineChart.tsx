'use client';

import * as React from 'react';
import PropTypes from 'prop-types';
import {
  LineChart as XLineChart,
  LineChartProps as XLineChartProps,
  blueberryTwilightPalette,
  LineSeriesType,
} from '@mui/x-charts';
import { styled, useTheme } from '@mui/material';
import { Datum, ResolvedDataProvider, useGetMany } from '../DataProvider';
import { ErrorOverlay, LoadingOverlay } from '../shared/components';

const LineChartRoot = styled('div')({
  position: 'relative',
});

export type LineChartSeries = XLineChartProps['series'];

export interface LineChartProps<R extends Datum> extends Partial<XLineChartProps> {
  /**
   * The data provider to resolve the displayed data. This object must be referentially stable.
   */
  dataProvider?: ResolvedDataProvider<R>;
}

type ChartsXAxis = NonNullable<XLineChartProps['xAxis']>[number];

/**
 *
 * Demos:
 *
 * - [Line Chart](https://mui.com/toolpad/core/react-line-chart/)
 *
 * API:
 *
 * - [LineChart API](https://mui.com/toolpad/core/api/line-chart)
 * - inherits [X LineChart API](https://mui.com/x/api/charts/line-chart/)
 */
const LineChart = React.forwardRef(function LineChart<R extends Datum>(
  props: LineChartProps<R>,
  ref: React.Ref<HTMLDivElement>,
) {
  const { dataProvider, ...restProps1 } = props;
  // TODO: figure out how to stop generating prop types for X Grid properties
  // and document with inheritance
  const restProps2 = restProps1;
  const { xAxis, series, ...rest } = restProps2;
  const theme = useTheme();
  const { data, loading, error } = useGetMany(dataProvider ?? null);
  const resolvedXAxis = React.useMemo(() => {
    if (!xAxis || xAxis.length <= 0) {
      return [{ dataKey: 'id' }];
    }
    return xAxis.map((axis) => {
      let defaults: Partial<ChartsXAxis> = {};
      if (axis.dataKey) {
        const field = dataProvider?.fields?.[axis.dataKey];
        if (field) {
          defaults = {
            label: field.label,
          };
          if (field.type === 'date') {
            defaults.scaleType = 'time';
          }
        }
      }
      return { ...defaults, ...axis };
    });
  }, [dataProvider?.fields, xAxis]);

  const resolvedSeries = React.useMemo(() => {
    const idField = dataProvider?.idField ?? 'id';
    const resolvedSeriesProp: LineChartSeries =
      series ||
      Object.keys(dataProvider?.fields ?? {})
        .filter(
          (dataKey) => dataKey !== idField && dataProvider?.fields?.[dataKey]?.type === 'number',
        )
        .map((dataKey) => ({ dataKey }));

    const colorSchemeIndices = new Map(
      Object.keys(dataProvider?.fields ?? {}).map((name, i) => [name, i]),
    );

    const colors = blueberryTwilightPalette(theme.palette.mode);

    return resolvedSeriesProp.map((s) => {
      let defaults: Partial<LineSeriesType> = {};
      if (s.dataKey) {
        const name = s.dataKey;
        const field = dataProvider?.fields?.[name];
        if (field) {
          const colorSchemeIndex = colorSchemeIndices.get(name) ?? 0;
          defaults = {
            label: field.label,
            color: colors[colorSchemeIndex % colors.length],
          };
          const valueFormatter = field.valueFormatter;
          if (valueFormatter) {
            defaults.valueFormatter = (value: any) => valueFormatter(value, name);
          }
        }
      }
      return { ...defaults, ...s };
    });
  }, [dataProvider?.idField, dataProvider?.fields, series, theme.palette.mode]);

  const dataSet = React.useMemo(() => {
    const resolvedRows = data?.rows ?? [];
    return resolvedRows.map((row) => {
      const result: NonNullable<XLineChartProps['dataset']>[number] = {};
      for (const [name, field] of Object.entries(dataProvider?.fields ?? {})) {
        let value = row[name];
        if (field.type === 'date' && (typeof value === 'string' || typeof value === 'number')) {
          value = new Date(value);
        }

        if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
          result[name] = value;
        }
      }
      return result;
    });
  }, [data?.rows, dataProvider?.fields]);

  return (
    <LineChartRoot>
      <div style={{ display: 'contents', visibility: error || loading ? 'hidden' : undefined }}>
        <XLineChart
          ref={ref}
          dataset={dataSet}
          xAxis={resolvedXAxis}
          series={resolvedSeries}
          {...rest}
          // Remove once https://github.com/mui/mui-x/issues/12873 is fixed
          skipAnimation
        />
      </div>
      {loading ? <LoadingOverlay /> : null}
      {error ? <ErrorOverlay error={error} /> : null}
    </LineChartRoot>
  );
});

LineChart.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * The data provider to resolve the displayed data. This object must be referentially stable.
   */
  dataProvider: PropTypes.shape({
    createOne: PropTypes.func,
    deleteOne: PropTypes.func,
    fields: PropTypes.object,
    getMany: PropTypes.func.isRequired,
    getOne: PropTypes.func,
    idField: PropTypes.object,
    updateOne: PropTypes.func,
  }),
} as any;

export { LineChart };
