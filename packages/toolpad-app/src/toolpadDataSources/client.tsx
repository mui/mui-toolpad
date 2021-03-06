import movies from './movies/client';
import functionSrc from './function/client';
// import postgres from './postgres/client';
import rest from './rest/client';
import { ClientDataSource } from '../types';
import googleSheets from './googleSheets/client';

type ClientDataSources = { [key: string]: ClientDataSource<any, any> | undefined };

const clientDataSources: ClientDataSources = process.env.TOOLPAD_DEMO
  ? {
      movies,
    }
  : {
      // postgres,
      function: functionSrc,
      rest,
      googleSheets,
    };

export default clientDataSources;
