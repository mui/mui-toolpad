import path from 'path';
import fs from 'fs';

const repositoryRoot = path.resolve(__dirname, '../../../..');

export function getComponentImports(name: string, filename: string) {
  const relativePath = path.relative(repositoryRoot, filename);
  const directories = path.dirname(relativePath).split(path.sep);
  if (
    directories[0] !== 'packages' ||
    directories[1] !== 'toolpad-core' ||
    directories[2] !== 'src'
  ) {
    throw new Error(`The file ${filename} is not in the Toolpad Core package`);
  }

  if (directories.length < 4) {
    throw new Error(`The file ${filename} is not in a subdirectory of packages/toolpad-core/src`);
  }

  const componentDirectory = directories[3];
  if (componentDirectory === name) {
    const nextjsRelativePath = path.resolve(relativePath, '../../nextjs');
    const hasNextJsVersion = fs.existsSync(`${nextjsRelativePath}/${name}.tsx`);

    return [
      `import { ${name} } from '@toolpad/core/${name}';${
        hasNextJsVersion
          ? `\nimport { ${name} } from '@toolpad/core/nextjs/${name}'; // Next.js`
          : ''
      }`,
      `import { ${name} } from '@toolpad/core';${
        hasNextJsVersion ? `\nimport { ${name} } from '@toolpad/core/nextjs'; // Next.js` : ''
      }`,
    ];
  }

  return [`import { ${name} } from '@toolpad/core/${componentDirectory}';`];
}
