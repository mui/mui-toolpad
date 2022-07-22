import * as path from 'path';

/**
 * Use projectRoot serevrside to resolve files against.
 * - __dirname doesn't work in Next.js.
 *   See https://github.com/vercel/next.js/discussions/32236
 * - We run jest from the monorepo root and it doesn't mock cwd for the projects. So
 *   we'll override it with __dirname
 *   See https://github.com/facebook/jest/issues/6155
 */
export default process.env.NODE_ENV === 'test' ? path.resolve(__dirname, '../..') : process.cwd();
