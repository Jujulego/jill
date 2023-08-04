// Types
export type Awaitable<T> = T | Promise<T>;
export type AwaitableGenerator<T> = Generator<T> | AsyncGenerator<T>;

export interface Type<T = unknown> {
  new(...args: unknown[]): T
}

export interface Class<T = unknown> extends Type<T> {
  readonly name: string;
}

export interface TaskUIContext {
  hidden?: boolean;
}
