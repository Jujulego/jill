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
  it('should return simple task (inline syntax)', () => {
    expect(service.parse('toto:dev'))
      .toEqual({
        roots: [
          { script: 'toto:dev' },
        ]
      });
  });

  it('should return simple task (single cote syntax)', () => {
    expect(service.parse('\'\\\\single\\\'cote\\\\\''))
      .toEqual({
        roots: [
          { script: '\\single\'cote\\' },
        ]
      });
  });

  it('should return simple task (double cote syntax)', () => {
    expect(service.parse('"\\\\double\\"cote\\\\"'))
      .toEqual({
        roots: [
          { script: '\\double"cote\\' },
        ]
      });
  });

  it('should return complex tree with 2 operators', () => {
    expect(service.parse('(toto // tata) -> tutu'))
      .toEqual({
        roots: [
          {
            operator: '->',
            tasks: [
              {
                operator: '//',
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
