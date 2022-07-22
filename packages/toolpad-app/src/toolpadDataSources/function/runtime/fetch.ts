/**
 * Implementation adapted from https://github.com/github/fetch/blob/master/fetch.js
 */
import './domException';
import './formData';
import './headers';
import './url';
import './web-streams';
import { formDataToBlob } from 'formdata-polyfill/esm.min';
import { ToolpadFunctionRuntimeBridge, FetchOptions } from './types';

const TOOLPAD_BRIDGE: ToolpadFunctionRuntimeBridge = (global as any).TOOLPAD_BRIDGE;

/*
  'FileReader' in global &&
  'Blob' in global &&
  (function () {
    try {
      new Blob();
      return true;
    } catch (e) {
      return false;
    }
  })()
*/
const SUPPORTS_BLOB = false;

/*
  abortController: 'AbortController' in global
*/
const SUPPORTS_ABORTCONTROLLER = false;

function isDataView(obj: unknown): obj is DataView {
  return !!obj && obj instanceof DataView;
}

function consumeBody(body: Body): void {
  if (body.bodyUsed) {
    throw new TypeError('Already read');
  }
  body.bodyUsed = true;
}

async function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

async function readBlobAsText(blob: Blob): Promise<string> {
  const utf8decoder = new TextDecoder();
  return utf8decoder.decode(await readBlobAsArrayBuffer(blob));
}

function readArrayBufferAsText(buf: ArrayBuffer) {
  const view = new Uint8Array(buf);
  const chars = new Array(view.length);

  for (let i = 0; i < view.length; i += 1) {
    chars[i] = String.fromCharCode(view[i]);
  }
  return chars.join('');
}

function bufferClone(buf: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  return ArrayBuffer.isView(buf)
    ? buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    : buf.slice(0);
}

function decode(body: string) {
  const form = new FormData();
  for (const [name, value] of new URLSearchParams(body)) {
    form.append(name, value);
  }
  return form;
}

class Body {
  bodyUsed = false;

  // @ts-expect-error set in initBody
  headers: Headers;

  protected bodyInit: any;

  // @ts-expect-error set in initBody
  private bodyText: string;

  // @ts-expect-error set in initBody
  private bodyBlob: Blob;

  // @ts-expect-error set in initBody
  private bodyFormData: Blob;

  // @ts-expect-error set in initBody
  private bodyArrayBuffer: ArrayBuffer;

  blob = SUPPORTS_BLOB
    ? async () => {
        consumeBody(this);

        if (this.bodyBlob) {
          return this.bodyBlob;
        }
        if (this.bodyArrayBuffer) {
          return new Blob([this.bodyArrayBuffer]);
        }
        if (this.bodyFormData) {
          throw new Error('could not read FormData body as blob');
        } else {
          return new Blob([this.bodyText]);
        }
      }
    : undefined;

  arrayBuffer = SUPPORTS_BLOB
    ? async () => {
        if (this.bodyArrayBuffer) {
          consumeBody(this);

          if (ArrayBuffer.isView(this.bodyArrayBuffer)) {
            return this.bodyArrayBuffer.buffer.slice(
              this.bodyArrayBuffer.byteOffset,
              this.bodyArrayBuffer.byteOffset + this.bodyArrayBuffer.byteLength,
            );
          }
          return this.bodyArrayBuffer;
        }
        return this.blob!().then(readBlobAsArrayBuffer);
      }
    : undefined;

  async formData() {
    return this.text().then(decode);
  }

  protected initBody(body: unknown) {
    this.bodyInit = body;
    if (!body) {
      this.bodyText = '';
    } else if (typeof body === 'string') {
      this.bodyText = body;
    } else if (SUPPORTS_BLOB && body instanceof Blob) {
      this.bodyBlob = body;
    } else if (body instanceof FormData) {
      this.bodyFormData = formDataToBlob(body);
    } else if (body instanceof URLSearchParams) {
      this.bodyText = body.toString();
    } else if (SUPPORTS_BLOB && isDataView(body)) {
      this.bodyArrayBuffer = bufferClone(body.buffer);
      // IE 10-11 can't handle a DataView body.
      this.bodyInit = new Blob([this.bodyArrayBuffer]);
    } else if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
      this.bodyArrayBuffer = bufferClone(body);
    } else {
      const bodyAsString: string = Object.prototype.toString.call(body);
      body = bodyAsString;
      this.bodyText = bodyAsString;
    }

