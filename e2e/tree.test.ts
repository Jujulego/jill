import { jill, MOCK } from './utils';

// Tests
describe('jill tree', () => {
  it('should print workspace dependency tree', async () => {
    await expect(jill(['tree', '-w', 'mock-test-a'], { cwd: MOCK })).
resolves.toMatchInlineSnapshot(`
{
  "code": 0,
  "stderr": [
    "⠋ Loading project ...",
    "[2K[1A[2K[G",
    "[2K[1A[2K[Gmock-test-a",
    "├─ mock-test-b",
    "└─ [34mmock-test-c[39m",
    "[2K[1A[2K[1A[2K[1A[2K[Gmock-test-a",
    "├─ mock-test-b",
    "│  ├─ [34mmock-test-c[39m",
    "│  │  [34m└─ [39m[34mmock-test-d[39m",
    "│  └─ [34mmock-test-d[39m",
    "└─ [34mmock-test-c[39m",
    "   [34m└─ [39m[34mmock-test-d[39m",
  ],
  "stdout": [],
}
`);
  });
});
