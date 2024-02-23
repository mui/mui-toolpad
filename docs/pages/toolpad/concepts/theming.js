import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocs';
import * as pageProps from '../../../data/toolpad/concepts/theming.md?@mui/internal-markdown';

export default function Page() {
  return <MarkdownDocs disableAd {...pageProps} />;
}
