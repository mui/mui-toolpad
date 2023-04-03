import * as yaml from 'yaml';
import * as path from 'path';
import * as fs from 'fs/promises';
import invariant from 'invariant';
import openEditor from 'open-editor';
import chalk from 'chalk';
import { BindableAttrValue, NodeId } from '@mui/toolpad-core';
import { fromZodError } from 'zod-validation-error';
import { glob } from 'glob';
import * as chokidar from 'chokidar';
import { debounce } from 'lodash-es';
import config from '../config';
import * as appDom from '../appDom';
import { errorFrom } from '../utils/errors';
import { migrateUp } from '../appDom/migrations';
import insecureHash from '../utils/insecureHash';
import { writeFileRecursive, readMaybeFile, readMaybeDir, updateYamlFile } from '../utils/fs';
import {
  PageType,
  QueryType,
  ElementType,
  NavigationActionType,
  Page,
  TemplateType,
  BindablePropType,
} from './schema';
import { filterValues, hasOwnProperty, mapValues } from '../utils/collections';
import { format } from '../utils/prettier';

export function getUserProjectRoot(): string {
  const { projectDir } = config;
  invariant(projectDir, 'Toolpad in local mode must have a project directory defined');
  return projectDir;
}

export async function fileExists(filepath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filepath);
    return stat.isFile();
  } catch (err) {
    if (errorFrom(err).code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

function getToolpadFolder(root: string): string {
  return path.resolve(root, './toolpad');
}

function getQueriesFile(root: string): string {
  return path.resolve(getToolpadFolder(root), './queries.ts');
}

function getComponentsFolder(root: string): string {
  const toolpadFolder = getToolpadFolder(root);
  return path.resolve(toolpadFolder, './components');
}

function getPagesFolder(root: string): string {
  const toolpadFolder = getToolpadFolder(root);
  return path.resolve(toolpadFolder, './pages');
}

function getComponentFilePath(componentsFolder: string, componentName: string): string {
  return path.resolve(componentsFolder, `${componentName}.tsx`);
}

export async function getConfigFilePath(root: string) {
  const yamlFilePath = path.resolve(root, './toolpad.yaml');
  const ymlFilePath = path.resolve(root, './toolpad.yml');

  if (await fileExists(yamlFilePath)) {
    return yamlFilePath;
  }

  if (await fileExists(ymlFilePath)) {
    return ymlFilePath;
  }

  return yamlFilePath;
}

type ComponentsContent = Record<string, string>;

export const QUERIES_FILE = `./toolpad/queries.ts`;

async function loadCodeComponentsFromFiles(root: string): Promise<ComponentsContent> {
  const componentsFolder = getComponentsFolder(root);
  const entries = (await readMaybeDir(componentsFolder)) || [];
  const resultEntries = await Promise.all(
    entries.map(async (entry): Promise<[string, string] | null> => {
      if (entry.isFile()) {
        const fileName = entry.name;
        const componentName = entry.name.replace(/\.tsx$/, '');
        const filePath = path.resolve(componentsFolder, fileName);
        const content = await fs.readFile(filePath, { encoding: 'utf-8' });
        return [componentName, content];
      }

      return null;
    }),
  );

  return Object.fromEntries(resultEntries.filter(Boolean));
}

async function loadPagesFromFiles(root: string): Promise<PagesContent> {
  const pagesFolder = getPagesFolder(root);
  const entries = (await readMaybeDir(pagesFolder)) || [];
  const resultEntries = await Promise.all(
    entries.map(async (entry): Promise<[string, PageType] | null> => {
      if (entry.isDirectory()) {
        const pageName = entry.name;
        const filePath = path.resolve(pagesFolder, pageName, './page.yml');
        const content = await readMaybeFile(filePath);
        if (!content) {
          return null;
        }
        let parsedFile: string | undefined;
        try {
          parsedFile = yaml.parse(content);
        } catch (rawError) {
          const error = errorFrom(rawError);

          console.error(
            `${chalk.red('error')} - Failed to read page ${chalk.cyan(pageName)}. ${error.message}`,
          );

          return null;
        }

        const result = Page.safeParse(parsedFile);
        if (result.success) {
          return [pageName, result.data];
        }

        console.error(
          `${chalk.red('error')} - Failed to read page ${chalk.cyan(pageName)}. ${fromZodError(
            result.error,
          )}`,
        );

        return null;
      }

      return null;
    }),
  );

  return Object.fromEntries(resultEntries.filter(Boolean));
}

function createDefaultCodeComponent(name: string): string {
  const componentId = name.replace(/\s/g, '');
  const propTypeId = `${componentId}Props`;
  return format(`
    import * as React from 'react';
    import { Typography } from '@mui/material';
    import { createComponent } from '@mui/toolpad/browser';
    
    export interface ${propTypeId} {
      msg: string;
    }
    
    function ${componentId}({ msg }: ${propTypeId}) {
      return (
        <Typography>{msg}</Typography>
      );
    }

    export default createComponent(${componentId}, {
      argTypes: {
        msg: {
          typeDef: { type: "string", default: "Hello world!" },
        },
      },
    });    
  `);
}

export async function createComponent(name: string) {
  const root = getUserProjectRoot();
  const componentsFolder = getComponentsFolder(root);
  const filePath = getComponentFilePath(componentsFolder, name);
  const content = createDefaultCodeComponent(name);
  await writeFileRecursive(filePath, content, { encoding: 'utf-8' });
}

class Lock {
  pending: Promise<any> | null = null;

  async use<T = void>(doWork: () => Promise<T>): Promise<T> {
    try {
      this.pending = Promise.resolve(this.pending).then(() => doWork());
      return await this.pending;
    } finally {
      this.pending = null;
    }
  }
}

const configFileLock = new Lock();

async function loadConfigFileFrom(configFilePath: string): Promise<appDom.AppDom | null> {
  // Using a lock to avoid read during write which may result in reading truncated file content
  const configContent = await configFileLock.use(() => readMaybeFile(configFilePath));

  if (!configContent) {
    return null;
  }

  const parsedConfig = yaml.parse(configContent);
  invariant(parsedConfig, 'Invalid Toolpad config');
  return parsedConfig;
}

async function loadConfigFile(root: string) {
  const configFilePath = await getConfigFilePath(root);
  const dom = await loadConfigFileFrom(configFilePath);

  if (dom) {
    return dom;
  }

  throw new Error(`No toolpad dom found`);
}

async function writeConfigFile(root: string, dom: appDom.AppDom): Promise<void> {
  const configFilePath = await getConfigFilePath(root);
  await configFileLock.use(() => updateYamlFile(configFilePath, dom));
}

const DEFAULT_QUERIES_FILE_CONTENT = `// Toolpad queries:

export async function example() {
  return [
    { firstname: 'Nell', lastName: 'Lester' },
    { firstname: 'Keanu', lastName: 'Walter' },
    { firstname: 'Daniella', lastName: 'Sweeney' },
  ];
}
`;

async function initToolpadFolder(root: string) {
  const toolpadFolder = getToolpadFolder(root);
  await fs.mkdir(toolpadFolder, { recursive: true });
}

async function initQueriesFile(root: string): Promise<void> {
  const queriesFilePath = getQueriesFile(root);
  if (!(await fileExists(queriesFilePath))) {
    // eslint-disable-next-line no-console
    console.log(`${chalk.blue('info')}  - Initializing Toolpad queries file`);
    await writeFileRecursive(queriesFilePath, DEFAULT_QUERIES_FILE_CONTENT, { encoding: 'utf-8' });
  }
}

async function initToolpadFile(root: string): Promise<void> {
  const configFilePath = await getConfigFilePath(root);
  if (!(await fileExists(configFilePath))) {
    // eslint-disable-next-line no-console
    console.log(`${chalk.blue('info')}  - Initializing Toolpad config file`);
    const defaultDom = appDom.createDefaultDom();
    await writeConfigFile(root, defaultDom);
  }
}

const DEFAULT_GENERATED_GITIGNORE_FILE_CONTENT = `*
!.gitignore
`;

async function initGeneratedGitignore(root: string) {
  const generatedFolder = path.resolve(root, '.toolpad-generated');
  const generatedGitignorePath = path.resolve(generatedFolder, '.gitignore');
  if (!(await fileExists(generatedGitignorePath))) {
    // eslint-disable-next-line no-console
    console.log(`${chalk.blue('info')}  - Initializing Toolpad queries file`);
    await writeFileRecursive(generatedGitignorePath, DEFAULT_GENERATED_GITIGNORE_FILE_CONTENT, {
      encoding: 'utf-8',
    });
  }
}

async function writeCodeComponentsToFiles(
  componentsFolder: string,
  components: ComponentsContent,
): Promise<void> {
  await Promise.all(
    Object.entries(components).map(async ([componentName, content]) => {
      const filePath = getComponentFilePath(componentsFolder, componentName);
      await writeFileRecursive(filePath, content, { encoding: 'utf-8' });
    }),
  );
}

function mergeComponentsContentIntoDom(
  dom: appDom.AppDom,
  componentsContent: ComponentsContent,
): appDom.AppDom {
  const rootNode = appDom.getApp(dom);
  const { codeComponents: codeComponentNodes = [] } = appDom.getChildNodes(dom, rootNode);
  const names = new Set([
    ...Object.keys(componentsContent),
    ...codeComponentNodes.map((node) => node.name),
  ]);

  for (const name of names) {
    const content: string | undefined = componentsContent[name];
    const codeComponentNode = codeComponentNodes.find((node) => node.name === name);
    if (content) {
      if (codeComponentNode) {
        dom = appDom.setNodeNamespacedProp(
          dom,
          codeComponentNode,
          'attributes',
          'code',
          appDom.createConst(content),
        );
      } else {
        const newNode = appDom.createNode(dom, 'codeComponent', {
          name,
          attributes: {
            code: appDom.createConst(content),
          },
        });
        dom = appDom.addNode(dom, newNode, rootNode, 'codeComponents');
      }
    } else if (codeComponentNode) {
      dom = appDom.removeNode(dom, codeComponentNode.id);
    }
  }

  return dom;
}

function toBindable<V>(value: V | { $$jsExpression: string }): BindableAttrValue<V> {
  if (value && typeof value === 'object' && typeof (value as any).$$jsExpression === 'string') {
    return { type: 'jsExpression', value: (value as any).$$jsExpression };
  }
  return { type: 'const', value: value as V };
}

function fromBindable<V>(bindable: BindableAttrValue<V>) {
  switch (bindable.type) {
    case 'const':
      return bindable.value;
    case 'jsExpression':
      return { $$jsExpression: bindable.value };
    default:
      throw new Error(`Unsupported bindable "${bindable.type}"`);
  }
}

function toBindableProp<V>(value: V | { $$jsExpression: string }): BindableAttrValue<V> {
  if (value && typeof value === 'object') {
    if (typeof (value as any).$$jsExpression === 'string') {
      return { type: 'jsExpression', value: (value as any).$$jsExpression };
    }
    if (typeof (value as any).$$jsExpressionAction === 'string') {
      return { type: 'jsExpressionAction', value: (value as any).$$jsExpressionAction };
    }
    if (typeof (value as any).$$navigationAction === 'string') {
      const action = value as any as NavigationActionType;
      return {
        type: 'navigationAction',
        value: {
          page: { $$ref: action.$$navigationAction.page as NodeId },
          parameters: mapValues(
            action.$$navigationAction.parameters,
            (param) => param && toBindable(param),
          ),
        },
      };
    }
  }
  return { type: 'const', value: value as V };
}

function fromBindableProp<V>(bindable: BindableAttrValue<V>) {
  switch (bindable.type) {
    case 'const':
      return bindable.value;
    case 'jsExpression':
      return { $$jsExpression: bindable.value };
    case 'jsExpressionAction':
      return { $$jsExpressionAction: bindable.value };
    case 'navigationAction':
      return {
        $$navigationAction: {
          page: bindable.value.page.$$ref,
          parameters:
            bindable.value.parameters &&
            mapValues(bindable.value.parameters, (param) => param && fromBindable(param)),
        },
      };
    default:
      throw new Error(`Unsupported bindable "${bindable.type}"`);
  }
}

function stringOnly(maybeString: unknown): string | undefined {
  return typeof maybeString === 'string' ? maybeString : undefined;
}

function expandChildren(children: appDom.ElementNode[], dom: appDom.AppDom): ElementType[];
function expandChildren(children: appDom.QueryNode[], dom: appDom.AppDom): QueryType[];
function expandChildren<N extends appDom.AppDomNode>(
  children: N[],
  dom: appDom.AppDom,
): (QueryType | ElementType)[];
function expandChildren<N extends appDom.AppDomNode>(children: N[], dom: appDom.AppDom) {
  return (
    children
      .sort((child1, child2) => {
        invariant(
          child1.parentIndex && child2.parentIndex,
          'Nodes are not children of another node',
        );
        return appDom.compareFractionalIndex(child1.parentIndex, child2.parentIndex);
      })
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      .map((child) => expandFromDom(child, dom))
  );
}

function undefinedWhenEmpty<O extends object | any[]>(obj?: O): O | undefined {
  if (!obj || Object.values(obj).every((property) => property === undefined)) {
    return undefined;
  }
  return obj;
}

function expandFromDom(node: appDom.ElementNode, dom: appDom.AppDom): ElementType;
function expandFromDom(node: appDom.QueryNode, dom: appDom.AppDom): QueryType;
function expandFromDom(node: appDom.PageNode, dom: appDom.AppDom): PageType;
function expandFromDom<N extends appDom.AppDomNode>(
  node: N,
  dom: appDom.AppDom,
): PageType | QueryType | ElementType;
function expandFromDom<N extends appDom.AppDomNode>(
  node: N,
  dom: appDom.AppDom,
): PageType | QueryType | ElementType {
  if (appDom.isPage(node)) {
    const children = appDom.getChildNodes(dom, node);

    return {
      id: node.id,
      title: node.attributes.title?.value,
      parameters: undefinedWhenEmpty(
        node.attributes.parameters?.value.map(([name, value]) => ({ name, value })) ?? [],
      ),
      content: undefinedWhenEmpty(expandChildren(children.children || [], dom)),
      queries: undefinedWhenEmpty(expandChildren(children.queries || [], dom)),
    } satisfies PageType;
  }

  if (appDom.isQuery(node)) {
    return {
      name: node.name,
      enabled: node.attributes.enabled ? fromBindable(node.attributes.enabled) : undefined,
      mode: node.attributes.mode?.value,
      dataSource: node.attributes.dataSource?.value,
      query: node.attributes.query.value,
      parameters: undefinedWhenEmpty(
        node.params?.map(([name, value]) => ({ name, value: fromBindable(value) })),
      ),
      cacheTime: node.attributes.cacheTime?.value,
      refetchInterval: node.attributes.refetchInterval?.value,
      transform: node.attributes.transform?.value,
      transformEnabled: node.attributes.transformEnabled?.value,
    } satisfies QueryType;
  }

  if (appDom.isElement(node)) {
    const { children, ...templates } = appDom.getChildNodes(dom, node);

    const plainProps = mapValues(node.props || {}, (prop) => prop && fromBindableProp(prop));

    const templateProps = mapValues(templates, (subtree) =>
      subtree
        ? {
            $$template: expandChildren(subtree, dom),
          }
        : undefined,
    );

    return {
      component: node.attributes.component.value,
      name: node.name,
      layout: undefinedWhenEmpty({
        columnSize: node.layout?.columnSize?.value,
        horizontalAlign: stringOnly(node.layout?.horizontalAlign?.value),
        verticalAlign: stringOnly(node.layout?.verticalAlign?.value),
      }),
      props: undefinedWhenEmpty({ ...plainProps, ...templateProps }),
      children: undefinedWhenEmpty(expandChildren(children || [], dom)),
    } satisfies ElementType;
  }

  throw new Error(`Unsupported node type "${node.type}"`);
}

function isTemplate(bindableProp?: BindablePropType): bindableProp is TemplateType {
  return !!(
    bindableProp &&
    typeof bindableProp === 'object' &&
    hasOwnProperty(bindableProp, '$$template')
  );
}

function mergeElementIntoDom(
  dom: appDom.AppDom,
  parent: appDom.ElementNode | appDom.PageNode,
  parentProp: string,
  elm: ElementType,
): appDom.AppDom {
  const plainProps = filterValues(elm.props ?? {}, (prop) => !isTemplate(prop)) as Record<
    string,
    Exclude<BindablePropType, TemplateType>
  >;

  const templateProps = filterValues(elm.props ?? {}, isTemplate) as Record<string, TemplateType>;

  const elmNode = appDom.createElement(
    dom,
    elm.component,
    mapValues(plainProps, (propValue) => toBindableProp(propValue)),
    mapValues(elm.layout ?? {}, (propValue) =>
      propValue ? appDom.createConst(propValue) : undefined,
    ),
    elm.name,
  );

  dom = appDom.addNode(dom, elmNode, parent, parentProp as any);

  if (elm.children) {
    for (const child of elm.children) {
      dom = mergeElementIntoDom(dom, elmNode, 'children', child);
    }
  }

  for (const [propName, templateProp] of Object.entries(templateProps)) {
    for (const child of templateProp.$$template) {
      dom = mergeElementIntoDom(dom, elmNode, propName, child);
    }
  }

  return dom;
}

function createPageDomFromPageFile(pageName: string, pageFile: PageType): appDom.AppDom {
  let fragment = appDom.createFragmentInternal(pageFile.id as NodeId, 'page', {
    name: pageName,
    attributes: {
      title: appDom.createConst(pageFile.title || ''),
      parameters: appDom.createConst(
        pageFile.parameters?.map(({ name, value }) => [name, value]) || [],
      ),
    },
  });

  const pageNode = appDom.getRoot(fragment);
  appDom.assertIsPage(pageNode);

  if (pageFile.queries) {
    for (const query of pageFile.queries) {
      const queryNode = appDom.createNode(fragment, 'query', {
        name: query.name,
        attributes: {
          connectionId: appDom.createConst(null),
          dataSource:
            typeof query.dataSource === 'string' ? appDom.createConst(query.dataSource) : undefined,
          query: appDom.createConst(query.query),
          cacheTime:
            typeof query.cacheTime === 'number' ? appDom.createConst(query.cacheTime) : undefined,
          enabled: query.enabled ? toBindable(query.enabled) : undefined,
          mode: typeof query.mode === 'string' ? appDom.createConst(query.mode) : undefined,
          transform:
            typeof query.transform === 'string' ? appDom.createConst(query.transform) : undefined,
          refetchInterval:
            typeof query.refetchInterval === 'number'
              ? appDom.createConst(query.refetchInterval)
              : undefined,
          transformEnabled: query.transformEnabled
            ? appDom.createConst(query.transformEnabled)
            : undefined,
        },
        params: query.parameters?.map(
          ({ name, value }) => [name, toBindable(value)] satisfies [string, BindableAttrValue<any>],
        ),
      });
      fragment = appDom.addNode(fragment, queryNode, pageNode, 'queries');
    }
  }

  if (pageFile.content) {
    for (const child of pageFile.content) {
      fragment = mergeElementIntoDom(fragment, pageNode, 'children', child);
    }
  }

  return fragment;
}

function mergePageIntoDom(dom: appDom.AppDom, pageName: string, pageFile: PageType): appDom.AppDom {
  const appRoot = appDom.getRoot(dom);
  const pageFragment = createPageDomFromPageFile(pageName, pageFile);

  const newPageNode = appDom.getRoot(pageFragment);

  if (appDom.getMaybeNode(dom, newPageNode.id)) {
    dom = appDom.removeNode(dom, newPageNode.id);
  }

  dom = appDom.addFragment(dom, pageFragment, appRoot.id, 'pages');

  return dom;
}

function mergPagesIntoDom(dom: appDom.AppDom, pages: PagesContent): appDom.AppDom {
  for (const [name, page] of Object.entries(pages)) {
    dom = mergePageIntoDom(dom, name, page);
  }
  return dom;
}

type PagesContent = Record<string, PageType>;

interface ExtractedPages {
  pages: PagesContent;
  dom: appDom.AppDom;
}

function extractPagesFromDom(dom: appDom.AppDom): ExtractedPages {
  const rootNode = appDom.getApp(dom);
  const { pages: pageNodes = [] } = appDom.getChildNodes(dom, rootNode);

  const pages: PagesContent = {};

  for (const pageNode of pageNodes) {
    pages[pageNode.name] = expandFromDom(pageNode, dom);
    dom = appDom.removeNode(dom, pageNode.id);
  }

  return { pages, dom };
}

async function writePagesToFiles(pagesFolder: string, pages: PagesContent) {
  await Promise.all(
    Object.entries(pages).map(async ([name, page]) => {
      const pageFolder = path.resolve(pagesFolder, name);
      const pageFileName = path.resolve(pageFolder, 'page.yml');
      await updateYamlFile(pageFileName, page);
    }),
  );
}

interface ExtractedComponents {
  components: ComponentsContent;
  dom: appDom.AppDom;
}

function extractComponentsContentFromDom(dom: appDom.AppDom): ExtractedComponents {
  const rootNode = appDom.getApp(dom);
  const { codeComponents: codeComponentNodes = [] } = appDom.getChildNodes(dom, rootNode);

  const components: ComponentsContent = {};

  for (const codeComponent of codeComponentNodes) {
    components[codeComponent.name] = codeComponent.attributes.code.value;
    dom = appDom.removeNode(dom, codeComponent.id);
  }

  return { components, dom };
}

async function writeDomToDisk(dom: appDom.AppDom): Promise<void> {
  const root = getUserProjectRoot();
  const pagesFolder = getPagesFolder(root);

  const { pages: pagesContent, dom: domWithoutPages } = extractPagesFromDom(dom);
  dom = domWithoutPages;

  const { dom: domWithoutComponents } = extractComponentsContentFromDom(dom);
  dom = domWithoutComponents;

  await Promise.all([writeConfigFile(root, dom), writePagesToFiles(pagesFolder, pagesContent)]);
}

async function loadDomFromDisk(): Promise<appDom.AppDom> {
  const root = getUserProjectRoot();
  const [configContent, componentsContent, pagesContent] = await Promise.all([
    loadConfigFile(root),
    loadCodeComponentsFromFiles(root),
    loadPagesFromFiles(root),
  ]);
  let dom = configContent;

  dom = mergeComponentsContentIntoDom(dom, componentsContent);

  const app = appDom.getApp(dom);
  const { pages = [] } = appDom.getChildNodes(dom, app);
  for (const page of pages) {
    dom = appDom.removeNode(dom, page.id);
  }

  dom = mergPagesIntoDom(dom, pagesContent);
  return dom;
}

export async function openCodeEditor(file: string): Promise<void> {
  const userProjectRoot = getUserProjectRoot();
  const fullPath = path.resolve(userProjectRoot, file);
  openEditor([fullPath, userProjectRoot], {
    editor: process.env.EDITOR ? undefined : 'vscode',
  });
}

export async function openCodeComponentEditor(componentName: string): Promise<void> {
  const root = getUserProjectRoot();
  const componentsFolder = getComponentsFolder(root);
  const fullPath = getComponentFilePath(componentsFolder, componentName);
  const userProjectRoot = getUserProjectRoot();
  openEditor([fullPath, userProjectRoot], {
    editor: process.env.EDITOR ? undefined : 'vscode',
  });
}

export async function openQueryEditor() {
  const root = getUserProjectRoot();
  await initQueriesFile(root);
  const queriesFilePath = getQueriesFile(root);
  await openCodeEditor(queriesFilePath);
}

export type ProjectFolderEntry = {
  name: string;
  kind: 'query';
  filepath: string;
};

export async function readProjectFolder(): Promise<ProjectFolderEntry[]> {
  const userProjectRoot = getUserProjectRoot();
  const toolpadFolder = path.resolve(userProjectRoot, 'toolpad');
  const entries = await fs.readdir(toolpadFolder, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const match = /^(.*)\.query\.[jt]sx?$/.exec(entry.name);
    if (entry.isFile() && match) {
      const name = match[1];
      return [
        {
          name,
          kind: 'query',
          filepath: path.resolve(toolpadFolder, entry.name),
        },
      ];
    }
    return [];
  });
}

async function migrateLegacyPages(root: string) {
  const dom = await loadConfigFile(root);
  const { pages: pagesContent, dom: domWithoutPages } = extractPagesFromDom(dom);
  if (Object.keys(pagesContent).length > 0) {
    const pagesFolder = getPagesFolder(root);
    await Promise.all([
      writePagesToFiles(pagesFolder, pagesContent),
      writeConfigFile(root, domWithoutPages),
    ]);
  }
}

async function migrateLegacyComponents(root: string) {
  const dom = await loadConfigFile(root);
  const { components: componentsContent, dom: domWithoutComponents } =
    extractComponentsContentFromDom(dom);
  if (Object.keys(componentsContent).length > 0) {
    const pagesFolder = getPagesFolder(root);
    await Promise.all([
      writeCodeComponentsToFiles(pagesFolder, componentsContent),
      writeConfigFile(root, domWithoutComponents),
    ]);
  }
}

async function migrateProject(root: string) {
  let dom = await loadConfigFile(root);
  const domVersion = dom.version ?? 0;
  if (domVersion > appDom.CURRENT_APPDOM_VERSION) {
    console.error(
      `${chalk.red(
        'error',
      )} - This project was created with a newer version of Toolpad, please upgrade your ${chalk.cyan(
        '@mui/toolpad',
      )} installation`,
    );
  } else if (domVersion < appDom.CURRENT_APPDOM_VERSION) {
    // eslint-disable-next-line no-console
    console.log(
      `${chalk.blue(
        'info',
      )}  - This project was created by an older version of Toolpad. Upgrading...`,
    );

    dom = migrateUp(dom);

    await writeConfigFile(root, dom);
  }

  await migrateLegacyPages(root);
  await migrateLegacyComponents(root);
}

function getDomFilePatterns(root: string) {
  return [
    path.resolve(root, './toolpad.yml'),
    path.resolve(root, './toolpad.yml'),
    path.resolve(root, './toolpad/pages/*/page.yml'),
    path.resolve(root, './toolpad/components/*.*'),
  ];
}

/**
 * Calculates a fingerprint from all files that influence the dom structure
 */
async function calculateDomFingerprint(root: string): Promise<number> {
  const files = await glob(getDomFilePatterns(root));

  const mtimes = await Promise.all(
    files.sort().map(async (file) => {
      const stats = await fs.stat(file);
      return [file, stats.mtimeMs];
    }),
  );

  return insecureHash(JSON.stringify(mtimes));
}

async function initProject() {
  const root = getUserProjectRoot();

  await initToolpadFolder(root);
  await Promise.all([initGeneratedGitignore(root), initToolpadFile(root)]);
  await migrateProject(root);

  let [dom, fingerprint] = await Promise.all([loadDomFromDisk(), calculateDomFingerprint(root)]);

  const lock = new Lock();

  const updateDomFromExternal = debounce(() => {
    lock.use(async () => {
      const newFingerprint = await calculateDomFingerprint(root);
      if (fingerprint !== newFingerprint) {
        // eslint-disable-next-line no-console
        console.log(`${chalk.magenta('event')} - Project changed on disk, updating...`);
        [dom, fingerprint] = await Promise.all([loadDomFromDisk(), calculateDomFingerprint(root)]);
      }
    });
  }, 100);

  if (config.cmd === 'dev') {
    chokidar.watch(getDomFilePatterns(root)).on('all', () => {
      updateDomFromExternal();
    });
  }

  return {
    async loadDom() {
      return dom;
    },
    async saveDom(newDom: appDom.AppDom) {
      if (config.cmd !== 'dev') {
        throw new Error(`Writing to disk is only possible in toolpad dev mode.`);
      }

      await lock.use(async () => {
        await writeDomToDisk(newDom);
        const newFingerprint = await calculateDomFingerprint(root);

        dom = newDom;
        fingerprint = newFingerprint;
      });

      return { fingerprint };
    },
    async getDomFingerPrint() {
      return fingerprint;
    },
  };
}

// eslint-disable-next-line no-underscore-dangle
(globalThis as any).__project__ ??= initProject().catch((err) => {
  console.error(`${chalk.red('error')} - Failed to intialize Toolpad`);
  console.error(err);
  process.exit(1);
});

export async function waitForInit(): Promise<ReturnType<typeof initProject>> {
  // eslint-disable-next-line no-underscore-dangle
  return (globalThis as any).__project__;
}

export async function loadLocalDom(): Promise<appDom.AppDom> {
  const project = await waitForInit();
  return project.loadDom();
}

export async function saveLocalDom(newDom: appDom.AppDom): Promise<{ fingerprint: number }> {
  const project = await waitForInit();
  return project.saveDom(newDom);
}

export async function getDomFingerprint() {
  const project = await waitForInit();
  return project.getDomFingerPrint();
}
