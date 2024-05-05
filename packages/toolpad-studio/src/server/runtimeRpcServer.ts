import { createMethod, MethodResolvers } from './rpc';
import type FunctionsManager from './FunctionsManager';
import type DataManager from './DataManager';

interface IToolpadProject {
  functionsManager: FunctionsManager;
  dataManager: DataManager;
}

// Methods exposed to the Toolpad Studio runtime
export function createRpcServer(project: IToolpadProject) {
  return {
    introspectDataProvider: createMethod<typeof project.functionsManager.introspectDataProvider>(
      ({ params }) => {
        return project.functionsManager.introspectDataProvider(...params);
      },
    ),
    getDataProviderRecords: createMethod<typeof project.functionsManager.getDataProviderRecords>(
      ({ params }) => {
        return project.functionsManager.getDataProviderRecords(...params);
      },
    ),
    deleteDataProviderRecord: createMethod<
      typeof project.functionsManager.deleteDataProviderRecord
    >(({ params }) => {
      return project.functionsManager.deleteDataProviderRecord(...params);
    }),
    updateDataProviderRecord: createMethod<
      typeof project.functionsManager.updateDataProviderRecord
    >(({ params }) => {
      return project.functionsManager.updateDataProviderRecord(...params);
    }),
    createDataProviderRecord: createMethod<
      typeof project.functionsManager.createDataProviderRecord
    >(({ params }) => {
      return project.functionsManager.createDataProviderRecord(...params);
    }),
    execQuery: createMethod<typeof project.dataManager.execQuery>(({ params }) => {
      return project.dataManager.execQuery(...params);
    }),
    execFunction: createMethod<typeof project.functionsManager.execFunction>(({ params }) => {
      return project.functionsManager.execFunction(...params);
    }),
  } satisfies MethodResolvers;
}

export type ServerDefinition = ReturnType<typeof createRpcServer>;
