import { errorFrom } from '@toolpad/utils/errors';
import { TOOLPAD_LOADING_MARKER } from './jsRuntime';
import { BindingEvaluationResult, JsRuntime } from './types';

function getIframe(): HTMLIFrameElement {
  if (typeof window === 'undefined') {
    throw new Error(`Can't use browser JS runtime outside of a browser`);
  }

  const iframeId = 'toolpad-browser-runtime-iframe';
  let iframe = document.getElementById(iframeId) as HTMLIFrameElement;

  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    iframe.style.display = 'none';
    document.documentElement.appendChild(iframe);
  }
  return iframe;
}

function createBrowserRuntime(): JsRuntime {
  function evalCode(code: string, globalScope: Record<string, unknown>) {
    const iframe: HTMLIFrameElement = getIframe();

    // eslint-disable-next-line no-underscore-dangle
    (iframe.contentWindow as any).__SCOPE = globalScope;
    (iframe.contentWindow as any).console = window.console;

    const result = (iframe.contentWindow as any).eval(`
      (() => {
        // See https://tc39.es/ecma262/multipage/global-object.html#sec-global-object
        const ecmaGlobals = new Set([ 'globalThis', 'Infinity', 'NaN', 'undefined', 'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'AggregateError', 'Array', 'ArrayBuffer', 'BigInt', 'BigInt64Array', 'BigUint64Array', 'Boolean', 'DataView', 'Date', 'Error', 'EvalError', 'FinalizationRegistry', 'Float32Array', 'Float64Array', 'Function', 'Int8Array', 'Int16Array', 'Int32Array', 'Map', 'Number', 'Object', 'Promise', 'Proxy', 'RangeError', 'ReferenceError', 'RegExp', 'Set', 'SharedArrayBuffer', 'String', 'Symbol', 'SyntaxError', 'TypeError', 'Uint8Array', 'Uint8ClampedArray', 'Uint16Array', 'Uint32Array', 'URIError', 'WeakMap', 'WeakRef', 'WeakSet', 'Atomics', 'JSON', 'Math', 'Reflect' ]);
        const allowedDomGlobals = new Set([ 'setTimeout', 'console', 'URL', 'URLSearchParams', 'Intl' ])

        // NOTE: This is by no means intended to be a secure way to hide DOM globals 
        const globalThis = new Proxy(window.__SCOPE, {
          has(target, prop) {
            return (
              (prop === 'globalThis') ||
              Object.prototype.hasOwnProperty.call(target, prop) || 
              ((prop in window) && !(ecmaGlobals.has(prop) || allowedDomGlobals.has(prop)))
            );
          },
          get(target, prop, receiver) {
            if (prop === 'globalThis') {
              return globalThis;
            }
            if (Object.prototype.hasOwnProperty.call(window.__SCOPE, prop)) {
              return Reflect.get(...arguments);
            }
            if (prop === Symbol.unscopables) {
              return undefined;
            }
            return undefined
          },
        });

        with (globalThis) { 
          return (${code})
        }
      })()
    `);

    if (typeof result?.then === 'function') {
      return Promise.resolve(result).then((value) => window.structuredClone(value));
    }

    return window.structuredClone(result);
  }

  function evaluateExpression(
    code: string,
    globalScope: Record<string, unknown>,
  ): BindingEvaluationResult {
    try {
      const value = evalCode(code, globalScope);
      return { value };
    } catch (rawError) {
      const error = errorFrom(rawError);
      if (error?.message === TOOLPAD_LOADING_MARKER) {
        return { loading: true };
      }
      return { error: error as Error };
    }
  }

  return {
    getEnv() {
      throw new Error(`Env variables are not supported in this context`);
    },
    evaluateExpression,
  };
}

const browserRuntime = createBrowserRuntime();
export function getBrowserRuntime(): JsRuntime {
  return browserRuntime;
}

export function useBrowserJsRuntime(): JsRuntime {
  return getBrowserRuntime();
}
