import { ToolpadFunctionRuntimeBridge } from './types';

const TOOLPAD_BRIDGE: ToolpadFunctionRuntimeBridge = (global as any).TOOLPAD_BRIDGE;

// @ts-expect-error Can't turn off @types/node which gets pulled in automatically
// https://github.com/microsoft/TypeScript/issues/37053
global.setTimeout = (cb: () => void, ms: number): number => {
  return TOOLPAD_BRIDGE.setTimeout.applySync(null, [cb, ms], {
    arguments: { reference: true },
    result: { copy: true },
  });
};

// @ts-expect-error Can't turn off @types/node which gets pulled in automatically
// https://github.com/microsoft/TypeScript/issues/37053
global.clearTimeout = (timeout: number): void => {
  return TOOLPAD_BRIDGE.clearTimeout.applyIgnored(null, [timeout], {
    arguments: { copy: true },
  });
};

export {};
