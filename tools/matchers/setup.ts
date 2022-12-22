import { ignoreColor, jsonMatching, toEqualLines, toMatchLines, toYield } from './index';

// Add custom matchers
expect.extend({
  ignoreColor,
  jsonMatching,
  toEqualLines,
  toMatchLines,
  toYield,
});
