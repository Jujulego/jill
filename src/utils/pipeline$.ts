import type { PipeStep } from 'kyrielle';

export function pipeline$<T>(): Pipeline<T, T>;
export function pipeline$(): Pipeline {
  const steps: PipeStep[] = [];

  return {
    add(step: PipeStep) {
      steps.push(step);
      return this;
    },
    build() {
      return (value: unknown) => steps.reduce((val, step) => step(val), value);
    }
  } as Pipeline;
}

export interface Pipeline<I = unknown, O = unknown> {
  add<R>(step: PipeStep<O, R>): Pipeline<I, R>;
  build(): PipeStep<I, O>;
}