    if (!this.headers.get('content-type')) {
      if (typeof body === 'string') {
        this.headers.set('content-type', 'text/plain;charset=UTF-8');
      } else if (this.bodyBlob && this.bodyBlob.type) {
        this.headers.set('content-type', this.bodyBlob.type);
      } else if (body instanceof URLSearchParams) {
        this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
      } else if (this.bodyFormData) {
        this.headers.set('content-type', this.bodyFormData.type);
        this.headers.set('content-length', String(this.bodyFormData.size));
      }
    }
  }

  async text(): Promise<string> {
    consumeBody(this);

    if (this.bodyBlob) {
      return readBlobAsText(this.bodyBlob);
    }
    if (this.bodyArrayBuffer) {
      return readArrayBufferAsText(this.bodyArrayBuffer);
    }
    if (this.bodyFormData) {
      return readBlobAsText(this.bodyFormData);
    }
    return this.bodyText;
  }

  async json() {
    return this.text().then((text) => JSON.parse(text));
  }

  get body(): ReadableStream<Uint8Array> {
    const getArrayBuffer = this.arrayBuffer!;
    return new ReadableStream({
      async pull(controller) {
        const asArrayBuffer = await getArrayBuffer();
        controller.enqueue(new Uint8Array(asArrayBuffer));
      },
    });
  }
}

// HTTP methods whose capitalization should be normalized
const methods = new Set(['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']);

function normalizeMethod(method: string): string {
  const upcased: string = method.toUpperCase();
  return methods.has(upcased) ? upcased : method;
}

class Request extends Body {
  url: string;

  credentials: RequestCredentials = 'same-origin';

  method: string = 'GET';

  mode: RequestMode | null = null;

  signal: AbortSignal | null = null;

  referrer: string | null = null;

  constructor(input: Request | string | URL, options?: RequestInit) {
    super();

    options = options || {};
    let body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read');
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      this.signal = input.signal;
      if (!body && input.bodyInit != null) {
        body = input.bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials;
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method);
    this.mode = options.mode || this.mode || null;
    this.signal =
      options.signal ||
      this.signal ||
      (() => {
        if (SUPPORTS_ABORTCONTROLLER) {
          const ctrl = new AbortController();
          return ctrl.signal;
        }
        return null;
      })();
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests');
    }
    this.initBody(body);

    if (this.method === 'GET' || this.method === 'HEAD') {
      if (options.cache === 'no-store' || options.cache === 'no-cache') {
        // Search for a '_' parameter in the query string
        const reParamSearch = /([?&])_=[^&]*/;
        if (reParamSearch.test(this.url)) {
          // If it already exists then set the value with the current time
          this.url = this.url.replace(reParamSearch, `$1_=${new Date().getTime()}`);
        } else {
          // Otherwise add a new '_' parameter to the end with the current time
          const reQueryString = /\?/;
          this.url += `${reQueryString.test(this.url) ? '&' : '?'}_=${new Date().getTime()}`;
        }
      }
    }
  }

  clone() {
    return new Request(this, { body: this.bodyInit });
  }
}

const redirectStatuses = new Set([301, 302, 303, 307, 308]);

class Response extends Body {
  readonly headers: Headers;

  readonly ok: boolean;

  readonly redirected: boolean = false;

  readonly status: number;

  readonly statusText: string;

  readonly type: ResponseType;

  readonly url: string = '';

  static error() {
    const response = new Response(null, { status: 0, statusText: '' });
    // @ts-expect-error
    response.type = 'error';
    return response;
  }

  static redirect(url: string, status: number) {
    if (!redirectStatuses.has(status)) {
      throw new RangeError('Invalid status code');
    }

    return new Response(null, { status, headers: { location: url } });
  }

  constructor(bodyInit: any, options: ResponseInit & { url?: string }) {
    super();
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = options.statusText === undefined ? '' : `${options.statusText}`;
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this.initBody(bodyInit);
  }

  clone() {
    return new Response(this.bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url,
    });
  }
}

const nonBodyMethod = new Set(['GET', 'HEAD']);

async function serializeRequest(request: Request): Promise<[string, FetchOptions]> {
  return [
    request.url,
    {
      headers: Array.from(request.headers.entries()),
      method: request.method,
      mode: request.mode || undefined,
      body: nonBodyMethod.has(normalizeMethod(request.method)) ? undefined : await request.text(),
    },
  ];
}

async function fetch(input: string | URL | Request, init?: RequestInit | undefined) {
  const request = new Request(input, init);

  if (request.signal && request.signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const serializedFetchArgs = await serializeRequest(request);

  const responseStub = await TOOLPAD_BRIDGE.fetch.apply(null, serializedFetchArgs, {
    arguments: { copy: true },
    result: { promise: true, copy: true },
  });

  const body = await responseStub.text.apply(null, [], {
    arguments: { copy: true },
    result: { copy: true, promise: true },
  });

  const response = new Response(body, {
    url: responseStub.url,
    status: responseStub.status,
    statusText: responseStub.statusText,
    headers: new Headers(responseStub.headers.copy()),
  });

  return response;
}

global.Headers = Headers;
// @ts-expect-error This is a best effort
global.Request = Request;
// @ts-expect-error This is a best effort
global.Response = Response;
// @ts-expect-error This is a best effort
global.fetch = fetch;
