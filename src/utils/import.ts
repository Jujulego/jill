// Utils
export async function dynamicImport(filepath: string) {
  return import(/* webpackIgnore: true */ process.platform === 'win32' ? `file://${filepath}` : filepath);
}

export function fixDefaultExport<T extends { default: unknown }>(mod: T): T['default'] {
  return ('default' in mod ? mod.default : mod) as T['default'];
}