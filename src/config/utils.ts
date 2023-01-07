import { interfaces as int } from 'inversify';
import { ValidateFunction } from 'ajv';
import { cosmiconfig, defaultLoaders } from 'cosmiconfig';

import { AJV } from '@/src/ajv.config';
import schema from '@/src/assets/schema.json';
import { container } from '@/src/inversify.config';
import { dynamicImport } from '@/src/utils/import';

import { type IConfig, type IConfigExplorer } from './types';

// Symbols
export const CONFIG_EXPLORER: int.ServiceIdentifier<IConfigExplorer> = Symbol('jujulego:jill:config-explorer');
export const CONFIG_VALIDATOR: int.ServiceIdentifier<ValidateFunction<IConfig>> = Symbol('jujulego:jill:config-validator');

// Setup
container
  .bind(CONFIG_VALIDATOR)
  .toDynamicValue((context) => {
    const ajv = context.container.get(AJV);
    return ajv.compile<IConfig>(schema);
  })
  .inSingletonScope();

container
  .bind(CONFIG_EXPLORER)
  .toDynamicValue(() => {
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
  })
  .inSingletonScope();
