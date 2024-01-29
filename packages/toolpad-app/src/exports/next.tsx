'use server';

import * as React from 'react';
import ToolpadAppClient from './next-client';
import { loadDom } from '../server/localMode';
import createRuntimeState from '../runtime/createRuntimeState';

export interface ToolpadAppServerProps {
  base: string;
  dir: string;
}

export async function ToolpadApp({ base, dir = './toolpad' }: ToolpadAppServerProps) {
  const dom = await loadDom(dir);
  const initialState = createRuntimeState({ dom });

  return <ToolpadAppClient basename={base} state={initialState} />;
}
