import { cosmiconfig, defaultLoaders } from 'cosmiconfig';
import { interfaces as int } from 'inversify';

import { container } from '@/src/services/inversify.config';
import { dynamicImport } from '@/src/utils/import';

// Types
export type ConfigExplorer = ReturnType<typeof cosmiconfig>;

// Symbols
export const CONFIG_EXPLORER: int.ServiceIdentifier<ConfigExplorer> = Symbol('jujulego:jill:ConfigExplorer');

// Setup
container.bind(CONFIG_EXPLORER).toDynamicValue(() => {
  return cosmiconfig('jill', {
    loaders: {
      '.cjs': (filepath) => dynamicImport(filepath).then((mod) => mod.default),
      '.js': (filepath) => dynamicImport(filepath).then((mod) => mod.default),
      '.json': defaultLoaders['.json'],
      '.yaml': defaultLoaders['.yaml'],
      '.yml': defaultLoaders['.yml'],
      noExt: defaultLoaders.noExt,
    }
  });
}).inSingletonScope();
