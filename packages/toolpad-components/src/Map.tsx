import * as React from 'react';
import { SxProps } from '@mui/material';
import Map from 'react-map-gl';
import { createComponent } from '@mui/toolpad-core';

interface MapComponentProps {
  longitude: number;
  latitude: number;
  zoom: number;
  sx: SxProps;
  style: string;
}

const MapComponent = ({ latitude, longitude, zoom, sx, style }: MapComponentProps) => {
  return (
    <Map
      key={`${latitude}-${longitude}-${zoom}`}
      initialViewState={{ latitude, longitude, zoom }}
      style={sx as React.CSSProperties}
      mapStyle={style}
      mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
    />
  );
};

export default createComponent(MapComponent, {
  argTypes: {
    latitude: {
      typeDef: { type: 'number' },
      defaultValue: 28.7,
    },
    longitude: {
      typeDef: { type: 'number' },
      defaultValue: 77.1,
    },
    zoom: {
      typeDef: { type: 'number' },
      defaultValue: 14,
    },
    style: {
      typeDef: {
        type: 'string',
      },
      defaultValue: 'mapbox://styles/mapbox/streets-v9',
    },
    sx: {
      typeDef: { type: 'object' },
      defaultValue: {
        width: 800,
        height: 600,
      },
    },
  },
});
