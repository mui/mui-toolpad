export interface FunctionConnectionParams {}

export interface FunctionQuery {
  readonly module: string;
}

export interface PrivateQuery<I, R> {
  input: I;
  result: R;
}

export interface PrivateQueries {
  debug: PrivateQuery<FunctionQuery, {}>;
}

export interface LogRequest {
  method: string;
  url: string;
  headers: [string, string][];
}

export interface LogResponse {
  status: number;
  statusText: string;
  ok: boolean;
  headers: [string, string][];
}

export interface LogConsoleEntry {
  timestamp: number;
  level: string;
  kind: 'console';
  args: any[];
}

export interface LogRequestEntry {
  timestamp: number;
  kind: 'request';
  request: LogRequest;
}

export interface LogResponseEntry {
  timestamp: number;
  kind: 'response';
  response: LogResponse;
}

export type LogEntry = LogConsoleEntry | LogRequestEntry | LogResponseEntry;

export interface FunctionResult {
  data: any;
  error?: Error;
  logs: LogEntry[];
}
