import type { NextPage } from 'next';
import * as React from 'react';
import ToolpadApp, { ToolpadAppProps } from '../runtime/ToolpadApp';

const App: NextPage<ToolpadAppProps> = (props) => <ToolpadApp {...props} />;
export default App;
