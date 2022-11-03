import * as React from 'react';

let dispatcher: any = null;

function getCurrentDispatcher() {
  // eslint-disable-next-line no-underscore-dangle
  return (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher
    .current;
}

function useRenderTracker() {
  if (dispatcher === null) {
    dispatcher = getCurrentDispatcher();
  }
}

function isInRender() {
  return dispatcher !== null && dispatcher === getCurrentDispatcher();
}

/**
 * See https://github.com/reactjs/rfcs/pull/220
 */
export default function useEvent<F extends (...args: any[]) => void>(handler: F): F {
  useRenderTracker();
  const ref = React.useRef(handler);
  React.useInsertionEffect(() => {
    ref.current = handler;
  });
  // @ts-expect-error
  return React.useCallback((...args) => {
    if (process.env.NODE_ENV !== 'production' && isInRender()) {
      throw new Error('Cannot call event in Render!');
    }
    const fn = ref.current;
    fn(...args);
  }, []);
}
