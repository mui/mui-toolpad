import * as React from 'react';
import MarkdownDocs from 'docs/src/modules/components/MarkdownDocs';
import {
  demos,
  docs,
  demoComponents,
} from '../../../data/toolpad/data-binding/event-handling.md?@mui/markdown';

export default function Page() {
  return <MarkdownDocs demos={demos} docs={docs} demoComponents={demoComponents} disableAd />;
}
