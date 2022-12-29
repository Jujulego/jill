import { cosmiconfig } from 'cosmiconfig';
import { interfaces } from 'inversify';

import { container } from './inversify.config';

// Constants
export const CONFIG: interfaces.ServiceIdentifier<Config> = Symbol('jujulego:jill:Config');

// Types
export interface Config {
  jobs?: number;
  verbose?: number;
}

// Dynamic load
container.bind(CONFIG).toDynamicValue(async () => {
  const explorer = cosmiconfig('jill');
  const res = await explorer.search();

  return res?.config ?? {};
}).inSingletonScope();
