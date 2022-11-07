import yargs from 'yargs';

import { applyMiddlewares, defineMiddleware } from '../../src/utils';

// Tests
describe('applyMiddlewares', () => {
  it('should add middleware arguments and handler', () => {
    const mdw = defineMiddleware({
      builder: (yargs) => yargs
        .options('test', { type: 'number' }),
      handler: jest.fn()
    });

    const parser = applyMiddlewares(yargs, [mdw]);
    parser.parse('--test 42');

    expect(mdw.handler)
      .toHaveBeenCalledWith(expect.objectContaining({ test: 42 }), parser);
  });
});
