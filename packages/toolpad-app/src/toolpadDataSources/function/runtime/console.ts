import { ToolpadFunctionRuntimeBridge } from './types';

const TOOLPAD_BRIDGE: ToolpadFunctionRuntimeBridge = (global as any).TOOLPAD_BRIDGE;

function consoleMethod(level: string) {
  return (...args: any[]) => {
    TOOLPAD_BRIDGE.console.apply(null, [level, JSON.stringify(args)], {
      arguments: { copy: true },
    });
  };
}

// @ts-expect-error Can't turn off @types/node which gets pulled in automatically
// https://github.com/microsoft/TypeScript/issues/37053
global.console = {
  log: consoleMethod('log'),
  debug: consoleMethod('debug'),
  info: consoleMethod('info'),
  warn: consoleMethod('warn'),
  error: consoleMethod('error'),
};

export {};
