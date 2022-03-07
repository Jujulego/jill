import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsHash } from 'class-validator';

import { ITaskIDArgs } from '../../common';

// Args
@ArgsType()
export class TaskIDArgs implements ITaskIDArgs {
  // Attributes
  @Field(() => ID)
  @IsHash('md5')
  id: string;
}
