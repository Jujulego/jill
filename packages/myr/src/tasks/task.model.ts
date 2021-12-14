import { TaskStatus } from '@jujulego/jill-core';
import { ArgsType, Field, ID, ObjectType } from '@nestjs/graphql';
import { gql } from 'graphql.macro';

// Models
@ObjectType()
export class Task {
  @Field(() => ID)
  id: string;

  @Field({ description: 'Task working directory' })
  cwd: string;

  @Field({ description: 'Task command' })
  cmd: string;

  @Field(() => [String], { description: 'Task command arguments' })
  args: readonly string[];

  @Field(() => String, { description: 'Task current status' })
  status: TaskStatus;
}

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

// Fragments
export const TaskFragment = gql`
    fragment Task on Task {
        id
        cwd
        cmd
        args
        status
    }
`;