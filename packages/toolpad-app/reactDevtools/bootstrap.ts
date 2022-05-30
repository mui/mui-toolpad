import { initialize as initializeDevtoolsBackend } from 'react-devtools-inline/backend';

if (typeof window !== 'undefined') {
  initializeDevtoolsBackend(window);
}
