import { type Plugin } from './types';

// Plugin utils
export function definePlugin<T, U>(plugin: Plugin<T, U>): Plugin<T, U> {
  return plugin;
}

export function assertPlugin(obj: unknown, name: string): asserts obj is Plugin {
  if (!obj) {
    throw new Error(`Plugin ${name} is not a valid plugin. Default export is null or undefined`);
  }

  if (typeof obj !== 'object') {
    throw new Error(`Plugin ${name} is not a valid plugin. Default export is a ${typeof obj}`);
  }

  if (!('builder' in obj)) {
    throw new Error(`Plugin ${name} is not a valid plugin. Missing builder method in default export`);
  }
}
