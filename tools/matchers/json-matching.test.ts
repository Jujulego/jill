import { vi } from 'vitest';

import { jsonMatching } from './json-matching';

// Tests
describe('jsonMatching', () => {
  it('should parse object and match it against expected object', () => {
    const context = {
      isNot: false,
      promise: false,
      equals: vi.fn().mockReturnValue(true),
    };

    expect(jsonMatching.call(context, JSON.stringify({ test: true }), { test: true }))
      .toMatchObject({
        pass: true
      });

    expect(context.equals).toHaveBeenCalledWith({ test: true }, { test: true });
  });
});
