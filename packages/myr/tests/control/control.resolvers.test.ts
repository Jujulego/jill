import { $control, ControlResolvers } from '../../src/control/control.resolvers';

// Setup
const $spy = jest.fn();

beforeAll(() => {
  $control.subscribe($spy);
});

beforeEach(() => {
  jest.resetAllMocks();
});

// Test suites
describe('mutation shutdown', () => {
  // Tests
  it('should emit shutdown event and then return true', () => {
    // Call
    expect(ControlResolvers.Mutation.shutdown()).toBe(true);

    // Checks
    expect($spy).toHaveBeenCalledWith({ value: null, action: 'shutdown' });
  });
});