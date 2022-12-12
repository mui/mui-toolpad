import { NodeId } from '@mui/toolpad-core';
import * as path from 'path';
import * as appDom from '../../appDom';
import { migrateUp } from '../../appDom/migrations';
import { AppTemplateId } from '../../types';
import { readJsonFile } from '../../utils/fs';
import config from '../config';
import projectRoot from '../projectRoot';

const DOMS_DIR_PATH = './src/server/appTemplateDoms';
const getAppTemplateDomFromPath = (templatePath: string): Promise<appDom.AppDom> =>
  readJsonFile(path.resolve(projectRoot, DOMS_DIR_PATH, templatePath));

const appTemplates: Record<AppTemplateId, () => Promise<appDom.AppDom | null>> = {
  blank: async () => null,
  images: async () =>
    getAppTemplateDomFromPath(config.isDemo ? './images-demo.json' : './images.json'),
  default: async () => {
    const template = await getAppTemplateDomFromPath('./default.json');
    (
      template.nodes['1313wn3' as NodeId] as appDom.QueryNode
    ).attributes.query.value.url.value = `${config.externalUrl}/static/employees.json`;
    return template;
  },
};

export async function getAppTemplateDom(
  appTemplateId: AppTemplateId,
): Promise<appDom.AppDom | null> {
  const dom = await appTemplates[appTemplateId]();
  return dom ? migrateUp(dom) : null;
}
