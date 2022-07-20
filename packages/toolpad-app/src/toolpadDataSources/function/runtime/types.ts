import type * as ivm from 'isolated-vm';

export interface FetchStub {
  (input: RequestInfo | URL, init?: RequestInit): Promise<ResponseStub>;
}

export interface ResponseStub {
  url: string;
  ok: boolean;
  status: number;
  statusText: string;
  headers: ivm.ExternalCopy<[string, string][]>;
  json: ivm.Reference<() => Promise<any>>;
  text: ivm.Reference<() => Promise<string>>;
}

export interface ConsoleStub {
  (level: string, serializedArgs: string): void;
}

export interface SetTimeoutStub {
  (cb: () => void, ms: number): number;
}

export interface ClearTimeoutStub {
  (timeout: number): void;
}

export interface ToolpadFunctionRuntimeBridge {
  fetch: ivm.Reference<FetchStub>;
  console: ivm.Reference<ConsoleStub>;
  setTimeout: ivm.Reference<SetTimeoutStub>;
  clearTimeout: ivm.Reference<ClearTimeoutStub>;
}
