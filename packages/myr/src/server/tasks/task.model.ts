import { ArgsType, Field, ID } from '@nestjs/graphql';

// Args
@ArgsType()
export class TaskArgs {
  @Field(() => ID)
  id: string;
}

@ArgsType()
export class SpawnArgs {
  @Field()
  cwd: string;

  @Field()
  cmd: string;

  @Field(() => [String])
  args: string[];
}

