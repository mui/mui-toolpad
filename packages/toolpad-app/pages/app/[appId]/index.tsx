import type { GetServerSideProps, NextPage } from 'next';
import * as React from 'react';
import * as appDom from '../../../src/appDom';
import ToolpadApp from '../../../src/components/ToolpadApp';

interface PageProps {
  appId: string;
  dom: appDom.AppDom;
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const { loadDom } = await import('../../../src/server/data');
  const appId = context.query.appId as string;
  const dom = await loadDom(appId);
  const root = appDom.getApp(dom);
  const { pages = [] } = appDom.getChildNodes(dom, root);
  return {
    props: {
      pageNodeId: pages,
      appId,
      dom,
    },
  };
};

const Index: NextPage<PageProps> = (props) => {
  return <ToolpadApp dom={props.dom} appId={props.appId} version="preview" />;
};

export default Index;
