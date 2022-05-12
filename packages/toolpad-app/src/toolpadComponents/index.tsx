import { ToolpadComponent } from '@mui/toolpad-core';
import * as appDom from '../appDom';
import { NodeId, VersionOrPreview } from '../types';

export interface ToolpadComponentDefinition {
  displayName: string;
  importedModule?: string;
  importedName?: string;
  builtin?: string;
  codeComponentId?: NodeId;
}

export type ToolpadComponentDefinitions = Record<string, ToolpadComponentDefinition | undefined>;
export interface InstantiatedComponent extends ToolpadComponentDefinition {
  Component: ToolpadComponent<any>;
}
export type InstantiatedComponents = Record<string, InstantiatedComponent | undefined>;

const INTERNAL_COMPONENTS = new Map<string, ToolpadComponentDefinition>([
  [
    'PageRow',
    {
      displayName: 'PageRow',
      importedModule: '@mui/toolpad-components',
      importedName: 'PageRow',
      builtin: 'PageRow',
    },
  ],
  [
    'Stack',
    {
      displayName: 'Stack',
      importedModule: '@mui/toolpad-components',
      importedName: 'Stack',
      builtin: 'Stack',
    },
  ],
  [
    'Button',
    {
      displayName: 'Button',
      importedModule: '@mui/toolpad-components',
      importedName: 'Button',
      builtin: 'Button',
    },
  ],
  [
    'Image',
    {
      displayName: 'Image',
      importedModule: '@mui/toolpad-components',
      importedName: 'Image',
      builtin: 'Image',
    },
  ],
  [
    'DataGrid',
    {
      displayName: 'DataGrid',
      importedModule: '@mui/toolpad-components',
      importedName: 'DataGrid',
      builtin: 'DataGrid',
    },
  ],
  [
    'Container',
    {
      displayName: 'Container',
      importedModule: '@mui/toolpad-components',
      importedName: 'Container',
      builtin: 'Container',
    },
  ],
  [
    'TextField',
    {
      displayName: 'TextField',
      importedModule: '@mui/toolpad-components',
      importedName: 'TextField',
      builtin: 'TextField',
    },
  ],
  [
    'Typography',
    {
      displayName: 'Typography',
      importedModule: '@mui/toolpad-components',
      importedName: 'Typography',
      builtin: 'Typography',
    },
  ],
  [
    'Select',
    {
      displayName: 'Select',
      importedModule: '@mui/toolpad-components',
      importedName: 'Select',
      builtin: 'Select',
    },
  ],
  [
    'Paper',
    {
      displayName: 'Paper',
      importedModule: '@mui/toolpad-components',
      importedName: 'Paper',
      builtin: 'Paper',
    },
  ],
  [
    'CustomLayout',
    {
      displayName: 'CustomLayout',
      importedModule: '@mui/toolpad-components',
      importedName: 'CustomLayout',
      builtin: 'CustomLayout',
    },
  ],
]);

function createCodeComponent(
  appId: string,
  version: VersionOrPreview,
  domNode: appDom.CodeComponentNode,
): ToolpadComponentDefinition {
  return {
    displayName: domNode.name,
    importedModule: `/api/components/${encodeURIComponent(appId)}/${encodeURIComponent(
      version,
    )}/${encodeURIComponent(domNode.id)}`,
    importedName: 'default',
    codeComponentId: domNode.id,
  };
}

export function getToolpadComponents(
  appId: string,
  version: VersionOrPreview,
  dom: appDom.AppDom,
): ToolpadComponentDefinitions {
  const app = appDom.getApp(dom);
  const { codeComponents = [] } = appDom.getChildNodes(dom, app);
  return Object.fromEntries([
    ...INTERNAL_COMPONENTS.entries(),
    ...codeComponents.map((codeComponent) => [
      `codeComponent.${codeComponent.id}`,
      createCodeComponent(appId, version, codeComponent),
    ]),
  ]);
}

export function getToolpadComponent(
  components: ToolpadComponentDefinitions,
  componentId: string,
): ToolpadComponentDefinition {
  const component = components[componentId];

  if (component) {
    return component;
  }

  throw new Error(`Invariant: Accessing unknown component "${componentId}"`);
}
