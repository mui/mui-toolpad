import pino from 'pino';
import ecsFormat from '@elastic/ecs-pino-format';

import config from './config';
import { reqSerializer, resSerializer } from './logSerializers';

let transport;
if (config.ecsCloudId) {
  transport = pino.transport({
    target: 'pino-elasticsearch',
    options: {
      index: 'toolpad-pino',
      cloud: {
        id: config.ecsCloudId,
      },
      auth: {
        apiKey: config.ecsApiKey,
      },
    },
  });
}

const logger = pino(
  {
    enabled: config.apiLogsEnabled,
    level: process.env.LOG_LEVEL || 'info',
    redact: { paths: [] },
    serializers: {
      err: pino.stdSerializers.err,
      req: reqSerializer,
      res: resSerializer,
    },
    ...(config.ecsCloudId ? ecsFormat() : {}),
  },
  transport,
);

export default logger;
