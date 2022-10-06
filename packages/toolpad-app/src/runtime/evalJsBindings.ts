import { set } from 'lodash-es';
import { mapValues } from '../utils/collections';
import { errorFrom } from '../utils/errors';

let iframe: HTMLIFrameElement;
function evaluateCode(code: string, globalScope: Record<string, unknown>) {
  // TODO: investigate https://www.npmjs.com/package/ses
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    iframe.style.display = 'none';
    document.documentElement.appendChild(iframe);
  }
  // eslint-disable-next-line no-underscore-dangle
  (iframe.contentWindow as any).__SCOPE = globalScope;
  (iframe.contentWindow as any).console = window.console;
  return (iframe.contentWindow as any).eval(`with (window.__SCOPE) { ${code} }`);
}

const TOOLPAD_LOADING_MARKER = '__TOOLPAD_LOADING_MARKER__';

export function evaluateExpression(
  code: string,
  globalScope: Record<string, unknown>,
): BindingEvaluationResult {
  try {
    const value = evaluateCode(code, globalScope);
    return { value };
  } catch (rawError) {
    const error = errorFrom(rawError);
    if (error?.message === TOOLPAD_LOADING_MARKER) {
      return { loading: true };
    }
    return { error: error as Error };
  }
}

/**
 * Represents the actual state of an evaluated binding.
 */
export type BindingEvaluationResult<T = unknown> = {
  /**
   * The actual value.
   */
  value?: T;
  /**
   * The evaluation of the value resulted in error.
   */
  error?: Error;
  /**
   * The parts that this value depends on are still loading.
   */
  loading?: boolean;
};

/**
 * Represents the state of a binding. It both describes which place it takes in the gobal scope
 * and how to obtain the result
 */
export interface ParsedBinding<T = unknown> {
  /**
   * How this binding presents itself to expressions in the global scope.
   * Path in the form that is accepted by lodash.set
   */
  scopePath?: string;
  /**
   * javascript expression that evaluates to the value of this binding
   */
  expression?: string;
  /**
   * actual evaluated result of the binding
   */
  result?: BindingEvaluationResult<T>;
  /**
   * javascript expression that evaluates to the initial value of this binding if it doesn't have one
   */
  initializer?: string;
}

type Dependencies = Map<string, Set<string>>;

function flattenDependency(
  deps: Dependencies,
  dep: string,
  history = new Set<string>([dep]),
): Set<string> {
  const depDeps = deps.get(dep) ?? new Set();
  const result = new Set(depDeps);
  for (const depDep of depDeps) {
    if (!history.has(depDep)) {
      const flat = flattenDependency(deps, depDep, new Set([...history, depDep]));
      for (const flatted of flat) {
        result.add(flatted);
      }
    }
  }
  return result;
}

function flattenDependencies(deps: Dependencies): Dependencies {
  const result: Dependencies = new Map();
  for (const dep of deps.keys()) {
    result.set(dep, flattenDependency(deps, dep));
  }
  return result;
}

function bubbleError(
  flatDependencies: Dependencies,
  results: Record<string, BindingEvaluationResult<unknown>>,
  bindingId: string,
): Error | undefined {
  const result = results[bindingId];
  if (result.error) {
    return result.error;
  }
  const deps = flatDependencies.get(bindingId) ?? new Set();
  for (const dep of deps) {
    const depResult = results[dep];
    if (depResult.error) {
      return depResult.error;
    }
  }
  return undefined;
}

function bubbleLoading(
  flatDependencies: Dependencies,
  results: Record<string, BindingEvaluationResult<unknown>>,
  bindingId: string,
): boolean {
  const result = results[bindingId];
  if (result.loading) {
    return true;
  }
  const deps = flatDependencies.get(bindingId) ?? new Set();
  for (const dep of deps) {
    const depResult = results[dep];
    if (depResult.loading) {
      return depResult.loading;
    }
  }
  return false;
}

