import { ArgsType, Field, ID } from '@nestjs/graphql';

import { ITaskIDArgs } from '../../common';

// Args
@ArgsType()
export class TaskIDArgs implements ITaskIDArgs {
  // Attributes
  @Field(() => ID)
  id: string;
}
