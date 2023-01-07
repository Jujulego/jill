// Types
export type Awaitable<T> = T | Promise<T>;
export type AwaitableGenerator<T> = Generator<T> | AsyncGenerator<T>;

export type Type<T> = { new (...args: any[]): T };
