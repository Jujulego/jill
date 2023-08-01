import { ContainerModule, type interfaces as int } from 'inversify';

import { type Class } from '@/src/types.ts';

// Symbols
const MODULE = Symbol('jujulego:jill:module');
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

export function getModule(target: Class): ContainerModule | null;
export function getModule(target: Class, assert: true): ContainerModule;
export function getModule(target: Class, assert = false): ContainerModule | null {
  let module = Reflect.getMetadata(MODULE, target);

  if (!module || !(module instanceof ContainerModule)) {
    const registry = Reflect.getMetadata(REGISTRY, target);

    if (typeof registry !== 'function') {
      if (assert) {
        throw new Error(`No module found in ${target.name}`);
      }

      return null;
    }

    module = new ContainerModule(registry);
    setModule(target, module);
  }

  return module;
}

export function setModule(target: Class, module: ContainerModule) {
  Reflect.defineMetadata(MODULE, module, target);
}