export interface EvaluatedBinding<T = unknown> {
  scopePath?: string;
  result?: BindingEvaluationResult<T>;
}

export function buildGlobalScope(
  base: Record<string, unknown>,
  bindings: Record<string, { result?: BindingEvaluationResult; scopePath?: string }>,
): Record<string, unknown> {
  const globalScope = { ...base };
  for (const binding of Object.values(bindings)) {
    if (binding.scopePath) {
      const value = binding.result?.value;
      set(globalScope, binding.scopePath, value);
    }
  }
  return globalScope;
}

/**
 * Evaluates the expressions and replace with their result
 */
export default function evalJsBindings(
  bindings: Record<string, ParsedBinding>,
  globalScope: Record<string, unknown>,
): Record<string, EvaluatedBinding> {
  const bindingsMap = new Map(Object.entries(bindings));

  const bindingIdMap = new Map<string, string>();
  for (const [bindingId, binding] of bindingsMap) {
    if (binding.scopePath) {
      bindingIdMap.set(binding.scopePath, bindingId);
    }
  }

  const computationStatuses = new Map<string, { result: null | BindingEvaluationResult }>();
  let currentParentBinding: string | undefined;
  const dependencies: Dependencies = new Map();

  let proxiedScope: Record<string, unknown>;

  const evaluateBinding = (
    bindingId: string,
    scopePath?: string,
  ): BindingEvaluationResult | null => {
    const binding = bindingId && bindingsMap.get(bindingId);

    if (!binding) {
      return null;
    }

    if (currentParentBinding) {
      let bindingDependencies = dependencies.get(currentParentBinding);
      if (!bindingDependencies) {
        bindingDependencies = new Set<string>();
        dependencies.set(currentParentBinding, bindingDependencies);
      }
      bindingDependencies.add(bindingId);
    }

    const expression = binding.expression;

    if (expression) {
      const computed = computationStatuses.get(expression);
      if (computed) {
        if (computed.result) {
          // From cache
          return computed.result;
        }

        throw new Error(`Cycle detected "${scopePath}"`);
      }

      // use null to mark as "computing"
      computationStatuses.set(expression, { result: null });
      const prevContext = currentParentBinding;
      currentParentBinding = bindingId;
      const result = evaluateExpression(expression, proxiedScope);
      currentParentBinding = prevContext;
      computationStatuses.set(expression, { result });
      // From freshly computed
      return result;
    }

    if (binding.result) {
      // From input value on the page
      return binding.result;
    }

    const initializer = binding.initializer;
    if (initializer) {
      const result = evaluateBinding(initializer, scopePath);
      if (result) {
        return result;
      }
    }

    return null;
  };

  const proxify = (obj: Record<string, unknown>, label?: string): Record<string, unknown> =>
    new Proxy(obj, {
      get(target, prop, receiver) {
        if (typeof prop === 'symbol') {
          return Reflect.get(target, prop, receiver);
        }

        const scopePath = label ? `${label}.${prop}` : prop;
        const bindingId = bindingIdMap.get(scopePath);

        if (bindingId) {
          const evaluated = evaluateBinding(bindingId, scopePath);
          if (evaluated) {
            return evaluated.value;
          }
        }

        const result = target[prop];

        if (result && typeof result === 'object') {
          return proxify(result as Record<string, unknown>, scopePath);
        }

        return Reflect.get(target, prop, receiver);
      },
    });

  const scope = buildGlobalScope(globalScope, bindings);
  proxiedScope = proxify(scope);

  const results = mapValues(bindings, (binding, bindingId) => {
    return evaluateBinding(bindingId) || { value: undefined };
  });

  const flatDependencies = flattenDependencies(dependencies);

  return mapValues(bindings, (binding, bindingId) => {
    const { scopePath } = binding;

    return {
      scopePath,
      result: {
        ...results[bindingId],
        error: bubbleError(flatDependencies, results, bindingId),
        loading: bubbleLoading(flatDependencies, results, bindingId),
      },
    };
  });
}
