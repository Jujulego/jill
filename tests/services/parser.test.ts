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
    expect(service.parse('(toto -> \'tata\') // "tutu"'))
      .toEqual({
        roots: [
          {
            operator: '//',
            tasks: [
              {
                operator: '->',
                tasks: [
                  { script: 'toto' },
                  { script: 'tata' },
                ]
              },
              { script: 'tutu' }
            ]
          }
        ]
      });
  });
});
