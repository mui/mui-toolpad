import { styled } from '@mui/material';
import clsx from 'clsx';
import * as React from 'react';
import ReactSplitPane, { SplitPaneProps } from 'react-split-pane';

const classes = {
  dragging: 'MuiToolpadSplitPaneDragging',
};

const WrappedSplitPane = React.forwardRef<
  ReactSplitPane,
  SplitPaneProps & { children?: React.ReactNode }
>(({ className, onDragStarted, onDragFinished, ...props }, ref) => {
  const [dragActive, setDragActive] = React.useState(false);

  const handleDragStarted = React.useCallback(
    (...args: Parameters<NonNullable<typeof onDragStarted>>) => {
      setDragActive(true);
      onDragStarted?.(...args);
    },
    [onDragStarted],
  );

  const handleDragFinished = React.useCallback(
    (...args: Parameters<NonNullable<typeof onDragFinished>>) => {
      setDragActive(false);
      onDragFinished?.(...args);
    },
    [onDragFinished],
  );

  return (
    <ReactSplitPane
      ref={ref}
      className={clsx({ [classes.dragging]: dragActive }, className)}
      onDragStarted={handleDragStarted}
      onDragFinished={handleDragFinished}
      // Some sensible defaults
      minSize={20}
      maxSize={-20}
      style={{
        position: 'relative',
      }}
      paneStyle={{
        display: 'block',
        // Prevent the content from stretching the Panel out
        minWidth: 0,
        minHeight: 0,
        ...props.paneStyle,
      }}
      {...props}
    />
  );
});

const SplitPane = styled(WrappedSplitPane)(({ theme }) => ({
  [`&.${classes.dragging} *`]: {
    // Workaround for https://github.com/tomkp/react-split-pane/issues/30
    pointerEvents: 'none',
  },

  '& .Pane': {
    background: theme.palette.background.default,
  },

  '& .Pane2': {
    zIndex: 1,
  },

  '& .Resizer': {
    background: theme.palette.divider,
    zIndex: '1',
    boxSizing: 'border-box',
    backgroundClip: 'padding-box',
    flexShrink: '0',
  },

  '& .Resizer:hover': {
    transition: 'all 2s ease',
  },

  '& .Resizer.horizontal': {
    height: '11px',
    margin: '-5px 0',
    borderTop: '5px solid rgba(255, 255, 255, 0)',
    borderBottom: '5px solid rgba(255, 255, 255, 0)',
    cursor: 'row-resize',
    width: '100%',
  },

  '& .Resizer.horizontal:hover': {
    borderTop: '5px solid rgba(0, 0, 0, 0.5)',
    borderBottom: '5px solid rgba(0, 0, 0, 0.5)',
  },

  '& .Resizer.vertical': {
    width: '11px',
    margin: '0 -5px',
    borderLeft: '5px solid rgba(255, 255, 255, 0)',
    borderRight: '5px solid rgba(255, 255, 255, 0)',
    cursor: 'col-resize',
  },

  '& .Resizer.vertical:hover': {
    borderLeft: '5px solid rgba(0, 0, 0, 0.5)',
    borderRight: '5px solid rgba(0, 0, 0, 0.5)',
  },

  '& .Resizer.disabled': {
    cursor: 'not-allowed',
  },

  '& .Resizer.disabled:hover': {
    borderColor: 'transparent',
  },
}));

export default SplitPane;
