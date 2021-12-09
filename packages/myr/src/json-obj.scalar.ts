import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

// Types
export const JSONObject = Symbol('jujulego:jill-myr:JSONObject');

// Scalar
@Scalar('JSONObject', () => JSONObject)
export class JSONObjectScalar implements CustomScalar<unknown, unknown> {
  // Attributes
  description = 'JSON data';

  // Methods
  parseValue(value: unknown): unknown {
    return value;
  }

  serialize(value: unknown): unknown {
    return value;
  }

  parseLiteral(ast: ValueNode): unknown {
    if (ast.kind === Kind.STRING) {
      return ast.value;
    }

    return null;
  }
}
