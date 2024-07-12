import { expect } from 'vitest';

import { ignoreColor, jsonMatching, toEqualLines, toMatchLines, toYield } from './index.js';

// Add custom matchers
expect.extend({
  ignoreColor,
  jsonMatching,
  toEqualLines,
  toMatchLines,
  toYield,
});
