import { container, ParserService } from '../../src/services';

// Setup
let service: ParserService;

beforeEach(() => {
  container.snapshot();
  service = container.get(ParserService);
});

afterEach(() => {
  container.restore();
});

// Tests
describe('ParserService.parse', () => {
  it('should return something', () => {
    expect(service.parse('(toto -> \'ta\\\'ta\') // "tu\\"tu"'))
      .toEqual(['(', 'toto', ' ', '->', ' ', 'ta\'ta', ')', ' ', '//', ' ', 'tu"tu']);
  });
});
