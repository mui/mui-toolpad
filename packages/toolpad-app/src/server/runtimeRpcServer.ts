import { createMethod, MethodResolvers } from './rpc';
import type { ToolpadProject } from './localMode';

// Methods exposed to the Toolpad runtime
export function createRpcServer(project: ToolpadProject) {
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
    execQuery: createMethod<typeof project.dataManager.execQuery>(({ params }) => {
      return project.dataManager.execQuery(...params);
    }),
    execFunction: createMethod<typeof project.functionsManager.execFunction>(({ params }) => {
      return project.functionsManager.execFunction(...params);
    }),
  } satisfies MethodResolvers;
}

export type ServerDefinition = ReturnType<typeof createRpcServer>;
