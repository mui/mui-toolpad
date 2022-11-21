import * as _ from 'lodash-es';
import { ServerDataSource } from '../types';
import functionSrc from './function/server';
import postgres from './postgres/server';
import rest from './rest/server';
import googleSheets from './googleSheets/server';
import movies from './movies/server';

import config from '../server/config';
import { DEMO_DATASOURCES, PRODUCTION_DATASOURCES } from '../constants';

type ServerDataSources = { [key: string]: ServerDataSource<any, any, any> | undefined };

const serverDataSources: ServerDataSources = _.pick(
  {
    rest,
    function: functionSrc,
    postgres,
    googleSheets,
    movies,
  },
  [...(config.isDemo ? DEMO_DATASOURCES : PRODUCTION_DATASOURCES)],
);

export default serverDataSources;
