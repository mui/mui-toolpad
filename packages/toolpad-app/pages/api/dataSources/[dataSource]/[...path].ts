import { NextApiHandler } from 'next';
import { asArray } from '../../../../src/utils/collections';
import serverDataSources from '../../../../src/toolpadDataSources/server';
import { getConnectionParams, setConnectionParams } from '../../../../src/server/data';

export const config = {
  api: {
    // Supresses false positive nextjs warning "API resolved without sending a response" caused by Sentry
    // Sentry should fix this eventually: https://github.com/getsentry/sentry-javascript/issues/3852
    externalResolver: true,
  },
};

const handlerMap = new Map<String, Function | null | undefined>();
Object.keys(serverDataSources).forEach((dataSource) => {
  handlerMap.set(dataSource, serverDataSources[dataSource]?.createHandler?.());
});

const apiHandler = (async (req, res) => {
  if (req.method === 'GET') {
    const [dataSource] = asArray(req.query.dataSource);
    if (!dataSource) {
      throw new Error(`Missing path parameter "dataSource"`);
    }
    const handler = handlerMap.get(dataSource);
    if (handler) {
      return handler(
        {
          getConnectionParams,
          setConnectionParams,
        },
        req,
        res,
      );
    }
    return res.status(404).json({ message: 'No handler found' });
  }
  // Handle any other HTTP method
  return res.status(405).json({ message: 'Method not supported' });
}) as NextApiHandler;

export default apiHandler;
