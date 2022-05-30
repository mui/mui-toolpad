import type { GetServerSideProps } from 'next';
import { asArray } from '../utils/collections';
import { ToolpadAppProps } from '../runtime/ToolpadApp';

export const getServerSideProps: GetServerSideProps<ToolpadAppProps> = async (context) => {
  const { loadVersionedDom, parseVersion } = await import('../server/data');

  const [appId] = asArray(context.query.appId);
  const version = parseVersion(context.query.version);
  if (!appId || !version) {
    return {
      notFound: true,
    };
  }

  const dom = await loadVersionedDom(appId, version);

  return {
    props: {
      appId,
      dom,
      version,
      basename: `/app/${appId}/${version}`,
    },
  };
};
