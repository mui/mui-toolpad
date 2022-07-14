import * as React from 'react';
import { Grid, styled } from '@mui/material';

export const GRID_NUMBER_OF_COLUMNS = 12;

const StyledGrid = styled(Grid)({
  height: '100vh',
  pointerEvents: 'none',
  position: 'absolute',
  width: 'calc(100vw - 2px)',
  zIndex: 1,
  margin: '0 auto',
  left: -4,
});

const StyledGridColumn = styled('div')({
  backgroundColor: 'pink',
  height: '100%',
  opacity: 0.2,
  width: '100%',
});

export const OverlayGrid = React.forwardRef<{
  getMinColumnWidth: () => number;
  getLeftColumnEdges: () => number[];
  getRightColumnEdges: () => number[];
}>(function OverlayGrid(props, forwardedRef) {
  const gridRef = React.useRef<HTMLDivElement | null>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => {
      let columnEdges: number[] = [];
      if (gridRef.current) {
        const gridColumnContainers = Array.from(gridRef.current.children);
        const gridColumnEdges = gridColumnContainers.map((container: Element) => {
          const containerRect = container.firstElementChild?.getBoundingClientRect();
          return containerRect
            ? [Math.round(containerRect.x), Math.round(containerRect.x + containerRect.width)]
            : [];
        });
        columnEdges = gridColumnEdges.flat();
      }

      return {
        getMinColumnWidth() {
          return columnEdges[1] - columnEdges[0];
        },
        getLeftColumnEdges() {
          return columnEdges.filter((column, index) => index % 2 === 0);
        },
        getRightColumnEdges() {
          return columnEdges.filter((column, index) => index % 2 === 1);
        },
      };
    },
    [],
  );

  return (
    <StyledGrid ref={gridRef} container columnSpacing={1} px={2}>
      {[...Array(GRID_NUMBER_OF_COLUMNS)].map((column, index) => (
        <Grid key={index} item xs={1}>
          <StyledGridColumn />
        </Grid>
      ))}
    </StyledGrid>
  );
});
