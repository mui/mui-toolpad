import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import logInfo from './logInfo';
import type { RpcResponse } from '../../../pages/api/rpc';

type RestArgs = [
  chunk: any,
  encoding: BufferEncoding,
  callback?: ((error?: Error | null) => void) | undefined,
];

const logWithResponseBody = (
  res: NextApiResponse,
  logger: (responseBody: Record<string, unknown>) => void,
): void => {
  const oldWrite = res.write;
  const oldEnd = res.end;

  const chunks: Buffer[] = [];
  res.write = (...restArgs: any[]) => {
    chunks.push(Buffer.from(restArgs[0]));
    return oldWrite.apply(res, restArgs as RestArgs);
  };

  res.end = (...restArgs: any[]) => {
    if (restArgs[0]) {
      chunks.push(Buffer.from(restArgs[0]));
    }

    const responseBody = JSON.parse(Buffer.concat(chunks).toString('utf8'), (key, value) =>
      key === 'stack' ? null : value,
    );
    logger(responseBody);

    return oldEnd.apply(res, restArgs as RestArgs);
  };
};

export const withReqResLogs =
  (apiHandler: NextApiHandler) =>
  (req: NextApiRequest, res: NextApiResponse): unknown | Promise<unknown> => {
    logInfo(
      {
        key: 'apiReqRes',
        req,
        res,
      },
      'Handled request',
    );

    return apiHandler(req, res);
  };

export const withRpcReqResLogs =
  (apiHandler: NextApiHandler) =>
  async (req: NextApiRequest, res: NextApiResponse): Promise<unknown> => {
    logWithResponseBody(res, (resBody) => {
      const error = (resBody as RpcResponse).error;

      logInfo(
        {
          key: 'rpcReqRes',
          rpcReq: req,
          rpcRes: res,
          ...(error ? { rpcResErr: error } : {}),
        },
        `Handled request (${req.body.type}:${req.body.name})`,
      );
    });

    return apiHandler(req, res);
  };
