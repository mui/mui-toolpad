import { ExecFetchResult } from '@mui/toolpad-core';
import { ServerDataSource } from '../../types';
import { LocalQuery, LocalConnectionParams, LocalPrivateApi } from './types';
import { Maybe } from '../../utils/types';
import { getProject } from '../../server/liveProject';
import { parseLegacyFunctionId } from './shared';

async function exec(
  connection: Maybe<LocalConnectionParams>,
  fetchQuery: LocalQuery,
  parameters: Record<string, string>,
): Promise<ExecFetchResult<any>> {
  const project = await getProject();
  if (!fetchQuery.function) {
    throw new Error('Missing function name');
  }
  const parsed = parseLegacyFunctionId(fetchQuery.function);
  if (!parsed.handler) {
    throw new Error('Missing function name');
  }
  const { data, error } = await project.functionsManager.exec(
    parsed.file,
    parsed.handler,
    parameters,
  );
  return { data, error };
}

const dataSource: ServerDataSource<{}, LocalQuery, any, LocalPrivateApi> = {
  exec,
  api: {
    async introspection() {
      const project = await getProject();
      return project.functionsManager.introspect();
    },
    async debugExec(query, params) {
      return exec(null, query, params);
    },
    async openEditor(fileName) {
      const project = await getProject();
      return project.functionsManager.openQueryEditor(fileName);
    },
    async createNew(fileName) {
      const project = await getProject();
      return project.functionsManager.createFunctionFile(fileName);
    },
  },
};

export default dataSource;
