import { injectable } from 'inversify';
import moo from 'moo';

import { container } from './inversify.config';

// Service
@injectable()
export class ParserService {
  // Methods
  private _lexer(): moo.Lexer {
    return moo.states({
      task: {
        lparen: '(',
        whitespace: /[ \t]+/,
        string: [
          // inline
          { match: /[:a-zA-Z0-9]+/, push: 'operator' },
          // single cotted
          {
            match: /'(?:\\['\\]|[^\n'\\])+'/,
            push: 'operator',
            value: x => x.slice(1, -1).replace(/\\'/g, '\'')
          },
          // double cotted
          {
            match: /"(?:\\["\\]|[^\n"\\])+"/,
            push: 'operator',
            value: x => x.slice(1, -1).replace(/\\"/g, '"')
          }
        ],
      },
      operator: {
        whitespace: /[ \t]+/,
        rparen: ')',
        operator: { match: ['->', '//'], pop: 1 },
      }
    });
  }

  parse(expr: string): string[] {
    const tokens: string[] = [];

    for (const token of this._lexer().reset(expr)) {
      tokens.push(token.value);
    }

    return tokens;
  }
}

container.bind(ParserService)
  .toSelf();
