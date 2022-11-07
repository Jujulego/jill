import { jill } from './utils';

// Tests
describe('jill tree', () => {
  it('should print workspace dependency tree', async () => {
    await expect(jill(['tree'])).
resolves.toMatchInlineSnapshot(`
{
  "code": 0,
  "stderr": [
    "⠋ Loading project ...",
    "[2K[1A[2K[G⠋ Loading "." workspace ...",
    "[2K[1A[2K[G@jujulego/jill[90m@2.0.1[39m",
  ],
  "stdout": [],
}
`);
  });
});
