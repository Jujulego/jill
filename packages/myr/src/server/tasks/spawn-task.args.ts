import { ArgsType, Field } from '@nestjs/graphql';

import { ISpawnTaskArgs } from '../../common';

// Args
@ArgsType()
export class SpawnTaskArgs implements ISpawnTaskArgs {
  // Attributes
  @Field()
  cwd: string;

  @Field()
  cmd: string;

  @Field(() => [String])
  args: string[];

  @Field(() => [String], { defaultValue: [] })
  watchOn: string[];
}

