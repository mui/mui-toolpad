import { NodeId, BindableAttrValue } from '@mui/toolpad-core';
import {
  App,
  DomNodeAttributeType,
  PrismaClient,
  Release,
  Prisma,
} from '../../prisma/generated/client';
import { ServerDataSource, ApiResult, VersionOrPreview } from '../types';
import serverDataSources from '../toolpadDataSources/server';
import * as appDom from '../appDom';
import { omit } from '../utils/immutability';
import { asArray } from '../utils/collections';
import { decryptSecret, encryptSecret } from './secrets';
import evalExpression from './evalExpression';

// See https://github.com/prisma/prisma/issues/5042#issuecomment-1104679760
function excludeFields<T, K extends (keyof T)[]>(
  fields: T,
  excluded: K,
): Record<Exclude<keyof T, K[number]>, boolean> {
  const result = {} as Record<Exclude<keyof T, K[number]>, boolean>;
  for (const key of Object.keys(fields)) {
    if (!excluded.includes(key as any)) {
      result[key as Exclude<keyof T, K[number]>] = true;
    }
  }
  return result;
}

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient();
  }

  // avoid Next.js dev server from creating too many prisma clients
  // See https://github.com/prisma/prisma/issues/1983
  if (!(globalThis as any).prisma) {
    (globalThis as any).prisma = new PrismaClient();
  }

  return (globalThis as any).prisma;
}

const prisma = getPrismaClient();

function serializeValue(value: unknown, type: DomNodeAttributeType): string {
  const serialized = value === undefined ? '' : JSON.stringify(value);
  return type === 'secret' ? encryptSecret(serialized) : serialized;
}

function deserializeValue(dbValue: string, type: DomNodeAttributeType): unknown {
  const serialized = type === 'secret' ? decryptSecret(dbValue) : dbValue;
  return serialized.length <= 0 ? undefined : JSON.parse(serialized);
}

export async function saveDom(appId: string, app: appDom.AppDom): Promise<void> {
  await prisma.$transaction([
    prisma.domNode.deleteMany({ where: { appId } }),
    prisma.domNode.createMany({
      data: Array.from(Object.values(app.nodes) as appDom.AppDomNode[], (node) => {
        return {
          appId,
          id: node.id,
          name: node.name,
          type: node.type,
          parentId: node.parentId || undefined,
          parentIndex: node.parentIndex || undefined,
          parentProp: node.parentProp || undefined,
        };
      }),
    }),
    prisma.domNodeAttribute.createMany({
      data: Object.values(app.nodes).flatMap((node: appDom.AppDomNode) => {
        const namespaces = omit(node, ...appDom.RESERVED_NODE_PROPERTIES);
        const attributesData = Object.entries(namespaces).flatMap(([namespace, attributes]) => {
          return Object.entries(attributes).map(([attributeName, attributeValue]) => {
            return {
              nodeId: node.id,
              namespace,
              name: attributeName,
              type: attributeValue.type,
              value: serializeValue(attributeValue.value, attributeValue.type),
            };
          });
        });
        return attributesData;
      }),
    }),
    prisma.app.update({
      where: {
        id: appId,
      },
      data: { editedAt: new Date() },
    }),
  ]);
}

async function loadPreviewDom(appId: string): Promise<appDom.AppDom> {
  const dbNodes = await prisma.domNode.findMany({
    where: { appId },
    include: { attributes: true },
  });

  const root = dbNodes.find((node) => !node.parentId)?.id as NodeId;
  const nodes = Object.fromEntries(
    dbNodes.map((node): [NodeId, appDom.AppDomNode] => {
      const nodeId = node.id as NodeId;

      return [
        nodeId,
        {
          id: nodeId,
          type: node.type,
          name: node.name,
          parentId: node.parentId as NodeId | null,
          parentProp: node.parentProp,
          parentIndex: node.parentIndex,
          attributes: {},
          ...node.attributes.reduce((result, attribute) => {
            if (!result[attribute.namespace]) {
              result[attribute.namespace] = {};
            }
            result[attribute.namespace][attribute.name] = {
              type: attribute.type,
              value: deserializeValue(attribute.value, attribute.type),
            } as BindableAttrValue<unknown>;
            return result;
          }, {} as Record<string, Record<string, BindableAttrValue<unknown>>>),
        } as appDom.AppDomNode,
      ];
    }),
  );

  if (!root) {
    throw new Error(`App "${appId}" not found`);
  }

  return {
    root,
    nodes,
  };
}

