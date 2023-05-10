import React from 'react';
import { createComponent } from '@mui/toolpad/browser';
import {
  XYPlot,
  XAxis,
  YAxis,
  VerticalGridLines,
  HorizontalGridLines,
  VerticalBarSeries,
  makeWidthFlexible,
} from 'https://cdn.skypack.dev/react-vis';
import prettyMs from 'https://cdn.skypack.dev/pretty-ms';

const FlexibleXYPlot = makeWidthFlexible(XYPlot);
const barColor = '#EBCFB2'; // Set the color for the bars

export interface BarProps {
  data: Array<any>;
}

function Bar(props: BarProps) {
  const root = React.useRef(null);
  const { data: dataProp } = props;
  const [value, setValue] = React.useState(null);
  const data = dataProp;

  return (
    <FlexibleXYPlot margin={{ bottom: 80, left: 100 }} xType="ordinal" height={400}>
      <VerticalGridLines />
      <HorizontalGridLines />
      <XAxis tickLabelAngle={-45} />
      <YAxis />
      <VerticalBarSeries data={data} color={barColor} />
    </FlexibleXYPlot>
  );
}

export default createComponent(Bar, {
  argTypes: {
    data: {
      typeDef: { type: 'array' },
      defaultValue: [
        { x: 'Apples', y: 12 },
        { x: 'Bananas', y: 2 },
      ],
    },
  },
});

// {[
//          { x: "Apples", y: 10 },
//          { x: "Bananas", y: 5 },
//          { x: "Cranberries", y: 15 },
//        ]}
