import { TextDecoder, TextEncoder } from 'util';
import fetch, { Headers, Request, Response } from 'node-fetch';

if (!global.TextDecoder) {
  // @ts-expect-error
  global.TextDecoder = TextDecoder;
} else {
  // eslint-disable-next-line no-console
  console.info('TextDecoder not polyfilled: running on a platform that supports TextDecoder');
}

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
} else {
  // eslint-disable-next-line no-console
  console.info('TextEncoder not polyfilled: running on a platform that supports TextEncoder');
}

if (!global.fetch) {
  // @ts-expect-error
  global.fetch = fetch;
  // @ts-expect-error
  global.Headers = Headers;
  // @ts-expect-error
  global.Request = Request;
  // @ts-expect-error
  global.Response = Response;
} else {
  // eslint-disable-next-line no-console
  console.info('Fetch API not polyfilled: running on a platform that supports fetch');
}
