import * as React from 'react';
import MarkdownDocs from '@mui/monorepo-docs/src/modules/components/MarkdownDocs';
import * as pageProps from '../../../data/toolpad/getting-started/overview.md?@mui/markdown';

export default function Page() {
  return <MarkdownDocs disableAd {...pageProps} />;
}
