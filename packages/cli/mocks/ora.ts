import ora from 'ora';

// Mock
jest.mock('ora');

export const mockedOra = {
  // Attributes
  isSpinning: false,
  text: '',

  // Methods
  start(text?: string) {
    this.isSpinning = true;
    this.text = text ?? this.text;

    return this;
  },

  stop() {
    this.isSpinning = false;

    return this;
  },

  succeed(text?: string): ora.Ora {
    this.isSpinning = false;
    this.text = text ?? this.text;

    return this;
  },

  fail(text?: string): ora.Ora {
    this.isSpinning = false;
    this.text = text ?? this.text;

    return this;
  },

  clear(): ora.Ora {
    return this;
  },

  stopAndPersist(opts: ora.PersistOptions) {
    this.isSpinning = false;
    this.text = opts?.text ?? this.text;

    return this;
  }
};

(ora as jest.MockedFunction<typeof ora>)
  .mockReturnValue(mockedOra as ora.Ora);
