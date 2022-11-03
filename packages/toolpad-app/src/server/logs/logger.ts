import pino from 'pino';
import ecsFormat from '@elastic/ecs-pino-format';

import config from '../config';
import {
  recaptchaResSerializer,
  reqSerializer,
  resSerializer,
  rpcReqSerializer,
} from './logSerializers';

let transport;
if (config.ecsNodeUrl) {
  transport = pino.transport({
    target: 'pino-elasticsearch',
    options: {
      index: 'toolpad-pino',
      node: config.ecsNodeUrl,
      auth: {
        apiKey: config.ecsApiKey,
      },
    },
  });
}

const logger = pino(
  {
    enabled: config.serverLogsEnabled,
    level: process.env.LOG_LEVEL || 'info',
    redact: { paths: [] },
    serializers: {
      err: pino.stdSerializers.err,
      req: reqSerializer,
      rpcReq: rpcReqSerializer,
      res: resSerializer,
      recaptchaRes: recaptchaResSerializer,
    },
    ...(config.ecsNodeUrl ? ecsFormat() : {}),
  },
  transport,
);

export default logger;
