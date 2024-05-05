'use server';

import { initProject as initProjectOrig } from '../server/localMode';

const PROJECT_REF = Symbol.for('PROJECT_REF');

export async function initProject() {
  if (!(globalThis as any)[PROJECT_REF]) {
    (globalThis as any)[PROJECT_REF] = initProjectOrig({ dir: './toolpad' });
  }

  return (globalThis as any)[PROJECT_REF];
}
