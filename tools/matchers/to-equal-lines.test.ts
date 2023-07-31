import type { MatcherState } from '@vitest/expect';
import { vi } from 'vitest';

import { toEqualLines } from './to-equal-lines';

// Tests
describe('toEqualLines', () => {
  it('should compare a string to an array of lines', () => {
    const context = {
      isNot: false,
      promise: false,
      equals: vi.fn().mockReturnValue(true),
    } as unknown as MatcherState;

    expect(toEqualLines.call(context, 'toto\ntata', ['toto', 'tata']))
      .toMatchObject({
        pass: true
      });

    expect(context.equals).toHaveBeenCalledWith(['toto', 'tata'], ['toto', 'tata']);
  });
});
