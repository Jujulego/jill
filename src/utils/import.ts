// Utils
export function dynamicImport<M>(filepath: string): Promise<M> {
  return import(/* webpackIgnore: true */ process.platform === 'win32' ? `file://${filepath}` : filepath) as Promise<M>;
}