export async function getApps() {
  return prisma.app.findMany({
    orderBy: {
      editedAt: 'desc',
    },
  });
}

export async function getActiveDeployments() {
  return prisma.deployment.findMany({
    distinct: ['appId'],
    orderBy: { createdAt: 'desc' },
  });
}

export async function getApp(id: string) {
  return prisma.app.findUnique({ where: { id } });
}

function createDefaultConnections(dom: appDom.AppDom): appDom.ConnectionNode[] {
  if (process.env.TOOLPAD_DEMO) {
    return [
      appDom.createNode(dom, 'connection', {
        name: 'movies',
        attributes: {
          dataSource: appDom.createConst('movies'),
          params: appDom.createSecret({ apiKey: '12345' }),
          status: appDom.createConst(null),
        },
      }),
    ];
  }

  return [
    appDom.createNode(dom, 'connection', {
      name: 'rest',
      attributes: {
        dataSource: appDom.createConst('rest'),
        params: appDom.createSecret({}),
        status: appDom.createConst(null),
      },
    }),
  ];
}

function createDefaultDom(): appDom.AppDom {
  let dom = appDom.createDom();
  const appNode = appDom.getApp(dom);

  // Create default connections
  const defaultConnections = createDefaultConnections(dom);
  for (const connection of defaultConnections) {
    dom = appDom.addNode(dom, connection, appNode, 'connections');
  }

  // Create default page
  const newPageNode = appDom.createNode(dom, 'page', {
    name: 'Page 1',
    attributes: {
      title: appDom.createConst('Page 1'),
    },
  });

  dom = appDom.addNode(dom, newPageNode, appNode, 'pages');

  return dom;
}

export async function createApp(name: string): Promise<App> {
  return prisma.$transaction(async () => {
    const app = await prisma.app.create({
      data: { name },
    });

    const dom = createDefaultDom();

    await saveDom(app.id, dom);

    return app;
  });
}

export async function updateApp(appId: string, name: string): Promise<App> {
  return prisma.app.update({
    where: {
      id: appId,
    },
    data: { name },
  });
}

export async function deleteApp(id: string) {
  return prisma.app.delete({
    where: { id },
  });
}

interface CreateReleaseParams {
  description: string;
}

const SELECT_RELEASE_META = excludeFields(Prisma.ReleaseScalarFieldEnum, ['snapshot']);

async function findLastReleaseInternal(appId: string) {
  return prisma.release.findFirst({
    where: { appId },
    orderBy: { version: 'desc' },
  });
}

export async function findLastRelease(appId: string) {
  return prisma.release.findFirst({
    where: { appId },
    orderBy: { version: 'desc' },
    select: SELECT_RELEASE_META,
  });
}

export async function createRelease(
  appId: string,
  { description }: CreateReleaseParams,
): Promise<Pick<Release, keyof typeof SELECT_RELEASE_META>> {
  const currentDom = await loadPreviewDom(appId);
  const snapshot = Buffer.from(JSON.stringify(currentDom), 'utf-8');

  const lastRelease = await findLastReleaseInternal(appId);
  const versionNumber = lastRelease ? lastRelease.version + 1 : 1;

  const release = await prisma.release.create({
    select: SELECT_RELEASE_META,
    data: {
      appId,
      version: versionNumber,
      description,
      snapshot,
    },
  });

  return release;
}

