// Types
export type Awaitable<T> = T | Promise<T>;
export type AwaitableGenerator<T> = Generator<T> | AsyncGenerator<T>;

export interface Type<T = unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new(...args: any[]): T
}

export interface Class<T = unknown> extends Type<T> {
  readonly name: string;
}

export interface TaskUIContext {
  hidden?: boolean;
}
