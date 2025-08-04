import { token$ } from '@kyrielle/injector';
import { cosmiconfig, defaultLoaders } from 'cosmiconfig';
import { dynamicImport } from '../utils/import.js';

export const ConfigExplorer = token$('ConfigExplorer', () => cosmiconfig('jill', {
  searchStrategy: 'global',
  loaders: {
    '.cjs': (filepath) => dynamicImport<{ default: unknown }>(filepath).then((mod) => mod.default),
    '.js': (filepath) => dynamicImport<{ default: unknown }>(filepath).then((mod) => mod.default),
    '.json': defaultLoaders['.json'],
    '.yaml': defaultLoaders['.yaml'],
    '.yml': defaultLoaders['.yml'],
    noExt: defaultLoaders.noExt,
  }
}));
