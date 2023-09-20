import path from 'node:path';

import { $log } from '@/src/commons/logger/log.tag.js';

// Tests
describe('$log', () => {
  it('should just return the original string', () => {
    expect($log`test`).toBe('test');
  });

  it('should behave like normal template', () => {
    expect($log`test ${5} success`).toBe('test 5 success');
  });

  it('should ignore unknown command', () => {
    expect($log`test #test:${5} success`).toBe('test #test:5 success');
  });

  describe('#cwd:', () => {
    it('should print path relative to process.cwd', () => {
      expect($log`test #cwd:${'/toto'}`).toBe(`test ${path.relative(process.cwd(), '/toto')}`);
    });

    it('should print "." if path is process.cwd', () => {
      expect($log`test #cwd:${process.cwd()}`).toBe('test .');
    });
  });
});