export async function getReleases(appId: string) {
  return prisma.release.findMany({
    where: { appId },
    select: SELECT_RELEASE_META,
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getRelease(appId: string, version: number) {
  return prisma.release.findUnique({
    where: { release_app_constraint: { appId, version } },
    select: SELECT_RELEASE_META,
  });
}

export async function createDeployment(appId: string, version: number) {
  return prisma.deployment.create({
    data: {
      app: {
        connect: { id: appId },
      },
      release: {
        connect: { release_app_constraint: { appId, version } },
      },
    },
  });
}

export async function findActiveDeployment(appId: string) {
  return prisma.deployment.findFirst({
    where: { appId },
    orderBy: { createdAt: 'desc' },
    include: {
      release: {
        select: SELECT_RELEASE_META,
      },
    },
  });
}

export async function loadReleaseDom(appId: string, version: number): Promise<appDom.AppDom> {
  const release = await prisma.release.findUnique({
    where: { release_app_constraint: { appId, version } },
  });
  if (!release) {
    throw new Error(`release doesn't exist`);
  }
  return JSON.parse(release.snapshot.toString('utf-8')) as appDom.AppDom;
}

async function getConnection<P = unknown>(
  appId: string,
  id: string,
): Promise<appDom.ConnectionNode<P>> {
  const dom = await loadPreviewDom(appId);
  return appDom.getNode(dom, id as NodeId, 'connection') as appDom.ConnectionNode<P>;
}

export async function getConnectionParams<P = unknown>(
  appId: string,
  id: string,
): Promise<P | null> {
  const dom = await loadPreviewDom(appId);
  const node = appDom.getNode(dom, id as NodeId, 'connection') as appDom.ConnectionNode<P>;
  return node.attributes.params.value;
}

export async function setConnectionParams<P>(
  appId: string,
  connectionId: NodeId,
  params: P,
): Promise<void> {
  let dom = await loadPreviewDom(appId);
  const existing = appDom.getNode(dom, connectionId, 'connection');

  dom = appDom.setNodeNamespacedProp(
    dom,
    existing,
    'attributes',
    'params',
    appDom.createSecret(params),
  );

  await saveDom(appId, dom);
}

async function applyTransform(transform: string, result: ApiResult<{}>): Promise<ApiResult<{}>> {
  const transformFn = `(data) => {${transform}}`;
  return {
    data: await evalExpression(`${transformFn}(${JSON.stringify(result.data)})`),
  };
}

export async function execQuery<P, Q>(
  appId: string,
  query: appDom.QueryNode<Q>,
  params: Q,
): Promise<ApiResult<any>> {
  const dataSource: ServerDataSource<P, Q, any> | undefined =
    query.attributes.dataSource && serverDataSources[query.attributes.dataSource.value];
  if (!dataSource) {
    throw new Error(
      `Unknown datasource "${query.attributes.dataSource?.value}" for query "${query.id}"`,
    );
  }

  const connectionParams = await getConnectionParams<P>(appId, query.attributes.connectionId.value);

  const transformEnabled = query.attributes.transformEnabled?.value;
  const transform = query.attributes.transform?.value;
  let result = await dataSource.exec(connectionParams, query.attributes.query.value, params);
  if (transformEnabled && transform) {
    result = await applyTransform(transform, result);
  }
  return result;
}

export async function dataSourceFetchPrivate<P, Q>(
  appId: string,
  connectionId: NodeId,
  query: Q,
): Promise<any> {
  const connection: appDom.ConnectionNode<P> = await getConnection<P>(appId, connectionId);
  const dataSourceId = connection.attributes.dataSource.value;
  const dataSource: ServerDataSource<P, Q, any> | undefined = serverDataSources[dataSourceId];

  if (!dataSource) {
    throw new Error(`Unknown dataSource "${dataSourceId}" for connection "${connection.id}"`);
  }

  if (!dataSource.execPrivate) {
    throw new Error(`No execPrivate available on datasource "${dataSourceId}"`);
  }

  const connectionParams = connection.attributes.params.value;

  return dataSource.execPrivate(connectionParams, query);
}

export function parseVersion(param?: string | string[]): VersionOrPreview | null {
  if (!param) {
    return null;
  }
  const [maybeVersion] = asArray(param);
  if (maybeVersion === 'preview') {
    return maybeVersion;
  }
  const parsed = Number(maybeVersion);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function loadDom(appId: string, version: VersionOrPreview = 'preview') {
  return version === 'preview' ? loadPreviewDom(appId) : loadReleaseDom(appId, version);
}

/**
 * Version of loadDom that returns a subset of the dom that doesn't contain sensitive information
 */
export async function loadRenderTree(appId: string, version: VersionOrPreview = 'preview') {
  return appDom.createRenderTree(await loadDom(appId, version));
}
