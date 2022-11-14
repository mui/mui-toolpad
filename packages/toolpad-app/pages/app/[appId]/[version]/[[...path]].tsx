import type { GetServerSideProps, NextPage } from 'next';
import * as React from 'react';
import { asArray } from '../../../../src/utils/collections';
import ToolpadApp, { ToolpadAppProps } from '../../../../src/runtime/ToolpadApp';

export const getServerSideProps: GetServerSideProps<ToolpadAppProps> = async (context) => {
  const { loadRenderTree, parseVersion, getApp } = await import('../../../../src/server/data');

  const [appId] = asArray(context.query.appId);
  const version = parseVersion(context.query.version);
  const app = appId ? await getApp(appId) : null;
  if (!appId || !app || !version) {
    return {
      notFound: true,
    };
  }

  const dom = await loadRenderTree(appId, version);

  return {
    props: {
      appId,
      dom,
      version,
      basename: `/app/${appId}/${version}`,
    },
  };
};

const App: NextPage<ToolpadAppProps> = (props) => <ToolpadApp {...props} />;
export default App;
