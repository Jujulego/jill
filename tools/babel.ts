import _babel from 'gulp-babel';

// Types
export type BabelOptions = Parameters<typeof _babel>[0] & { envName?: string };

// Step
export function babel(options: BabelOptions = {}) {
  return _babel(options);
}
