import { NextApiHandler } from 'next';
import { transform } from 'sucrase';
import { loadDom } from '../../../src/server/data';
import renderPageCode from '../../../src/renderPageCode';
import { NodeId } from '../../../src/types';

export default (async (req, res) => {
  const dom = await loadDom();
  const pageNodeId = req.query.pageId as NodeId;
  const generated = renderPageCode(dom, pageNodeId, { pretty: true });
  const transformed = transform(generated.code, {
    transforms: ['jsx', 'typescript'],
    filePath: `/pages/${pageNodeId}.tsx`,
  });
  res.setHeader('content-type', 'application/javascript');
  if (req.query.dev) {
    // dev mode thta always fetches
    // TODO: this doesn't seem to work yet
    res.setHeader('cache-control', 'no-cache');
  }
  res.send(transformed.code);
}) as NextApiHandler<string>;
