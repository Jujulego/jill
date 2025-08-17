import { type Class } from '@/src/types.js';
import { type interfaces as int } from 'inversify';

// Symbols
const REGISTRY = Symbol('jujulego:jill:registry');

// Utils
export function getRegistry(target: Class): int.ContainerModuleCallBack {
  const registry = Reflect.getMetadata(REGISTRY, target);

  if (typeof registry !== 'function') {
    throw new Error(`No registry found in ${target.name}`);
  }

  return registry;
}

export function setRegistry(target: Class, registry: int.ContainerModuleCallBack) {
  Reflect.defineMetadata(REGISTRY, registry, target);
}
