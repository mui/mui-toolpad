import * as fs from 'fs/promises';
import * as path from 'path';
import globCb from 'glob';
import { promisify } from 'util';

const PUBLIC_FOLDER = process.env.PUBLIC_FOLDER || path.resolve(__dirname, '../public');

const glob = promisify(globCb);

const LIBS = [
  { name: 'react' },
  { name: 'react-dom' },
  { name: '@mui/material' },
  // TODO: we need to analyze imports of the definition files and include those libs automatically
  { name: 'csstype' },
  { name: 'react-transition-group' },
  { name: '@mui/base' },
  { name: '@mui/types' },
  { name: '@mui/system' },
  { name: '@mui/utils' },
  { name: '@mui/toolpad-core' },
  { name: '@mui/x-date-pickers' },
  { name: '@mui/x-data-grid-pro' },
];

function getModuleId(fileName: string, pkgDir: string, pkgName: string) {
  return path.join(`node_modules/${pkgName}/`, path.relative(pkgDir, fileName));
}

async function main() {
  const allFiles: { filename: string; moduleId: string }[] = (
    await Promise.all(
      LIBS.map(async ({ name }) => {
        const files: { filename: string; moduleId: string }[] = [];
        const resolvedPkg = require.resolve(`${name}/package.json`);
        const pkgJson = await import(resolvedPkg);
        const pkgDir = path.dirname(resolvedPkg);

        const dtsFiles = await glob('**/*.d.ts', {
          cwd: pkgDir,
          absolute: true,
        });

        if (dtsFiles.length > 0) {
          files.push(
            { filename: resolvedPkg, moduleId: getModuleId(resolvedPkg, pkgDir, pkgJson.name) },
            ...dtsFiles.map((fileName) => ({
              filename: fileName,
              // hack around monorepo packages
              moduleId: getModuleId(fileName, pkgDir, pkgJson.name),
            })),
          );
        }

        try {
          let typesLib = name;
          if (name.startsWith('@')) {
            const [part1, part2] = name.slice(1).split('/');
            typesLib = `${part1}__${part2}`;
          }
          const resolvedTypesPkg = require.resolve(`@types/${typesLib}/package.json`);
          const typesDtsFiles = await glob('**/*.d.ts', {
            cwd: path.dirname(resolvedTypesPkg),
            absolute: true,
          });
          if (typesDtsFiles.length > 0) {
            files.push(
              {
                filename: resolvedPkg,
                moduleId: getModuleId(resolvedTypesPkg, pkgDir, pkgJson.name),
              },
              ...typesDtsFiles.map((fileName) => ({
                filename: fileName,
                // hack around monorepo packages
                moduleId: getModuleId(fileName, pkgDir, pkgJson.name),
              })),
            );
          }
          // eslint-disable-next-line no-empty
        } catch (err) {}

        return files;
      }),
    )
  ).flat();

  const result: Record<string, string> = Object.assign(
    {},
    ...(await Promise.all(
      allFiles.map(async ({ filename, moduleId }) => {
        return { [moduleId]: await fs.readFile(filename, { encoding: 'utf-8' }) };
      }),
    )),
  );

  await fs.writeFile(path.resolve(PUBLIC_FOLDER, './typings.json'), JSON.stringify(result), {
    encoding: 'utf-8',
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
