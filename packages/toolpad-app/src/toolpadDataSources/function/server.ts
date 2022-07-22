import { ServerDataSource } from '../../types';
import {
  FunctionQuery,
  FunctionConnectionParams,
  FunctionResult,
  FunctionPrivateQuery,
} from './types';
import { Maybe } from '../../utils/types';
import execFunction from './execFunction';

async function execBase(
  connection: Maybe<FunctionConnectionParams>,
  functionQuery: FunctionQuery,
  params: Record<string, string>,
): Promise<FunctionResult> {
  const secrets = Object.fromEntries(connection?.secrets ?? []);
  return execFunction(functionQuery.module, { params, secrets });
}

async function execPrivate(
  connection: Maybe<FunctionConnectionParams>,
  query: FunctionPrivateQuery,
) {
  switch (query.kind) {
    case 'secretsKeys':
      return (connection?.secrets ?? []).map(([key]) => key);
    case 'debugExec':
      return execBase(connection, query.query, query.params);
    default:
      throw new Error(`Unknown private query "${(query as FunctionPrivateQuery).kind}"`);
  }
}

async function exec(
  connection: Maybe<FunctionConnectionParams>,
  functionQuery: FunctionQuery,
  params: Record<string, string>,
) {
  const { data, error } = await execBase(connection, functionQuery, params);
  if (error) {
    throw error;
  }
  return { data };
}

const dataSource: ServerDataSource<FunctionConnectionParams, FunctionQuery, any> = {
  exec,
  execPrivate,
};

export default dataSource;
