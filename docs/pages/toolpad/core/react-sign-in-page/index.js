import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocs';
import { DocsContext } from '@toolpad/core/internals';
import * as pageProps from '../../../../data/toolpad/core/components/sign-in-page/sign-in-page.md?muiMarkdown';

export default function Page() {
  return (
    <DocsContext.Provider value>
      <MarkdownDocs disableAd {...pageProps} />
    </DocsContext.Provider>
  );
}
