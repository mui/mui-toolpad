import invariant from 'invariant';
import v1 from './v1';
import v2 from './v2';
import { CURRENT_APPDOM_VERSION } from '..';

const versions = new Map([
  [1, v1],
  [2, v2],
]);

export const latestVersion = Array.from(versions.keys()).pop() as number;

invariant(versions.size === CURRENT_APPDOM_VERSION, 'Unable to find the latest version');

export const latestMigration = versions.get(latestVersion);
