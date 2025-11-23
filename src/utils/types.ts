export type Order = 'asc' | 'desc';
export type PackageManager = 'npm' | 'yarn';
export type Writable<T> = { -readonly [K in keyof T]: T[K] };
export type Awaitable<T> = T | PromiseLike<T>;

export interface TaskUIContext {
  hidden?: boolean;
}