// Types
export type Awaitable<T> = T | Promise<T>;
export type AwaitableGenerator<T> = Generator<T> | AsyncGenerator<T>;

export interface Type<T = any> {
  new(...args: any[]): T
}

export interface Class<T = any> extends Type<T> {
  readonly name: string;
}
