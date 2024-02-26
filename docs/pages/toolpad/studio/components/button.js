import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocs';
import * as pageProps from '../../../../data/toolpad/studio/components/button/button.md?@mui/markdown';

export default function Page() {
  return <MarkdownDocs disableAd {...pageProps} />;
}
