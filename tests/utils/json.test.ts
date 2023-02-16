import { printJson } from '@/src/utils/json';

// Setup
let stream: NodeJS.WriteStream;

beforeEach(() => {
  stream = {
    isTTY: true,
    write: jest.fn() as NodeJS.WriteStream['write'],
  } as NodeJS.WriteStream;
});

// Tests
describe('printJson', () => {
  it('should pretty print on ttys', () => {
    printJson({ test: 5 }, stream);

    expect(stream.write).toHaveBeenCalledWith('{\n  "test": 5\n}');
  });

  it('should print json on one line if not on tty', () => {
    stream.isTTY = false;
    printJson({ test: 5 }, stream);

    expect(stream.write).toHaveBeenCalledWith('{"test":5}');
  });
});
