// whatwg-url depends on TextEndoder/TextDecoder
import './textEncoding';
import { URL, URLSearchParams } from 'whatwg-url';

// @ts-expect-error Can't turn off @types/node which gets pulled in automatically
// https://github.com/microsoft/TypeScript/issues/37053
global.URL = URL;

// @ts-expect-error Can't turn off @types/node which gets pulled in automatically
// https://github.com/microsoft/TypeScript/issues/37053
global.URLSearchParams = URLSearchParams;

export {};
