// Utils
export async function dynamicImport<M>(filepath: string): Promise<M> {
  return import(/* webpackIgnore: true */ process.platform === 'win32' ? `file://${filepath}` : filepath) as Promise<M>;
}

export function fixDefaultExport<T extends { default: unknown }>(mod: T): T['default'] {
  return ('default' in mod ? mod.default : mod) as T['default'];
}
