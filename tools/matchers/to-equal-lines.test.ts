import type { MatcherState } from '@vitest/expect';
import { describe, expect, it, vi } from 'vitest';

import { toEqualLines } from './to-equal-lines.js';

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
