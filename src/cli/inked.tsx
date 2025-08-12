import { type Instance, render } from 'ink';
import type { ReactNode } from 'react';
import StaticLogs from './components/StaticLogs.jsx';

/**
 * Renders each yielded element using ink
 */
export function inked<P, R>(stepper: InkedStepper<P, R>): InkedComponent<P, R> {
  return async (props: P): Promise<R> => {
    const controller = new AbortController();

    const app = render(<StaticLogs />, { exitOnCtrlC: true });
    void app.waitUntilExit().then(() => {
      controller.abort();
    });

    try {
      const generator = stepper(props, { app, controller });
      let result = await generator.next();

      while (!result.done) {
        app.rerender(
          <>
            <StaticLogs />
            { result.value }
          </>
        );

        result = await generator.next();
      }

      return result.value;
    } finally {
      app.unmount();
    }
  };
}

// Types
export interface InkedContext {
  readonly app: Instance;
  readonly controller: AbortController;
}

export type InkedStepper<P, R> = (props: P, context: InkedContext) => AsyncGenerator<ReactNode, R> | Generator<ReactNode, R>;
export type InkedComponent<P, R> = (props: P) => Promise<R>;
