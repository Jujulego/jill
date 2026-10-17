import { startSpan } from '@sentry/node';
import { type Key, useInput } from 'ink';

export function useTracedInput(cb: (input: string, key: Key) => void) {
  useInput((input, key) => {
    startSpan({ op: 'ui.interaction.press', name: 'Key press'}, () => {
      cb(input, key);
    });
  });
}