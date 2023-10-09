import { hasOwnProperty } from '@mui/toolpad-utils/collections';
import { BindableAttrValue, BindingEvaluationResult, JsRuntime } from './types';

export const TOOLPAD_LOADING_MARKER = '__TOOLPAD_LOADING_MARKER__';

export function evaluateBindable<V>(
  ctx: JsRuntime,
  bindable: BindableAttrValue<V> | null,
  globalScope: Record<string, unknown>,
): BindingEvaluationResult {
  if (bindable && typeof bindable === 'object') {
    if (hasOwnProperty(bindable, '$$jsExpression')) {
      return ctx.evaluateExpression(bindable.$$jsExpression as string, globalScope);
    }

    if (hasOwnProperty(bindable, '$$env')) {
      const env = ctx.getEnv();
      if (Object.keys(env).length > 0) {
        return { value: ctx.getEnv()[bindable.$$env as string] };
      }
      return { value: bindable };
    }
  }

  return { value: bindable };
}
